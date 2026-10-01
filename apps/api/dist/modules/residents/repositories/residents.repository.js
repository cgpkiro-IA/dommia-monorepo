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
exports.ResidentsRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../../database/database.service");
let ResidentsRepository = class ResidentsRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async findAllByTenant(slug, propertyId) {
        let query = `
      SELECT 
        r.id, 
        r.property_id, 
        r.first_name, 
        r.last_name, 
        r.email, 
        r.phone, 
        r.role, 
        r.is_primary, 
        r.is_active, 
        r.created_at, 
        r.updated_at,
        p.street, 
        p.exterior_number, 
        p.interior_number, 
        p.block, 
        p.lot
      FROM residents r
      JOIN properties p ON r.property_id = p.id
    `;
        const params = [];
        if (propertyId) {
            query += ` WHERE r.property_id = $1`;
            params.push(propertyId);
        }
        query += ` ORDER BY p.street, p.exterior_number, r.is_primary DESC, r.last_name ASC`;
        const res = await this.db.queryTenant(slug, query, params);
        return res.rows;
    }
    async findById(slug, id) {
        const res = await this.db.queryTenant(slug, 'SELECT * FROM residents WHERE id = $1', [id]);
        return res.rows[0] || null;
    }
    async checkPropertyExists(slug, propertyId) {
        const res = await this.db.queryTenant(slug, 'SELECT 1 FROM properties WHERE id = $1', [propertyId]);
        return res.rows.length > 0;
    }
    async checkEmailExists(slug, email, excludeId) {
        if (!email?.trim())
            return false;
        let query = 'SELECT 1 FROM residents WHERE LOWER(email) = LOWER($1)';
        const params = [email.trim()];
        if (excludeId) {
            query += ' AND id != $2';
            params.push(excludeId);
        }
        const res = await this.db.queryTenant(slug, query, params);
        return res.rows.length > 0;
    }
    async resetPrimaryForProperty(slug, propertyId, excludeId) {
        let query = 'UPDATE residents SET is_primary = false WHERE property_id = $1';
        const params = [propertyId];
        if (excludeId) {
            query += ' AND id != $2';
            params.push(excludeId);
        }
        await this.db.queryTenant(slug, query, params);
    }
    async create(slug, data) {
        const res = await this.db.queryTenant(slug, `INSERT INTO residents (property_id, first_name, last_name, email, phone, role, is_primary, password_hash, is_active)
       VALUES ($1, $2, $3, LOWER($4), $5, $6, $7, crypt($8, gen_salt('bf', 8)), $9)
       RETURNING id, property_id, first_name, last_name, email, phone, role, is_primary, is_active, created_at`, [
            data.propertyId,
            data.firstName.trim(),
            data.lastName.trim(),
            data.email?.trim() || null,
            data.phone,
            data.role,
            data.isPrimary,
            data.password,
            data.isActive !== undefined ? data.isActive : true,
        ]);
        return res.rows[0];
    }
    async update(slug, id, data) {
        await this.db.queryTenant(slug, `UPDATE residents
       SET property_id = $1, first_name = $2, last_name = $3, email = $4, phone = $5, role = $6, is_primary = $7, is_active = $8, updated_at = NOW()
       WHERE id = $9`, [
            data.propertyId,
            data.firstName,
            data.lastName,
            data.email,
            data.phone,
            data.role,
            data.isPrimary,
            data.isActive,
            id,
        ]);
    }
    async delete(slug, id) {
        await this.db.queryTenant(slug, 'DELETE FROM residents WHERE id = $1', [id]);
    }
};
exports.ResidentsRepository = ResidentsRepository;
exports.ResidentsRepository = ResidentsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], ResidentsRepository);
//# sourceMappingURL=residents.repository.js.map