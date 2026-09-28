import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class AuthRepository {
  constructor(private readonly db: DatabaseService) {}

  async recordResidentAudit(slug: string, action: string, entityId: string | null, metadata?: Record<string, unknown>) {
    try {
      const tenant = await this.db.query('SELECT id FROM public.tenants WHERE LOWER(slug) = LOWER($1) LIMIT 1', [slug]);
      await this.db.query(
        `INSERT INTO public.audit_logs (tenant_id, action, entity, entity_id, new_value)
         VALUES ($1, $2, 'ResidentAuth', $3, $4::jsonb)`,
        [tenant.rows[0]?.id || null, action, entityId, JSON.stringify(metadata || {})],
      );
    } catch {
      // Audit failures must not expose credentials or block authentication.
    }
  }

  private async ensureResidentAccessTables(slug: string) {
    await this.db.queryTenant(slug, `
      ALTER TABLE residents ALTER COLUMN email DROP NOT NULL;
      ALTER TABLE residents ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT true;
      CREATE TABLE IF NOT EXISTS resident_invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
        token_hash VARCHAR(128) UNIQUE NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        revoked_at TIMESTAMPTZ,
        created_by UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS resident_invitations_resident_idx ON resident_invitations(resident_id);
      CREATE TABLE IF NOT EXISTS resident_password_resets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
        token_hash VARCHAR(128) UNIQUE NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        revoked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS resident_password_resets_resident_idx ON resident_password_resets(resident_id);
    `);
  }

  async createResidentInvitation(slug: string, residentId: string, createdBy?: string) {
    await this.ensureResidentAccessTables(slug);
    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await this.db.queryTenant(slug, `UPDATE resident_invitations SET revoked_at = NOW() WHERE resident_id = $1 AND used_at IS NULL AND revoked_at IS NULL`, [residentId]);
    const validCreatedBy = createdBy && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(createdBy)
      ? createdBy
      : null;
    const result = await this.db.queryTenant(slug, `
      INSERT INTO resident_invitations (resident_id, token_hash, expires_at, created_by)
      VALUES ($1, $2, NOW() + INTERVAL '24 hours', $3) RETURNING id, expires_at
    `, [residentId, tokenHash, validCreatedBy]);
    return { ...result.rows[0], token };
  }

  async createResidentSession(jti: string, residentId: string, tenantSlug: string, expiresAt: Date) {
    await this.db.query(`CREATE TABLE IF NOT EXISTS public.resident_sessions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), jti UUID UNIQUE NOT NULL, resident_id UUID NOT NULL, tenant_slug VARCHAR(150) NOT NULL, expires_at TIMESTAMPTZ NOT NULL, revoked_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
    await this.db.query('INSERT INTO public.resident_sessions (jti, resident_id, tenant_slug, expires_at) VALUES ($1, $2, $3, $4)', [jti, residentId, tenantSlug, expiresAt]);
  }

  async revokeResidentSession(jti: string) {
    await this.db.query('UPDATE public.resident_sessions SET revoked_at = NOW() WHERE jti = $1 AND revoked_at IS NULL', [jti]);
  }

  async activateResident(token: string, password: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const tenants = await this.db.query(`SELECT slug FROM public.tenants WHERE is_active = true`);
    for (const tenant of tenants.rows) {
      await this.ensureResidentAccessTables(tenant.slug);
      const result = await this.db.queryTenant(tenant.slug, `
        UPDATE residents r SET password_hash = crypt($1, gen_salt('bf', 10)), must_change_password = false, updated_at = NOW()
        FROM resident_invitations i
        WHERE i.resident_id = r.id AND i.token_hash = $2 AND i.used_at IS NULL AND i.revoked_at IS NULL AND i.expires_at > NOW()
        RETURNING r.id, r.email, r.first_name, r.last_name, r.role, r.property_id, r.is_active
      `, [password, tokenHash]);
      if (result.rows[0]) {
        await this.db.queryTenant(tenant.slug, `UPDATE resident_invitations SET used_at = NOW() WHERE token_hash = $1`, [tokenHash]);
        return { resident: result.rows[0], tenantSlug: tenant.slug };
      }
    }
    return null;
  }

  async findResidentByCredentials(slug: string, identifier: string, password: string) {
    await this.ensureResidentAccessTables(slug);
    const result = await this.db.queryTenant(slug, `
      SELECT id, email, first_name, last_name, role, property_id, is_active, must_change_password
      FROM residents
      WHERE (LOWER(COALESCE(email, '')) = LOWER($1)
        OR regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') = regexp_replace($1, '[^0-9]', '', 'g'))
        AND password_hash = crypt($2, password_hash)
    `, [identifier.trim(), password]);
    return result.rows[0] || null;
  }

  async findResidentProfile(slug: string, residentId: string) {
    await this.ensureResidentAccessTables(slug);
    const result = await this.db.queryTenant(slug, `
      SELECT r.id, r.property_id, r.first_name, r.last_name, r.email, r.phone, r.role,
             r.is_primary, r.is_active, r.must_change_password, p.street, p.exterior_number,
             p.interior_number, p.block, p.lot
      FROM residents r JOIN properties p ON p.id = r.property_id
      WHERE r.id = $1
    `, [residentId]);
    return result.rows[0] || null;
  }

  async changeResidentPassword(slug: string, identifier: string, currentPassword: string, newPassword: string) {
    await this.ensureResidentAccessTables(slug);
    const result = await this.db.queryTenant(slug, `
      UPDATE residents
      SET password_hash = crypt($1, gen_salt('bf', 10)), must_change_password = false, updated_at = NOW()
      WHERE (LOWER(COALESCE(email, '')) = LOWER($2)
        OR regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') = regexp_replace($2, '[^0-9]', '', 'g'))
        AND password_hash = crypt($3, password_hash) AND is_active = true
      RETURNING id, email, first_name, last_name, role, property_id
    `, [newPassword, identifier.trim(), currentPassword]);
    return result.rows[0] || null;
  }

  async createResidentPasswordReset(slug: string, identifier: string) {
    await this.ensureResidentAccessTables(slug);
    const resident = await this.db.queryTenant(slug, `
      SELECT id, email, phone, first_name, last_name FROM residents
      WHERE is_active = true AND (LOWER(COALESCE(email, '')) = LOWER($1)
        OR regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') = regexp_replace($1, '[^0-9]', '', 'g'))
    `, [identifier.trim()]);
    if (!resident.rows[0]) return null;
    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await this.db.queryTenant(slug, 'UPDATE resident_password_resets SET revoked_at = NOW() WHERE resident_id = $1 AND used_at IS NULL AND revoked_at IS NULL', [resident.rows[0].id]);
    const result = await this.db.queryTenant(slug, `
      INSERT INTO resident_password_resets (resident_id, token_hash, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '30 minutes') RETURNING expires_at
    `, [resident.rows[0].id, tokenHash]);
    return { ...resident.rows[0], ...result.rows[0], token };
  }

  async resetResidentPassword(token: string, newPassword: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const tenants = await this.db.query('SELECT slug FROM public.tenants WHERE is_active = true');
    for (const tenant of tenants.rows) {
      await this.ensureResidentAccessTables(tenant.slug);
      const result = await this.db.queryTenant(tenant.slug, `
        UPDATE residents r SET password_hash = crypt($1, gen_salt('bf', 10)), must_change_password = false, updated_at = NOW()
        FROM resident_password_resets p
        WHERE p.resident_id = r.id AND p.token_hash = $2 AND p.used_at IS NULL AND p.revoked_at IS NULL AND p.expires_at > NOW()
        RETURNING r.id, r.email, r.first_name, r.last_name, r.role, r.property_id
      `, [newPassword, tokenHash]);
      if (result.rows[0]) {
        await this.db.queryTenant(tenant.slug, 'UPDATE resident_password_resets SET used_at = NOW() WHERE token_hash = $1', [tokenHash]);
        return { ...result.rows[0], tenantSlug: tenant.slug };
      }
    }
    return null;
  }

  async findUserByEmailAndPassword(email: string, passwordPlain: string) {
    const res = await this.db.query(
      `SELECT 
        u.id, 
        u.email, 
        u.first_name, 
        u.last_name, 
        u.role, 
        u.tenant_id,
        u.is_active
       FROM public.users u
       WHERE LOWER(u.email) = $1 
         AND u.password_hash = crypt($2, u.password_hash)`,
      [email.toLowerCase(), passwordPlain],
    );
    return res.rows[0] || null;
  }

  async findAllActiveTenants() {
    const res = await this.db.query(
      `SELECT id, slug, name, tier, max_properties, modules, has_custom_domain, custom_domain, access_url
       FROM public.tenants
       WHERE is_active = true
       ORDER BY name ASC`,
    );
    return res.rows;
  }

  async findTenantsByUser(userId: string, userRole: string, tenantId?: string) {
    const res = await this.db.query(
      `SELECT DISTINCT
        t.id, 
        t.slug, 
        t.name, 
        t.tier, 
        t.max_properties, 
        t.modules,
        t.has_custom_domain, 
        t.custom_domain, 
        t.access_url,
        COALESCE(ut.role, $2) as role
       FROM public.tenants t
       LEFT JOIN public.user_tenants ut ON ut.tenant_id = t.id AND ut.user_id = $1
       WHERE (ut.user_id = $1 OR t.id = $3)
         AND t.is_active = true
       ORDER BY t.name ASC`,
      [userId, userRole, tenantId || '00000000-0000-0000-0000-000000000000'],
    );
    return res.rows;
  }
}
