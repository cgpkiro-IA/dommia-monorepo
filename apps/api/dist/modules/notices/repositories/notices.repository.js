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
exports.NoticesRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../../database/database.service");
let NoticesRepository = class NoticesRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async findAllByTenant(slug, publishedOnly = false, audience) {
        let query = `
      SELECT 
        id, 
        title, 
        content, 
        category, 
        priority, 
        author_name, 
        is_pinned, 
        is_published, 
        published_at, 
        target_audience,
        COALESCE(acknowledged_guards, '[]'::jsonb) as acknowledged_guards,
        expires_at,
        created_at, 
        updated_at
      FROM notices
    `;
        const conditions = [];
        const params = [];
        if (publishedOnly) {
            conditions.push('is_published = true');
        }
        if (audience) {
            if (audience === 'GUARDS') {
                conditions.push("(target_audience IN ('GUARDS', 'ALL') OR category IN ('GUARD_CONSIGN', 'SECURITY'))");
            }
            else if (audience === 'RESIDENTS') {
                conditions.push("(target_audience IN ('RESIDENTS', 'ALL'))");
            }
            else if (audience !== 'ALL') {
                params.push(audience);
                conditions.push(`target_audience = $${params.length}`);
            }
        }
        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }
        query += ` ORDER BY is_pinned DESC, published_at DESC, created_at DESC`;
        const res = await this.db.queryTenant(slug, query, params);
        return res.rows;
    }
    async findById(slug, id) {
        const res = await this.db.queryTenant(slug, 'SELECT * FROM notices WHERE id = $1', [id]);
        return res.rows[0] || null;
    }
    async create(slug, data) {
        const audience = data.targetAudience || data.target_audience || (data.category === 'GUARD_CONSIGN' ? 'GUARDS' : 'ALL');
        const expires = data.expiresAt || data.expires_at || null;
        const query = `
      INSERT INTO notices (
        title, content, category, priority, target_audience, expires_at, author_name, is_pinned, is_published, published_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *;
    `;
        const res = await this.db.queryTenant(slug, query, [
            data.title.trim(),
            data.content.trim(),
            data.category || 'GENERAL',
            data.priority || 'MEDIUM',
            audience,
            expires,
            data.authorName?.trim() || 'Administración',
            data.isPinned ?? false,
            data.isPublished ?? true,
        ]);
        return res.rows[0];
    }
    async update(slug, id, data) {
        const fields = [];
        const values = [];
        let idx = 1;
        if (data.title !== undefined) {
            fields.push(`title = $${idx++}`);
            values.push(data.title.trim());
        }
        if (data.content !== undefined) {
            fields.push(`content = $${idx++}`);
            values.push(data.content.trim());
        }
        if (data.category !== undefined) {
            fields.push(`category = $${idx++}`);
            values.push(data.category);
        }
        if (data.priority !== undefined) {
            fields.push(`priority = $${idx++}`);
            values.push(data.priority);
        }
        if (data.targetAudience !== undefined || data.target_audience !== undefined) {
            fields.push(`target_audience = $${idx++}`);
            values.push(data.targetAudience || data.target_audience);
        }
        if (data.expiresAt !== undefined || data.expires_at !== undefined) {
            fields.push(`expires_at = $${idx++}`);
            values.push(data.expiresAt || data.expires_at);
        }
        if (data.authorName !== undefined) {
            fields.push(`author_name = $${idx++}`);
            values.push(data.authorName.trim());
        }
        if (data.isPinned !== undefined) {
            fields.push(`is_pinned = $${idx++}`);
            values.push(data.isPinned);
        }
        if (data.isPublished !== undefined) {
            fields.push(`is_published = $${idx++}`);
            values.push(data.isPublished);
        }
        fields.push(`updated_at = NOW()`);
        values.push(id);
        const query = `
      UPDATE notices
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING *;
    `;
        const res = await this.db.queryTenant(slug, query, values);
        return res.rows[0] || null;
    }
    async acknowledgeByGuard(slug, noticeId, guardUserId, guardName) {
        const ackEntry = JSON.stringify({
            guard_id: guardUserId,
            guard_name: guardName,
            acknowledged_at: new Date().toISOString(),
        });
        const query = `
      UPDATE notices
      SET acknowledged_guards = CASE 
        WHEN acknowledged_guards @> jsonb_build_array(jsonb_build_object('guard_id', $2::text)) THEN acknowledged_guards
        ELSE COALESCE(acknowledged_guards, '[]'::jsonb) || $3::jsonb
      END
      WHERE id = $1
      RETURNING *;
    `;
        const res = await this.db.queryTenant(slug, query, [noticeId, guardUserId, ackEntry]);
        return res.rows[0] || null;
    }
    async findAcknowledgingGuardName(guardUserId) {
        const result = await this.db.query(`
      SELECT COALESCE(NULLIF(CONCAT_WS(' ', first_name, last_name), ''), email) AS guard_name
      FROM public.users
      WHERE id = $1 AND is_active = TRUE
    `, [guardUserId]);
        return result.rows[0]?.guard_name || null;
    }
    async delete(slug, id) {
        const res = await this.db.queryTenant(slug, 'DELETE FROM notices WHERE id = $1 RETURNING id', [id]);
        return res.rows.length > 0;
    }
};
exports.NoticesRepository = NoticesRepository;
exports.NoticesRepository = NoticesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], NoticesRepository);
//# sourceMappingURL=notices.repository.js.map