import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class ResidentsRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAllByTenant(slug: string, propertyId?: string) {
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
    const params: any[] = [];
    if (propertyId) {
      query += ` WHERE r.property_id = $1`;
      params.push(propertyId);
    }
    query += ` ORDER BY p.street, p.exterior_number, r.is_primary DESC, r.last_name ASC`;

    const res = await this.db.queryTenant(slug, query, params);
    return res.rows;
  }

  async findById(slug: string, id: string) {
    const res = await this.db.queryTenant(slug, 'SELECT * FROM residents WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async checkPropertyExists(slug: string, propertyId: string): Promise<boolean> {
    const res = await this.db.queryTenant(slug, 'SELECT 1 FROM properties WHERE id = $1', [propertyId]);
    return res.rows.length > 0;
  }

  async checkEmailExists(slug: string, email: string, excludeId?: string): Promise<boolean> {
    let query = 'SELECT 1 FROM residents WHERE LOWER(email) = LOWER($1)';
    const params: any[] = [email.trim()];
    if (excludeId) {
      query += ' AND id != $2';
      params.push(excludeId);
    }
    const res = await this.db.queryTenant(slug, query, params);
    return res.rows.length > 0;
  }

  async resetPrimaryForProperty(slug: string, propertyId: string, excludeId?: string) {
    let query = 'UPDATE residents SET is_primary = false WHERE property_id = $1';
    const params: any[] = [propertyId];
    if (excludeId) {
      query += ' AND id != $2';
      params.push(excludeId);
    }
    await this.db.queryTenant(slug, query, params);
  }

  async create(
    slug: string,
    data: {
      propertyId: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      role: string;
      isPrimary: boolean;
      password: string;
      isActive?: boolean;
    },
  ) {
    const res = await this.db.queryTenant(
      slug,
      `INSERT INTO residents (property_id, first_name, last_name, email, phone, role, is_primary, password_hash, is_active)
       VALUES ($1, $2, $3, LOWER($4), $5, $6, $7, crypt($8, gen_salt('bf', 8)), $9)
       RETURNING id, property_id, first_name, last_name, email, phone, role, is_primary, is_active, created_at`,
      [
        data.propertyId,
        data.firstName.trim(),
        data.lastName.trim(),
        data.email.trim(),
        data.phone,
        data.role,
        data.isPrimary,
        data.password,
        data.isActive !== undefined ? data.isActive : true,
      ],
    );
    return res.rows[0];
  }

  async update(
    slug: string,
    id: string,
    data: {
      propertyId: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      role: string;
      isPrimary: boolean;
      isActive: boolean;
    },
  ) {
    await this.db.queryTenant(
      slug,
      `UPDATE residents
       SET property_id = $1, first_name = $2, last_name = $3, email = $4, phone = $5, role = $6, is_primary = $7, is_active = $8, updated_at = NOW()
       WHERE id = $9`,
      [
        data.propertyId,
        data.firstName,
        data.lastName,
        data.email,
        data.phone,
        data.role,
        data.isPrimary,
        data.isActive,
        id,
      ],
    );
  }

  async delete(slug: string, id: string) {
    await this.db.queryTenant(slug, 'DELETE FROM residents WHERE id = $1', [id]);
  }
}
