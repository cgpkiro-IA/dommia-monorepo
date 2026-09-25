import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class TenantsRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAll() {
    const res = await this.db.query(
      `SELECT id, slug, name, subdomain, tier, max_properties, is_active, modules, 
              has_custom_domain, custom_domain, access_url, created_at 
       FROM public.tenants 
       ORDER BY created_at DESC`,
    );
    return res.rows;
  }

  async findById(id: string) {
    const res = await this.db.query(
      `SELECT id, slug, name, subdomain, tier, max_properties, is_active, modules, 
              has_custom_domain, custom_domain, access_url, contact_email, created_at 
       FROM public.tenants 
       WHERE id = $1`,
      [id],
    );
    return res.rows[0] || null;
  }

  async findBySlug(slug: string) {
    if (!slug) return null;
    const clean = slug.toLowerCase().trim();
    const withUnderscores = clean.replace(/-/g, '_');
    const withHyphens = clean.replace(/_/g, '-');

    const res = await this.db.query(
      `SELECT id, slug, name, subdomain, tier, max_properties, is_active, modules, 
              has_custom_domain, custom_domain, access_url, contact_email, created_at 
       FROM public.tenants 
       WHERE LOWER(slug) = $1 
          OR LOWER(slug) = $2 
          OR LOWER(slug) = $3
          OR (LOWER(slug) = 'demo' AND ($1 = 'las_palmas' OR $1 = 'laspalmas' OR $1 = 'las-palmas'))
          OR (LOWER(slug) = 'las_palmas' AND $1 = 'demo')
       LIMIT 1`,
      [clean, withUnderscores, withHyphens],
    );
    return res.rows[0] || null;
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const clean = slug.toLowerCase().trim();
    const withUnderscores = clean.replace(/-/g, '_');
    const res = await this.db.query(
      'SELECT 1 FROM public.tenants WHERE LOWER(slug) = $1 OR LOWER(slug) = $2',
      [clean, withUnderscores],
    );
    return res.rows.length > 0;
  }

  async provisionSchema(
    slug: string,
    name: string,
    tier: string,
    maxProperties: number,
    contactEmail?: string,
  ): Promise<string> {
    return this.db.provisionTenant(
      slug.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      name,
      tier,
      maxProperties,
      contactEmail,
    );
  }

  async updateDomains(
    tenantId: string,
    hasCustomDomain: boolean,
    customDomain: string | null,
    accessUrl: string,
    modules?: string[],
  ) {
    if (modules && modules.length > 0) {
      await this.db.query(
        `UPDATE public.tenants
         SET has_custom_domain = $1, custom_domain = $2, access_url = $3, modules = $4::jsonb
         WHERE id = $5`,
        [hasCustomDomain, customDomain, accessUrl, JSON.stringify(modules), tenantId],
      );
    } else {
      await this.db.query(
        `UPDATE public.tenants
         SET has_custom_domain = $1, custom_domain = $2, access_url = $3
         WHERE id = $4`,
        [hasCustomDomain, customDomain, accessUrl, tenantId],
      );
    }
  }

  async updateTenant(
    idOrSlug: string,
    data: {
      name?: string;
      tier?: string;
      maxProperties?: number;
      contactEmail?: string;
      hasCustomDomain?: boolean;
      customDomain?: string | null;
      accessUrl?: string;
      isActive?: boolean;
      modules?: string[];
    },
  ) {
    const existing = (await this.findBySlug(idOrSlug)) || (await this.findById(idOrSlug));
    if (!existing) return null;

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(data.name.trim());
    }
    if (data.tier !== undefined) {
      fields.push(`tier = $${idx++}`);
      values.push(data.tier);
    }
    if (data.maxProperties !== undefined) {
      fields.push(`max_properties = $${idx++}`);
      values.push(Number(data.maxProperties));
    }
    if (data.contactEmail !== undefined) {
      fields.push(`contact_email = $${idx++}`);
      values.push(data.contactEmail?.trim() || null);
    }
    if (data.hasCustomDomain !== undefined) {
      fields.push(`has_custom_domain = $${idx++}`);
      values.push(data.hasCustomDomain);
    }
    if (data.customDomain !== undefined) {
      fields.push(`custom_domain = $${idx++}`);
      values.push(data.customDomain?.trim() || null);
    }
    if (data.accessUrl !== undefined) {
      fields.push(`access_url = $${idx++}`);
      values.push(data.accessUrl?.trim());
    }
    if (data.isActive !== undefined) {
      fields.push(`is_active = $${idx++}`);
      values.push(data.isActive);
    }
    if (data.modules !== undefined) {
      fields.push(`modules = $${idx++}::jsonb`);
      values.push(JSON.stringify(data.modules));
    }


    if (fields.length === 0) return existing;

    values.push(existing.id);
    const query = `UPDATE public.tenants SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const res = await this.db.query(query, values);
    return res.rows[0] || null;
  }
}

