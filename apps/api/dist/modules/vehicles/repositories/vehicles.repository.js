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
exports.VehiclesRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../../database/database.service");
let VehiclesRepository = class VehiclesRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async findAllByTenant(slug, propertyId) {
        let query = `
      SELECT 
        v.id,
        v.property_id,
        v.resident_id,
        v.plates,
        v.brand,
        v.model,
        v.color,
        v.created_at,
        p.street,
        p.exterior_number,
        p.interior_number,
        p.block,
        p.lot,
        r.first_name AS resident_first_name,
        r.last_name AS resident_last_name
      FROM vehicles v
      JOIN properties p ON v.property_id = p.id
      LEFT JOIN residents r ON v.resident_id = r.id
    `;
        const params = [];
        if (propertyId) {
            query += ` WHERE v.property_id = $1`;
            params.push(propertyId);
        }
        query += ` ORDER BY p.street, p.exterior_number, v.plates ASC`;
        const res = await this.db.queryTenant(slug, query, params);
        return res.rows;
    }
    async findById(slug, id) {
        const res = await this.db.queryTenant(slug, 'SELECT * FROM vehicles WHERE id = $1', [id]);
        return res.rows[0] || null;
    }
    async checkPropertyExists(slug, propertyId) {
        const res = await this.db.queryTenant(slug, 'SELECT 1 FROM properties WHERE id = $1', [propertyId]);
        return res.rows.length > 0;
    }
    async checkPlatesExists(slug, plates, excludeId) {
        let query = 'SELECT 1 FROM vehicles WHERE UPPER(plates) = $1';
        const params = [plates.toUpperCase().trim()];
        if (excludeId) {
            query += ' AND id != $2';
            params.push(excludeId);
        }
        const res = await this.db.queryTenant(slug, query, params);
        return res.rows.length > 0;
    }
    async create(slug, data) {
        const res = await this.db.queryTenant(slug, `INSERT INTO vehicles (property_id, resident_id, plates, brand, model, color)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, property_id, resident_id, plates, brand, model, color, created_at`, [
            data.propertyId,
            data.residentId,
            data.plates,
            data.brand,
            data.model,
            data.color,
        ]);
        return res.rows[0];
    }
    async update(slug, id, data) {
        await this.db.queryTenant(slug, `UPDATE vehicles
       SET property_id = $1, resident_id = $2, plates = $3, brand = $4, model = $5, color = $6
       WHERE id = $7`, [
            data.propertyId,
            data.residentId,
            data.plates,
            data.brand,
            data.model,
            data.color,
            id,
        ]);
    }
    async delete(slug, id) {
        await this.db.queryTenant(slug, 'DELETE FROM vehicles WHERE id = $1', [id]);
    }
};
exports.VehiclesRepository = VehiclesRepository;
exports.VehiclesRepository = VehiclesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], VehiclesRepository);
//# sourceMappingURL=vehicles.repository.js.map