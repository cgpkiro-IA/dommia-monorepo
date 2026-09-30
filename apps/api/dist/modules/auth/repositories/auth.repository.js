"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRepository = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const database_service_1 = require("../../../database/database.service");
let AuthRepository = class AuthRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async registerResidentPushToken(claims, dto) {
        const tenant = await this.db.query(`SELECT id FROM public.tenants
       WHERE LOWER(REPLACE(slug, '-', '_')) = LOWER(REPLACE($1, '-', '_'))
       LIMIT 1`, [claims.tenantSlug]);
        if (!tenant.rows[0])
            return null;
        const result = await this.db.query(`
      INSERT INTO public.resident_push_tokens
        (tenant_id, resident_id, session_jti, client_type, device_id, token, is_active, last_seen_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW(), NOW())
      ON CONFLICT (tenant_id, resident_id, client_type, device_id)
      DO UPDATE SET
        session_jti = EXCLUDED.session_jti,
        token = EXCLUDED.token,
        is_active = TRUE,
        last_seen_at = NOW(),
        updated_at = NOW()
      RETURNING id, device_id AS "deviceId", client_type AS "clientType", is_active AS "isActive", last_seen_at AS "lastSeenAt"
    `, [tenant.rows[0].id, claims.sub, claims.jti, claims.clientType, dto.deviceId, dto.token]);
        return result.rows[0] || null;
    }
    async revokeResidentPushToken(claims, deviceId) {
        const tenant = await this.db.query(`SELECT id FROM public.tenants
       WHERE LOWER(REPLACE(slug, '-', '_')) = LOWER(REPLACE($1, '-', '_'))
       LIMIT 1`, [claims.tenantSlug]);
        if (!tenant.rows[0])
            return null;
        const result = await this.db.query(`
      UPDATE public.resident_push_tokens
      SET is_active = FALSE, updated_at = NOW()
      WHERE tenant_id = $1 AND resident_id = $2 AND client_type = $3 AND device_id = $4
      RETURNING id, device_id AS "deviceId", client_type AS "clientType", is_active AS "isActive"
    `, [tenant.rows[0].id, claims.sub, claims.clientType, deviceId]);
        return result.rows[0] || null;
    }
    async recordResidentAudit(slug, action, entityId, metadata) {
        try {
            const tenant = await this.db.query(`
        SELECT id FROM public.tenants
        WHERE LOWER(REPLACE(slug, '-', '_')) = LOWER(REPLACE($1, '-', '_'))
        LIMIT 1
      `, [slug]);
            await this.db.query(`INSERT INTO public.audit_logs (tenant_id, action, entity, entity_id, new_value)
         VALUES ($1, $2, 'ResidentAuth', $3, $4::jsonb)`, [tenant.rows[0]?.id || null, action, entityId, JSON.stringify(metadata || {})]);
        }
        catch {
        }
    }
    async createResidentInvitation(slug, residentId, createdBy) {
        const token = (0, crypto_1.randomBytes)(32).toString('base64url');
        const tokenHash = (0, crypto_1.createHash)('sha256').update(token).digest('hex');
        await this.db.queryTenant(slug, 'UPDATE resident_invitations SET revoked_at = NOW() WHERE resident_id = $1 AND used_at IS NULL AND revoked_at IS NULL', [residentId]);
        const validCreatedBy = createdBy && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(createdBy)
            ? createdBy
            : null;
        const result = await this.db.queryTenant(slug, `
      INSERT INTO resident_invitations (resident_id, token_hash, expires_at, created_by)
      VALUES ($1, $2, NOW() + INTERVAL '24 hours', $3)
      RETURNING id, expires_at
    `, [residentId, tokenHash, validCreatedBy]);
        return { ...result.rows[0], token };
    }
    async createResidentSession(jti, residentId, tenantSlug, expiresAt) {
        await this.db.query('INSERT INTO public.resident_sessions (jti, resident_id, tenant_slug, expires_at) VALUES ($1, $2, $3, $4)', [jti, residentId, tenantSlug, expiresAt]);
    }
    async createResidentAppSession(input) {
        return this.db.withTransaction(async (client) => {
            const session = await client.query(`
        INSERT INTO public.resident_sessions (
          jti, resident_id, tenant_slug, expires_at, client_type, device_id, device_name,
          last_used_at, refresh_expires_at, refresh_absolute_expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9)
        RETURNING id, jti
      `, [
                input.jti,
                input.residentId,
                input.tenantSlug,
                input.refreshAbsoluteExpiresAt,
                input.clientType,
                input.deviceId || null,
                input.deviceName || null,
                input.refreshExpiresAt,
                input.refreshAbsoluteExpiresAt,
            ]);
            const row = session.rows[0];
            await client.query(`
        INSERT INTO public.resident_refresh_tokens (session_id, token_hash, expires_at)
        VALUES ($1, $2, $3)
      `, [row.id, input.refreshTokenHash, input.refreshExpiresAt]);
            return row;
        });
    }
    async rotateResidentAppRefreshToken(currentTokenHash, nextTokenHash) {
        return this.db.withTransaction(async (client) => {
            const found = await client.query(`
        SELECT rt.id AS refresh_id, rt.session_id, rt.expires_at AS token_expires_at,
               rt.used_at, rt.revoked_at AS token_revoked_at,
               s.jti, s.resident_id, s.tenant_slug, s.client_type, s.device_id, s.device_name,
               s.revoked_at AS session_revoked_at, s.refresh_absolute_expires_at
        FROM public.resident_refresh_tokens rt
        JOIN public.resident_sessions s ON s.id = rt.session_id
        WHERE rt.token_hash = $1
        FOR UPDATE OF rt, s
      `, [currentTokenHash]);
            const session = found.rows[0];
            if (!session)
                return { kind: 'INVALID' };
            if (session.session_revoked_at || new Date(session.refresh_absolute_expires_at).getTime() <= Date.now()) {
                return { kind: 'EXPIRED' };
            }
            if (session.used_at) {
                await client.query(`
          UPDATE public.resident_sessions
          SET revoked_at = COALESCE(revoked_at, NOW()), reuse_detected_at = NOW()
          WHERE id = $1
        `, [session.session_id]);
                await client.query(`
          UPDATE public.resident_refresh_tokens
          SET revoked_at = COALESCE(revoked_at, NOW())
          WHERE session_id = $1 AND revoked_at IS NULL
        `, [session.session_id]);
                return {
                    kind: 'REPLAY',
                    residentId: session.resident_id,
                    tenantSlug: session.tenant_slug,
                    clientType: session.client_type,
                };
            }
            if (session.token_revoked_at || new Date(session.token_expires_at).getTime() <= Date.now()) {
                return { kind: 'EXPIRED' };
            }
            const nextRefreshId = (0, crypto_1.randomUUID)();
            const next = await client.query(`
        INSERT INTO public.resident_refresh_tokens (id, session_id, token_hash, expires_at)
        VALUES ($1, $2, $3, LEAST(NOW() + INTERVAL '30 days', $4))
        RETURNING expires_at
      `, [nextRefreshId, session.session_id, nextTokenHash, session.refresh_absolute_expires_at]);
            await client.query(`
        UPDATE public.resident_refresh_tokens
        SET used_at = NOW(), replaced_by_id = $2
        WHERE id = $1 AND used_at IS NULL AND revoked_at IS NULL
      `, [session.refresh_id, nextRefreshId]);
            await client.query(`
        UPDATE public.resident_sessions
        SET last_used_at = NOW(), refresh_expires_at = $2
        WHERE id = $1
      `, [session.session_id, next.rows[0].expires_at]);
            return {
                kind: 'ROTATED',
                session: {
                    id: session.session_id,
                    jti: session.jti,
                    residentId: session.resident_id,
                    tenantSlug: session.tenant_slug,
                    clientType: session.client_type,
                    deviceId: session.device_id,
                    deviceName: session.device_name,
                },
                refreshExpiresAt: next.rows[0].expires_at,
            };
        });
    }
    async listResidentAppSessions(residentId, tenantSlug, currentJti) {
        const result = await this.db.query(`
      SELECT id, client_type AS "clientType", device_id AS "deviceId", device_name AS "deviceName",
             created_at AS "createdAt", last_used_at AS "lastUsedAt",
             refresh_expires_at AS "refreshExpiresAt", (jti = $3) AS "isCurrent"
      FROM public.resident_sessions
      WHERE resident_id = $1 AND tenant_slug = $2 AND client_type IN ('ANDROID', 'IOS')
        AND revoked_at IS NULL AND refresh_expires_at > NOW()
      ORDER BY last_used_at DESC NULLS LAST, created_at DESC
    `, [residentId, tenantSlug, currentJti]);
        return result.rows;
    }
    async revokeResidentAppSession(sessionId, residentId, tenantSlug) {
        return this.db.withTransaction(async (client) => {
            const result = await client.query(`
        UPDATE public.resident_sessions
        SET revoked_at = COALESCE(revoked_at, NOW())
        WHERE id = $1 AND resident_id = $2 AND tenant_slug = $3
          AND client_type IN ('ANDROID', 'IOS') AND revoked_at IS NULL
        RETURNING id
      `, [sessionId, residentId, tenantSlug]);
            if (!result.rows[0])
                return false;
            await client.query(`
        UPDATE public.resident_refresh_tokens
        SET revoked_at = COALESCE(revoked_at, NOW())
        WHERE session_id = $1 AND revoked_at IS NULL
      `, [sessionId]);
            return true;
        });
    }
    async isResidentSessionActive(jti, residentId, tenantSlug) {
        const result = await this.db.query('SELECT 1 FROM public.resident_sessions WHERE jti = $1 AND resident_id = $2 AND tenant_slug = $3 AND revoked_at IS NULL AND expires_at > NOW()', [jti, residentId, tenantSlug]);
        return Boolean(result.rows[0]);
    }
    async revokeResidentSession(jti) {
        await this.db.withTransaction(async (client) => {
            const result = await client.query(`
        UPDATE public.resident_sessions
        SET revoked_at = COALESCE(revoked_at, NOW())
        WHERE jti = $1 AND revoked_at IS NULL
        RETURNING id
      `, [jti]);
            if (!result.rows[0])
                return;
            await client.query(`
        UPDATE public.resident_refresh_tokens
        SET revoked_at = COALESCE(revoked_at, NOW())
        WHERE session_id = $1 AND revoked_at IS NULL
      `, [result.rows[0].id]);
        });
    }
    async revokeAllResidentAppSessions(residentId, tenantSlug) {
        return this.db.withTransaction(async (client) => {
            const sessions = await client.query(`
        UPDATE public.resident_sessions
        SET revoked_at = COALESCE(revoked_at, NOW())
        WHERE resident_id = $1 AND tenant_slug = $2
          AND client_type IN ('ANDROID', 'IOS') AND revoked_at IS NULL
        RETURNING id
      `, [residentId, tenantSlug]);
            if (!sessions.rowCount)
                return 0;
            await client.query(`
        UPDATE public.resident_refresh_tokens
        SET revoked_at = COALESCE(revoked_at, NOW())
        WHERE session_id = ANY($1::uuid[]) AND revoked_at IS NULL
      `, [sessions.rows.map((session) => session.id)]);
            return sessions.rowCount;
        });
    }
    async activateResident(token, password) {
        const tokenHash = (0, crypto_1.createHash)('sha256').update(token).digest('hex');
        const tenants = await this.db.query('SELECT slug FROM public.tenants WHERE is_active = TRUE');
        for (const tenant of tenants.rows) {
            const result = await this.db.queryTenant(tenant.slug, `
        UPDATE residents r
        SET password_hash = crypt($1, gen_salt('bf', 10)), must_change_password = FALSE, updated_at = NOW()
        FROM resident_invitations i
        WHERE i.resident_id = r.id AND i.token_hash = $2
          AND i.used_at IS NULL AND i.revoked_at IS NULL AND i.expires_at > NOW()
        RETURNING r.id, r.email, r.first_name, r.last_name, r.role, r.property_id, r.is_active
      `, [password, tokenHash]);
            if (result.rows[0]) {
                await this.db.queryTenant(tenant.slug, 'UPDATE resident_invitations SET used_at = NOW() WHERE token_hash = $1', [tokenHash]);
                return { resident: result.rows[0], tenantSlug: tenant.slug };
            }
        }
        return null;
    }
    async findResidentByCredentials(slug, identifier, password) {
        const result = await this.db.queryTenant(slug, `
      SELECT id, email, first_name, last_name, role, property_id, is_active, must_change_password
      FROM residents
      WHERE (LOWER(COALESCE(email, '')) = LOWER($1)
        OR regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') = regexp_replace($1, '[^0-9]', '', 'g'))
        AND password_hash = crypt($2, password_hash)
    `, [identifier.trim(), password]);
        return result.rows[0] || null;
    }
    async findResidentProfile(slug, residentId) {
        const result = await this.db.queryTenant(slug, `
      SELECT r.id, r.property_id, r.first_name, r.last_name, r.email, r.phone, r.role,
             r.is_primary, r.is_active, r.must_change_password, p.street, p.exterior_number,
             p.interior_number, p.block, p.lot
      FROM residents r
      JOIN properties p ON p.id = r.property_id
      WHERE r.id = $1
    `, [residentId]);
        return result.rows[0] || null;
    }
    async changeResidentPassword(slug, identifier, currentPassword, newPassword) {
        const result = await this.db.queryTenant(slug, `
      UPDATE residents
      SET password_hash = crypt($1, gen_salt('bf', 10)), must_change_password = FALSE, updated_at = NOW()
      WHERE (LOWER(COALESCE(email, '')) = LOWER($2)
        OR regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') = regexp_replace($2, '[^0-9]', '', 'g'))
        AND password_hash = crypt($3, password_hash) AND is_active = TRUE
      RETURNING id, email, first_name, last_name, role, property_id
    `, [newPassword, identifier.trim(), currentPassword]);
        return result.rows[0] || null;
    }
    async createResidentPasswordReset(slug, identifier) {
        const resident = await this.db.queryTenant(slug, `
      SELECT id, email, phone, first_name, last_name
      FROM residents
      WHERE is_active = TRUE AND (
        LOWER(COALESCE(email, '')) = LOWER($1) OR
        regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') = regexp_replace($1, '[^0-9]', '', 'g')
      )
    `, [identifier.trim()]);
        if (!resident.rows[0])
            return null;
        const token = (0, crypto_1.randomBytes)(32).toString('base64url');
        const tokenHash = (0, crypto_1.createHash)('sha256').update(token).digest('hex');
        await this.db.queryTenant(slug, 'UPDATE resident_password_resets SET revoked_at = NOW() WHERE resident_id = $1 AND used_at IS NULL AND revoked_at IS NULL', [resident.rows[0].id]);
        const result = await this.db.queryTenant(slug, `
      INSERT INTO resident_password_resets (resident_id, token_hash, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '30 minutes')
      RETURNING expires_at
    `, [resident.rows[0].id, tokenHash]);
        return { ...resident.rows[0], ...result.rows[0], token };
    }
    async resetResidentPassword(token, newPassword) {
        const tokenHash = (0, crypto_1.createHash)('sha256').update(token).digest('hex');
        const tenants = await this.db.query('SELECT slug FROM public.tenants WHERE is_active = TRUE');
        for (const tenant of tenants.rows) {
            const result = await this.db.queryTenant(tenant.slug, `
        UPDATE residents r
        SET password_hash = crypt($1, gen_salt('bf', 10)), must_change_password = FALSE, updated_at = NOW()
        FROM resident_password_resets p
        WHERE p.resident_id = r.id AND p.token_hash = $2
          AND p.used_at IS NULL AND p.revoked_at IS NULL AND p.expires_at > NOW()
        RETURNING r.id, r.email, r.first_name, r.last_name, r.role, r.property_id
      `, [newPassword, tokenHash]);
            if (result.rows[0]) {
                await this.db.queryTenant(tenant.slug, 'UPDATE resident_password_resets SET used_at = NOW() WHERE token_hash = $1', [tokenHash]);
                return { ...result.rows[0], tenantSlug: tenant.slug };
            }
        }
        return null;
    }
    async findUserByEmailAndPassword(email, passwordPlain) {
        const result = await this.db.query(`SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.tenant_id, u.is_active
              , u.mfa_enabled
       FROM public.users u
       WHERE LOWER(u.email) = $1 AND u.password_hash = crypt($2, u.password_hash)`, [email.toLowerCase(), passwordPlain]);
        return result.rows[0] || null;
    }
    async findUserForMfa(userId) {
        const result = await this.db.query(`SELECT id, email, first_name, last_name, role, tenant_id, is_active,
              mfa_enabled, mfa_secret_encrypted, mfa_pending_secret_encrypted,
              mfa_pending_created_at
       FROM public.users WHERE id = $1`, [userId]);
        return result.rows[0] || null;
    }
    async verifyUserPassword(userId, password) {
        const result = await this.db.query(`SELECT 1 FROM public.users
       WHERE id = $1 AND is_active = TRUE AND password_hash = crypt($2, password_hash)`, [userId, password]);
        return Boolean(result.rows[0]);
    }
    async getMfaSettings(userId) {
        const result = await this.db.query(`SELECT mfa_enabled, mfa_secret_encrypted, mfa_pending_secret_encrypted,
              mfa_pending_created_at, mfa_last_used_step
       FROM public.users WHERE id = $1 AND is_active = TRUE`, [userId]);
        return result.rows[0] || null;
    }
    async savePendingMfaSecret(userId, encryptedSecret) {
        await this.db.query(`UPDATE public.users
       SET mfa_pending_secret_encrypted = $2, mfa_pending_created_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND is_active = TRUE`, [userId, encryptedSecret]);
    }
    async enableMfa(userId, step) {
        const result = await this.db.query(`UPDATE public.users
       SET mfa_enabled = TRUE, mfa_secret_encrypted = mfa_pending_secret_encrypted,
           mfa_pending_secret_encrypted = NULL, mfa_pending_created_at = NULL,
           mfa_last_used_step = $2, updated_at = NOW()
       WHERE id = $1 AND is_active = TRUE
         AND mfa_pending_secret_encrypted IS NOT NULL
         AND mfa_pending_created_at > NOW() - INTERVAL '10 minutes'
       RETURNING id`, [userId, step]);
        return Boolean(result.rows[0]);
    }
    async disableMfa(userId, step) {
        const result = await this.db.query(`UPDATE public.users
       SET mfa_enabled = FALSE, mfa_secret_encrypted = NULL,
           mfa_pending_secret_encrypted = NULL, mfa_pending_created_at = NULL,
           mfa_last_used_step = NULL, updated_at = NOW()
       WHERE id = $1 AND is_active = TRUE AND mfa_enabled = TRUE
         AND (mfa_last_used_step IS NULL OR mfa_last_used_step < $2)
       RETURNING id`, [userId, step]);
        return Boolean(result.rows[0]);
    }
    async createMfaChallenge(userId, expiresAt) {
        await this.db.query('DELETE FROM public.auth_mfa_challenges WHERE expires_at < NOW() - INTERVAL \'1 day\'');
        const result = await this.db.query(`INSERT INTO public.auth_mfa_challenges (user_id, expires_at)
       SELECT $1, $2
       WHERE (SELECT COUNT(*) FROM public.auth_mfa_challenges
              WHERE user_id = $1 AND created_at > NOW() - INTERVAL '15 minutes') < 5
       RETURNING id`, [userId, expiresAt]);
        return result.rows[0]?.id;
    }
    async findActiveMfaChallenge(challengeId, userId) {
        const result = await this.db.query(`SELECT id FROM public.auth_mfa_challenges
       WHERE id = $1 AND user_id = $2 AND consumed_at IS NULL
         AND expires_at > NOW() AND attempts < 5`, [challengeId, userId]);
        return result.rows[0] || null;
    }
    async recordFailedMfaChallenge(challengeId) {
        await this.db.query(`UPDATE public.auth_mfa_challenges
       SET attempts = attempts + 1,
           consumed_at = CASE WHEN attempts >= 4 THEN NOW() ELSE consumed_at END
       WHERE id = $1 AND consumed_at IS NULL AND expires_at > NOW() AND attempts < 5`, [challengeId]);
    }
    async consumeMfaChallenge(challengeId, userId) {
        const result = await this.db.query(`UPDATE public.auth_mfa_challenges SET consumed_at = NOW()
       WHERE id = $1 AND user_id = $2 AND consumed_at IS NULL
         AND expires_at > NOW() AND attempts < 5
       RETURNING id`, [challengeId, userId]);
        return Boolean(result.rows[0]);
    }
    async consumeMfaStep(userId, step) {
        const result = await this.db.query(`UPDATE public.users SET mfa_last_used_step = $2
       WHERE id = $1 AND mfa_enabled = TRUE
         AND (mfa_last_used_step IS NULL OR mfa_last_used_step < $2)
       RETURNING id`, [userId, step]);
        return Boolean(result.rows[0]);
    }
    async findAllActiveTenants() {
        const result = await this.db.query(`SELECT id, slug, name, tier, max_properties, modules, has_custom_domain, custom_domain, access_url
       FROM public.tenants WHERE is_active = TRUE ORDER BY name ASC`);
        return result.rows;
    }
    async findTenantsByUser(userId, userRole, tenantId) {
        const result = await this.db.query(`SELECT DISTINCT t.id, t.slug, t.name, t.tier, t.max_properties, t.modules,
              t.has_custom_domain, t.custom_domain, t.access_url, COALESCE(ut.role, $2) AS role
       FROM public.tenants t
       LEFT JOIN public.user_tenants ut ON ut.tenant_id = t.id AND ut.user_id = $1
       WHERE (ut.user_id = $1 OR t.id = $3) AND t.is_active = TRUE
       ORDER BY t.name ASC`, [userId, userRole, tenantId || '00000000-0000-0000-0000-000000000000']);
        return result.rows;
    }
};
exports.AuthRepository = AuthRepository;
exports.AuthRepository = AuthRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], AuthRepository);
//# sourceMappingURL=auth.repository.js.map