import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class NoticesRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAllByTenant(slug: string, publishedOnly: boolean = false, audience?: string) {
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
    const conditions: string[] = [];
    const params: any[] = [];

    if (publishedOnly) {
      conditions.push('is_published = true');
    }

    if (audience) {
      if (audience === 'GUARDS') {
        conditions.push("(target_audience IN ('GUARDS', 'ALL') OR category IN ('GUARD_CONSIGN', 'SECURITY'))");
      } else if (audience === 'RESIDENTS') {
        conditions.push("(target_audience IN ('RESIDENTS', 'ALL'))");
      } else if (audience !== 'ALL') {
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

  async findById(slug: string, id: string) {
    const res = await this.db.queryTenant(slug, 'SELECT * FROM notices WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async create(slug: string, data: {
    title: string;
    content: string;
    category?: string;
    priority?: string;
    targetAudience?: string;
    target_audience?: string;
    expiresAt?: string;
    expires_at?: string;
    authorName?: string;
    isPinned?: boolean;
    isPublished?: boolean;
  }) {
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

  async update(slug: string, id: string, data: Partial<{
    title: string;
    content: string;
    category: string;
    priority: string;
    targetAudience: string;
    target_audience: string;
    expiresAt: string;
    expires_at: string;
    authorName: string;
    isPinned: boolean;
    isPublished: boolean;
  }>) {
    const fields: string[] = [];
    const values: any[] = [];
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

  async acknowledgeByGuard(slug: string, noticeId: string, guardUserId: string, guardName: string) {
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

  async findAcknowledgingGuardName(guardUserId: string) {
    const result = await this.db.query(`
      SELECT COALESCE(NULLIF(CONCAT_WS(' ', first_name, last_name), ''), email) AS guard_name
      FROM public.users
      WHERE id = $1 AND is_active = TRUE
    `, [guardUserId]);
    return result.rows[0]?.guard_name || null;
  }

  async delete(slug: string, id: string): Promise<boolean> {
    const res = await this.db.queryTenant(slug, 'DELETE FROM notices WHERE id = $1 RETURNING id', [id]);
    return res.rows.length > 0;
  }
}
