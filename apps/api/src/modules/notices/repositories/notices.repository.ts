import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class NoticesRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAllByTenant(slug: string, publishedOnly: boolean = false) {
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
    const params: any[] = [];

    if (publishedOnly) {
      query += ` WHERE is_published = true`;
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
    authorName?: string;
    isPinned?: boolean;
    isPublished?: boolean;
  }) {
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

  async update(slug: string, id: string, data: Partial<{
    title: string;
    content: string;
    category: string;
    priority: string;
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

  async delete(slug: string, id: string): Promise<boolean> {
    const res = await this.db.queryTenant(slug, 'DELETE FROM notices WHERE id = $1 RETURNING id', [id]);
    return res.rows.length > 0;
  }
}
