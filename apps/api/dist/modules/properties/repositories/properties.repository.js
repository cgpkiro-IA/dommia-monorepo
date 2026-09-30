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
exports.PropertiesRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../../database/database.service");
let PropertiesRepository = class PropertiesRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async findAllByTenant(slug) {
        const res = await this.db.queryTenant(slug, `SELECT 
        p.id, p.street, p.exterior_number, p.interior_number, p.block, p.lot, p.notes, 
        p.lot_size_m2, p.building_size_m2,
        p.is_delinquent, p.created_at, p.updated_at,
        (SELECT COUNT(*)::int FROM residents r WHERE r.property_id = p.id) as residents_count,
        (SELECT COUNT(*)::int FROM vehicles v WHERE v.property_id = p.id) as vehicles_count,
        (SELECT r.first_name || ' ' || r.last_name FROM residents r WHERE r.property_id = p.id AND r.is_primary = true LIMIT 1) as primary_resident_name,
        (SELECT r.phone FROM residents r WHERE r.property_id = p.id AND r.is_primary = true LIMIT 1) as primary_resident_phone,
        (SELECT r.email FROM residents r WHERE r.property_id = p.id AND r.is_primary = true LIMIT 1) as primary_resident_email
       FROM properties p 
       ORDER BY p.street, p.exterior_number`);
        return res.rows;
    }
    async countProperties(slug) {
        const res = await this.db.queryTenant(slug, 'SELECT COUNT(*)::int as total FROM properties');
        return res.rows[0]?.total || 0;
    }
    async getResidentAndVehicleStats(slug) {
        const residentCountsRes = await this.db.queryTenant(slug, `SELECT 
        COUNT(*)::int as total_residents,
        COUNT(*) FILTER (WHERE role = 'OWNER')::int as owners_count,
        COUNT(*) FILTER (WHERE role = 'TENANT')::int as tenants_count,
        COUNT(*) FILTER (WHERE role = 'FAMILY_MEMBER')::int as family_count
       FROM residents`);
        const vehicleCountsRes = await this.db.queryTenant(slug, `SELECT COUNT(*)::int as total_vehicles FROM vehicles`);
        return {
            residentStats: residentCountsRes.rows[0] || {
                total_residents: 0,
                owners_count: 0,
                tenants_count: 0,
                family_count: 0,
            },
            totalVehicles: vehicleCountsRes.rows[0]?.total_vehicles || 0,
        };
    }
    async findById(slug, id) {
        const res = await this.db.queryTenant(slug, 'SELECT * FROM properties WHERE id = $1', [id]);
        return res.rows[0] || null;
    }
    async create(slug, data) {
        const res = await this.db.queryTenant(slug, `INSERT INTO properties (street, exterior_number, interior_number, block, lot, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, street, exterior_number, interior_number, block, lot, notes, is_delinquent, created_at`, [
            data.street.trim(),
            data.exteriorNumber.trim(),
            data.interiorNumber?.trim() || null,
            data.block?.trim() || null,
            data.lot?.trim() || null,
            data.notes?.trim() || null,
        ]);
        return res.rows[0];
    }
    async update(slug, id, data) {
        const res = await this.db.queryTenant(slug, `UPDATE properties
       SET street = $1, exterior_number = $2, interior_number = $3, block = $4, lot = $5, notes = $6, is_delinquent = $7, updated_at = NOW()
       WHERE id = $8
       RETURNING id, street, exterior_number, interior_number, block, lot, notes, is_delinquent, updated_at`, [
            data.street,
            data.exteriorNumber,
            data.interiorNumber || null,
            data.block || null,
            data.lot || null,
            data.notes || null,
            data.isDelinquent,
            id,
        ]);
        return res.rows[0];
    }
    async delete(slug, id) {
        await this.db.queryTenant(slug, 'DELETE FROM properties WHERE id = $1', [id]);
    }
};
exports.PropertiesRepository = PropertiesRepository;
exports.PropertiesRepository = PropertiesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], PropertiesRepository);
//# sourceMappingURL=properties.repository.js.map