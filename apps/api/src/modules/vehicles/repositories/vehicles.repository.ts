import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class VehiclesRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAllByTenant(slug: string, propertyId?: string) {
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
    const params: any[] = [];
    if (propertyId) {
      query += ` WHERE v.property_id = $1`;
      params.push(propertyId);
    }
    query += ` ORDER BY p.street, p.exterior_number, v.plates ASC`;

    const res = await this.db.queryTenant(slug, query, params);
    return res.rows;
  }

  async findById(slug: string, id: string) {
    const res = await this.db.queryTenant(slug, 'SELECT * FROM vehicles WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async checkPropertyExists(slug: string, propertyId: string): Promise<boolean> {
    const res = await this.db.queryTenant(slug, 'SELECT 1 FROM properties WHERE id = $1', [propertyId]);
    return res.rows.length > 0;
  }

  async checkPlatesExists(slug: string, plates: string, excludeId?: string): Promise<boolean> {
    let query = 'SELECT 1 FROM vehicles WHERE UPPER(plates) = $1';
    const params: any[] = [plates.toUpperCase().trim()];
    if (excludeId) {
      query += ' AND id != $2';
      params.push(excludeId);
    }
    const res = await this.db.queryTenant(slug, query, params);
    return res.rows.length > 0;
  }

  async create(
    slug: string,
    data: {
      propertyId: string;
      residentId: string | null;
      plates: string;
      brand: string | null;
      model: string | null;
      color: string | null;
    },
  ) {
    const res = await this.db.queryTenant(
      slug,
      `INSERT INTO vehicles (property_id, resident_id, plates, brand, model, color)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, property_id, resident_id, plates, brand, model, color, created_at`,
      [
        data.propertyId,
        data.residentId,
        data.plates,
        data.brand,
        data.model,
        data.color,
      ],
    );
    return res.rows[0];
  }

  async update(
    slug: string,
    id: string,
    data: {
      propertyId: string;
      residentId: string | null;
      plates: string;
      brand: string | null;
      model: string | null;
      color: string | null;
    },
  ) {
    await this.db.queryTenant(
      slug,
      `UPDATE vehicles
       SET property_id = $1, resident_id = $2, plates = $3, brand = $4, model = $5, color = $6
       WHERE id = $7`,
      [
        data.propertyId,
        data.residentId,
        data.plates,
        data.brand,
        data.model,
        data.color,
        id,
      ],
    );
  }

  async delete(slug: string, id: string) {
    await this.db.queryTenant(slug, 'DELETE FROM vehicles WHERE id = $1', [id]);
  }
}
