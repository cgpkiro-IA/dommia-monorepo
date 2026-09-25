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
    async ensureTableExists(slug) {
        const ddl = `
      CREATE TABLE IF NOT EXISTS notices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(32) NOT NULL DEFAULT 'GENERAL',
        priority VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
        author_name VARCHAR(100) NOT NULL DEFAULT 'Administración',
        is_pinned BOOLEAN NOT NULL DEFAULT false,
        is_published BOOLEAN NOT NULL DEFAULT true,
        published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
        await this.db.queryTenant(slug, ddl);
    }
    async findAllByTenant(slug, publishedOnly = false) {
        await this.ensureTableExists(slug);
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
        created_at, 
        updated_at
      FROM notices
    `;
        const params = [];
        if (publishedOnly) {
            query += ` WHERE is_published = true`;
        }
        query += ` ORDER BY is_pinned DESC, published_at DESC, created_at DESC`;
        const res = await this.db.queryTenant(slug, query, params);
        return res.rows;
    }
    async findById(slug, id) {
        await this.ensureTableExists(slug);
        const res = await this.db.queryTenant(slug, 'SELECT * FROM notices WHERE id = $1', [id]);
        return res.rows[0] || null;
    }
    async create(slug, data) {
        await this.ensureTableExists(slug);
        const query = `
      INSERT INTO notices (
        title, content, category, priority, author_name, is_pinned, is_published, published_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *;
    `;
        const res = await this.db.queryTenant(slug, query, [
            data.title.trim(),
            data.content.trim(),
            data.category || 'GENERAL',
            data.priority || 'MEDIUM',
            data.authorName?.trim() || 'Administración',
            data.isPinned ?? false,
            data.isPublished ?? true,
        ]);
        return res.rows[0];
    }
    async update(slug, id, data) {
        await this.ensureTableExists(slug);
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
    async delete(slug, id) {
        await this.ensureTableExists(slug);
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