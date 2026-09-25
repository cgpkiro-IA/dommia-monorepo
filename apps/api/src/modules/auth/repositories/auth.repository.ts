import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly db: DatabaseService) {}

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
      `SELECT id, slug, name, tier, max_properties, has_custom_domain, custom_domain, access_url
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
