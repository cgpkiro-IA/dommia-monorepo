import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { TelegramAlertService } from './telegram-alert.service';

export interface CrmPlatformAlert {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  category: 'CHANNELS' | 'SECURITY' | 'BILLING' | 'SYSTEM' | 'TELEMETRY';
  title: string;
  description: string;
  tenantSlug?: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlertDto {
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  category: 'CHANNELS' | 'SECURITY' | 'BILLING' | 'SYSTEM' | 'TELEMETRY';
  title: string;
  description: string;
  tenantSlug?: string;
}

@Injectable()
export class CrmAlertsService {
  private readonly logger = new Logger(CrmAlertsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly telegramAlertService: TelegramAlertService,
  ) {}

  async findAll(statusFilter?: string, severityFilter?: string): Promise<CrmPlatformAlert[]> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (statusFilter && statusFilter !== 'ALL') {
      params.push(statusFilter.toUpperCase());
      conditions.push(`status = $${params.length}`);
    }

    if (severityFilter && severityFilter !== 'ALL') {
      params.push(severityFilter.toUpperCase());
      conditions.push(`severity = $${params.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await this.db.query(`
      SELECT id, severity, category, title, description, tenant_slug, status,
             acknowledged_by, acknowledged_at, resolved_by, resolved_at, resolution_notes,
             created_at, updated_at
      FROM public.crm_platform_alerts
      ${where}
      ORDER BY 
        CASE 
          WHEN status = 'ACTIVE' THEN 0 
          WHEN status = 'ACKNOWLEDGED' THEN 1 
          ELSE 2 
        END ASC,
        CASE 
          WHEN severity = 'CRITICAL' THEN 0 
          WHEN severity = 'WARNING' THEN 1 
          ELSE 2 
        END ASC,
        created_at DESC
      LIMIT 100
    `, params);

    return result.rows.map((row) => this.toAlert(row));
  }

  async create(dto: CreateAlertDto): Promise<CrmPlatformAlert> {
    const result = await this.db.query(`
      INSERT INTO public.crm_platform_alerts (severity, category, title, description, tenant_slug)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      dto.severity,
      dto.category,
      dto.title.trim(),
      dto.description.trim(),
      dto.tenantSlug?.toLowerCase().trim() || null,
    ]);

    const created = this.toAlert(result.rows[0]);

    // Despachar a Telegram si está configurado
    void this.telegramAlertService.sendAlert({
      severity: created.severity,
      category: created.category,
      title: created.title,
      description: created.description,
      tenantSlug: created.tenantSlug,
    });

    return created;
  }

  async acknowledge(id: string, userEmail: string): Promise<CrmPlatformAlert> {
    const result = await this.db.query(`
      UPDATE public.crm_platform_alerts
      SET status = 'ACKNOWLEDGED',
          acknowledged_by = $2,
          acknowledged_at = NOW(),
          updated_at = NOW()
      WHERE id = $1 AND status = 'ACTIVE'
      RETURNING *
    `, [id, userEmail]);

    if (result.rows.length === 0) {
      const check = await this.db.query('SELECT id, status FROM public.crm_platform_alerts WHERE id = $1', [id]);
      if (check.rows.length === 0) throw new NotFoundException(`Alerta con ID ${id} no encontrada`);
      return this.toAlert((await this.db.query('SELECT * FROM public.crm_platform_alerts WHERE id = $1', [id])).rows[0]);
    }

    return this.toAlert(result.rows[0]);
  }

  async resolve(id: string, userEmail: string, notes?: string): Promise<CrmPlatformAlert> {
    const result = await this.db.query(`
      UPDATE public.crm_platform_alerts
      SET status = 'RESOLVED',
          resolved_by = $2,
          resolved_at = NOW(),
          resolution_notes = $3,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id, userEmail, notes?.trim() || 'Resuelta por el operador del CRM']);

    if (result.rows.length === 0) {
      throw new NotFoundException(`Alerta con ID ${id} no encontrada`);
    }

    return this.toAlert(result.rows[0]);
  }

  async getSummary() {
    const result = await this.db.query(`
      SELECT 
        COUNT(*)::int as total,
        COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END)::int as active_count,
        COUNT(CASE WHEN status = 'ACTIVE' AND severity = 'CRITICAL' THEN 1 END)::int as critical_active,
        COUNT(CASE WHEN status = 'ACTIVE' AND severity = 'WARNING' THEN 1 END)::int as warning_active,
        COUNT(CASE WHEN status = 'ACKNOWLEDGED' THEN 1 END)::int as acknowledged_count,
        COUNT(CASE WHEN status = 'RESOLVED' THEN 1 END)::int as resolved_count
      FROM public.crm_platform_alerts
    `);

    return result.rows[0];
  }

  private toAlert(row: Record<string, any>): CrmPlatformAlert {
    return {
      id: row.id,
      severity: row.severity,
      category: row.category,
      title: row.title,
      description: row.description,
      tenantSlug: row.tenant_slug || undefined,
      status: row.status,
      acknowledgedBy: row.acknowledged_by || undefined,
      acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at).toISOString() : undefined,
      resolvedBy: row.resolved_by || undefined,
      resolvedAt: row.resolved_at ? new Date(row.resolved_at).toISOString() : undefined,
      resolutionNotes: row.resolution_notes || undefined,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  }
}
