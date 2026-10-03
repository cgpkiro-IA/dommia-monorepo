import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class CrmRepository {
  constructor(private readonly db: DatabaseService) {}

  // ==========================================
  // PROSPECTS
  // ==========================================
  async insertProspect(data: {
    name: string;
    email: string;
    phone: string;
    communityName: string;
    estimatedHouses: number;
    notes: string;
  }) {
    const res = await this.db.query(
      `INSERT INTO public.crm_prospects (name, email, phone, community_name, estimated_houses, stage, notes)
       VALUES ($1, $2, $3, $4, $5, 'LEAD', $6)
       RETURNING id, name, email, phone, community_name, estimated_houses, stage, notes, created_at`,
      [
        data.name,
        data.email.toLowerCase().trim(),
        data.phone,
        data.communityName,
        data.estimatedHouses,
        data.notes,
      ],
    );
    return res.rows[0];
  }

  async findAllProspects() {
    const res = await this.db.query(
      'SELECT id, name, email, phone, community_name, estimated_houses, stage, notes, created_at FROM public.crm_prospects ORDER BY created_at DESC',
    );
    return res.rows;
  }

  async findProspectById(id: string) {
    const res = await this.db.query(
      'SELECT id, name, email, phone, community_name, estimated_houses, stage, notes, created_at FROM public.crm_prospects WHERE id = $1',
      [id],
    );
    return res.rows[0] || null;
  }

  async updateProspectStage(id: string, stage: string) {
    const res = await this.db.query(
      'UPDATE public.crm_prospects SET stage = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, stage, updated_at',
      [stage, id],
    );
    return res.rows[0] || null;
  }

  // ==========================================
  // GATEWAYS (IoT)
  // ==========================================
  async findAllGateways() {
    const res = await this.db.query(
      `SELECT g.id, g.uuid, g.name, g.firmware_version, g.ip_local, g.status, 
              g.last_heartbeat, g.last_heartbeat as last_seen_at, g.notes, g.created_at,
              t.name as tenant_name, t.slug as tenant_slug
       FROM public.gateway_inventory g
       LEFT JOIN public.tenants t ON g.tenant_id = t.id
       ORDER BY g.created_at DESC`,
    );
    return res.rows;
  }

  async findGatewayByUuid(uuid: string) {
    const res = await this.db.query(
      'SELECT * FROM public.gateway_inventory WHERE uuid = $1',
      [uuid],
    );
    return res.rows[0] || null;
  }

  async createGateway(data: { uuid: string; name?: string; firmwareVersion?: string; tenantId?: string }) {
    const res = await this.db.query(
      `INSERT INTO public.gateway_inventory (uuid, name, firmware_version, tenant_id, status)
       VALUES ($1, $2, $3, $4, 'OFFLINE')
       RETURNING id, uuid, name, firmware_version, tenant_id, status, created_at`,
      [data.uuid, data.name || `Gateway-${data.uuid.slice(-6)}`, data.firmwareVersion || 'v1.0.0-dommia', data.tenantId || null],
    );
    return res.rows[0];
  }

  async updateHeartbeat(uuid: string, ipLocal?: string) {
    const res = await this.db.query(
      `UPDATE public.gateway_inventory
       SET status = 'ONLINE', last_heartbeat = NOW(), ip_local = COALESCE($1, ip_local)
       WHERE uuid = $2
       RETURNING id, uuid, status, last_heartbeat, last_heartbeat as last_seen_at, ip_local`,
      [ipLocal || null, uuid],
    );
    return res.rows[0] || null;
  }

  async updateGateway(
    uuid: string,
    data: { name?: string; tenantId?: string | null; firmwareVersion?: string; notes?: string },
  ) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(data.name.trim());
    }
    if (data.tenantId !== undefined) {
      fields.push(`tenant_id = $${idx++}`);
      values.push(data.tenantId || null);
    }
    if (data.firmwareVersion !== undefined) {
      fields.push(`firmware_version = $${idx++}`);
      values.push(data.firmwareVersion.trim());
    }
    if (data.notes !== undefined) {
      fields.push(`notes = $${idx++}`);
      values.push(data.notes.trim());
    }

    if (fields.length === 0) return this.findGatewayByUuid(uuid);

    values.push(uuid);
    const query = `UPDATE public.gateway_inventory SET ${fields.join(', ')}, updated_at = NOW() WHERE uuid = $${idx} RETURNING *`;
    const res = await this.db.query(query, values);
    return res.rows[0] || null;
  }


  // ==========================================
  // PLANS & METRICS
  // ==========================================
  async findPublicPlans() {
    const res = await this.db.query(
      `SELECT code, name, description,
              monthly_price AS "monthlyPrice",
              min_properties AS "minProperties",
              max_properties AS "maxProperties",
              includes_custom_domain AS "includesCustomDomain",
              custom_domain_addon_price AS "customDomainAddonPrice",
              standard_domain_pattern AS "standardDomainPattern",
              is_highlighted AS "isHighlighted",
              sort_order AS "sortOrder"
       FROM public.saas_plans
       WHERE is_active = TRUE
       ORDER BY sort_order ASC, monthly_price ASC`,
    );
    return res.rows;
  }

  async findAllPlans() {
    const res = await this.db.query(
      `SELECT id, code, name, description, 
              monthly_price as "monthly_price", monthly_price as "monthlyPrice", 
              min_properties as "min_properties", min_properties as "minProperties",
              max_properties as "max_properties", max_properties as "maxProperties", 
              price_per_extra_property as "price_per_extra_property", price_per_extra_property as "pricePerExtraProperty",
              includes_custom_domain as "includes_custom_domain", includes_custom_domain as "includesCustomDomain", 
              custom_domain_addon_price as "custom_domain_addon_price", custom_domain_addon_price as "customDomainAddonPrice", 
              standard_domain_pattern as "standard_domain_pattern", standard_domain_pattern as "standardDomainPattern",
              included_modules as "included_modules", included_modules as "includedModules", 
              available_addons as "available_addons", available_addons as "availableAddons", 
              is_active as "is_active", is_active as "isActive", 
              is_highlighted as "is_highlighted", is_highlighted as "isHighlighted", 
              sort_order as "sort_order", sort_order as "sortOrder",
              updated_at as "updated_at", updated_at as "updatedAt"
       FROM public.saas_plans 
       ORDER BY sort_order ASC, monthly_price ASC`,
    );
    return res.rows;
  }

  async findPlanById(id: string) {
    const res = await this.db.query(
      `SELECT id, code, name, description, 
              monthly_price as "monthly_price", monthly_price as "monthlyPrice", 
              min_properties as "min_properties", min_properties as "minProperties",
              max_properties as "max_properties", max_properties as "maxProperties", 
              price_per_extra_property as "price_per_extra_property", price_per_extra_property as "pricePerExtraProperty",
              includes_custom_domain as "includes_custom_domain", includes_custom_domain as "includesCustomDomain", 
              custom_domain_addon_price as "custom_domain_addon_price", custom_domain_addon_price as "customDomainAddonPrice", 
              standard_domain_pattern as "standard_domain_pattern", standard_domain_pattern as "standardDomainPattern",
              included_modules as "included_modules", included_modules as "includedModules", 
              available_addons as "available_addons", available_addons as "availableAddons", 
              is_active as "is_active", is_active as "isActive", 
              is_highlighted as "is_highlighted", is_highlighted as "isHighlighted", 
              sort_order as "sort_order", sort_order as "sortOrder",
              updated_at as "updated_at", updated_at as "updatedAt"
       FROM public.saas_plans 
       WHERE id = $1`,
      [id],
    );
    return res.rows[0] || null;
  }

  async findPlanByCode(code: string) {
    const res = await this.db.query(
      `SELECT id, code, name, description, 
              monthly_price as "monthly_price", monthly_price as "monthlyPrice", 
              min_properties as "min_properties", min_properties as "minProperties",
              max_properties as "max_properties", max_properties as "maxProperties", 
              price_per_extra_property as "price_per_extra_property", price_per_extra_property as "pricePerExtraProperty",
              includes_custom_domain as "includes_custom_domain", includes_custom_domain as "includesCustomDomain", 
              custom_domain_addon_price as "custom_domain_addon_price", custom_domain_addon_price as "customDomainAddonPrice", 
              standard_domain_pattern as "standard_domain_pattern", standard_domain_pattern as "standardDomainPattern",
              included_modules as "included_modules", included_modules as "includedModules", 
              available_addons as "available_addons", available_addons as "availableAddons", 
              is_active as "is_active", is_active as "isActive", 
              is_highlighted as "is_highlighted", is_highlighted as "isHighlighted", 
              sort_order as "sort_order", sort_order as "sortOrder",
              updated_at as "updated_at", updated_at as "updatedAt"
       FROM public.saas_plans 
       WHERE UPPER(code) = $1`,
      [code.toUpperCase()],
    );
    return res.rows[0] || null;
  }

  async updatePlan(id: string, data: any) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(data.description);
    }
    if (data.monthlyPrice !== undefined) {
      fields.push(`monthly_price = $${idx++}`);
      values.push(data.monthlyPrice);
    }
    if (data.minProperties !== undefined) {
      fields.push(`min_properties = $${idx++}`);
      values.push(data.minProperties);
    }
    if (data.maxProperties !== undefined) {
      fields.push(`max_properties = $${idx++}`);
      values.push(data.maxProperties);
    }
    if (data.pricePerExtraProperty !== undefined) {
      fields.push(`price_per_extra_property = $${idx++}`);
      values.push(data.pricePerExtraProperty);
    }
    if (data.includesCustomDomain !== undefined) {
      fields.push(`includes_custom_domain = $${idx++}`);
      values.push(data.includesCustomDomain);
    }
    if (data.customDomainAddonPrice !== undefined) {
      fields.push(`custom_domain_addon_price = $${idx++}`);
      values.push(data.customDomainAddonPrice);
    }
    if (data.includedModules !== undefined) {
      fields.push(`included_modules = $${idx++}`);
      values.push(JSON.stringify(data.includedModules));
    }
    if (data.availableAddons !== undefined) {
      fields.push(`available_addons = $${idx++}`);
      values.push(JSON.stringify(data.availableAddons));
    }
    if (data.isActive !== undefined) {
      fields.push(`is_active = $${idx++}`);
      values.push(data.isActive);
    }

    if (fields.length === 0) return this.findPlanById(id);

    fields.push('updated_at = NOW()');
    values.push(id);

    await this.db.query(
      `UPDATE public.saas_plans SET ${fields.join(', ')} WHERE id = $${idx}`,
      values,
    );
    return this.findPlanById(id);
  }

  async getMetricsRaw() {
    const [prospectsRes, tenantsRes, gatewaysRes, plansRes] = await Promise.all([
      this.db.query('SELECT stage, count(*)::int as count FROM public.crm_prospects GROUP BY stage'),
      this.db.query(
        `SELECT t.id, t.slug, t.name, t.tier, t.max_properties, t.is_active, t.has_custom_domain,
                current_subscription.id AS subscription_id,
                current_subscription.amount AS subscription_amount,
                current_subscription.billing_interval AS subscription_billing_interval,
                current_subscription.contract_review_required
         FROM public.tenants t
         LEFT JOIN LATERAL (
           SELECT id, amount, billing_interval, contract_review_required
           FROM public.subscriptions
           WHERE tenant_id = t.id AND status = 'ACTIVE'
           ORDER BY current_period_start DESC NULLS LAST, created_at DESC
           LIMIT 1
         ) current_subscription ON true
         WHERE t.is_active = true`,
      ),
      this.db.query("SELECT count(*)::int as total, count(*) FILTER (WHERE status = 'ONLINE')::int as online FROM public.gateway_inventory"),
      this.db.query('SELECT code, name, monthly_price as "monthlyPrice", max_properties as "maxProperties" FROM public.saas_plans'),
    ]);

    return {
      prospectsByStage: prospectsRes.rows,
      activeTenants: tenantsRes.rows,
      totalGatewaysCount: gatewaysRes.rows[0]?.total || 0,
      onlineGatewaysCount: gatewaysRes.rows[0]?.online || 0,
      plans: plansRes.rows,
    };
  }

  // ==========================================
  // SELF SERVICE HELPER
  // ==========================================
  async recordProspectWon(data: { name: string; email: string; phone: string; communityName: string; maxHouses: number }) {
    const res = await this.db.query(
      `INSERT INTO public.crm_prospects (name, email, phone, community_name, estimated_houses, stage, notes)
       VALUES ($1, $2, $3, $4, $5, 'WON', 'Auto-contratación digital directa completada exitosamente.')
       RETURNING id`,
      [data.name, data.email, data.phone, data.communityName, data.maxHouses],
    );
    return res.rows[0]?.id;
  }

  async recordSubscription(data: {
    tenantId: string;
    tier: string;
    amount: number;
    hasCustomDomain: boolean;
    activeAddons: any[];
  }) {
    await this.db.query(
      `WITH period AS (SELECT NOW() AS period_start)
       INSERT INTO public.subscriptions (
         tenant_id, plan_tier, amount, billing_interval, status,
         current_period_start, current_period_end, has_custom_domain, active_addons,
         contract_review_required
       )
       SELECT $1, $2, $3, 'MONTHLY', 'ACTIVE', period_start,
              period_start + INTERVAL '1 month', $4, $5, false
       FROM period`,
      [
        data.tenantId,
        data.tier,
        data.amount,
        data.hasCustomDomain,
        JSON.stringify(data.activeAddons),
      ],
    );
  }

  async createInitialContract(tenantId: string, billingInterval: 'MONTHLY' | 'ANNUAL' = 'MONTHLY') {
    return this.db.withTransaction(async (client) => {
      const tenantResult = await client.query(
        `SELECT t.id, t.tier, t.has_custom_domain,
                plan.monthly_price, plan.includes_custom_domain, plan.custom_domain_addon_price
         FROM public.tenants t
         LEFT JOIN public.saas_plans plan ON UPPER(plan.code) = UPPER(t.tier) AND plan.is_active = true
         WHERE t.id = $1 AND t.is_active = true
         FOR UPDATE OF t`,
        [tenantId],
      );
      const tenant = tenantResult.rows[0];
      if (!tenant) return { conflict: 'not_found' as const };

      const existingResult = await client.query(
        `SELECT id, tenant_id AS "tenantId", plan_tier AS "planTier", amount,
                billing_interval AS "billingInterval", status,
                current_period_start AS "currentPeriodStart", current_period_end AS "currentPeriodEnd",
                has_custom_domain AS "hasCustomDomain", active_addons AS "activeAddons",
                contract_review_required AS "contractReviewRequired"
         FROM public.subscriptions
         WHERE tenant_id = $1 AND status = 'ACTIVE'
         ORDER BY current_period_start DESC NULLS LAST, created_at DESC
         LIMIT 1
         FOR UPDATE`,
        [tenantId],
      );
      if (existingResult.rows[0]) return { contract: existingResult.rows[0], created: false };
      if (tenant.monthly_price === null || tenant.monthly_price === undefined) {
        return { conflict: 'plan_unavailable' as const };
      }

      const addonAmount = tenant.has_custom_domain && !tenant.includes_custom_domain
        ? Number(tenant.custom_domain_addon_price || 0)
        : 0;
      const activeAddons = addonAmount > 0
        ? [{ type: 'CUSTOM_DOMAIN', name: 'Subdominio Personalizado', price: addonAmount }]
        : [];
      const inserted = await client.query(
        `WITH period AS (SELECT NOW() AS period_start)
         INSERT INTO public.subscriptions (
           tenant_id, plan_tier, amount, billing_interval, has_custom_domain, active_addons,
           status, current_period_start, current_period_end, contract_review_required
         )
          SELECT $1, $2, ($3::numeric * CASE WHEN $6 = 'ANNUAL' THEN 12 ELSE 1 END), $6, $4, $5::jsonb, 'ACTIVE', period_start,
            period_start + CASE WHEN $6 = 'ANNUAL' THEN INTERVAL '1 year' ELSE INTERVAL '1 month' END, false
         FROM period
         RETURNING id, tenant_id AS "tenantId", plan_tier AS "planTier", amount,
                   billing_interval AS "billingInterval", status,
                   current_period_start AS "currentPeriodStart", current_period_end AS "currentPeriodEnd",
                   has_custom_domain AS "hasCustomDomain", active_addons AS "activeAddons",
                   contract_review_required AS "contractReviewRequired"`,
        [tenantId, tenant.tier, Number(tenant.monthly_price) + addonAmount, Boolean(tenant.has_custom_domain), JSON.stringify(activeAddons), billingInterval],
      );
      return { contract: inserted.rows[0], created: true };
    });
  }

  async reconcileCurrentContract(tenantId: string, amount: number, currentPeriodEnd: Date, billingInterval: 'MONTHLY' | 'ANNUAL') {
    return this.db.withTransaction(async (client) => {
      const tenantResult = await client.query(
        `SELECT id, tier, has_custom_domain FROM public.tenants WHERE id = $1 AND is_active = true FOR UPDATE`,
        [tenantId],
      );
      const tenant = tenantResult.rows[0];
      if (!tenant) return { conflict: 'not_found' as const };

      const currentResult = await client.query(
        `SELECT id, amount, contract_review_required FROM public.subscriptions
         WHERE tenant_id = $1 AND status = 'ACTIVE'
         ORDER BY current_period_start DESC NULLS LAST, created_at DESC
         LIMIT 1 FOR UPDATE`,
        [tenantId],
      );
      const current = currentResult.rows[0];
      if (current && current.amount !== null && !current.contract_review_required) {
        return { conflict: 'already_verified' as const };
      }

      const result = current
        ? await client.query(
          `UPDATE public.subscriptions
           SET plan_tier = COALESCE(plan_tier, $2), amount = $3, billing_interval = $6,
               has_custom_domain = $4, current_period_start = COALESCE(current_period_start, NOW()),
               current_period_end = $5, renewal_amount = NULL, renewal_notice_sent_at = NULL,
               renewal_notice_to = NULL, contract_review_required = false, updated_at = NOW()
           WHERE id = $1
           RETURNING id, tenant_id AS "tenantId", plan_tier AS "planTier", amount,
                     billing_interval AS "billingInterval", status,
                     current_period_start AS "currentPeriodStart", current_period_end AS "currentPeriodEnd",
                     has_custom_domain AS "hasCustomDomain", active_addons AS "activeAddons",
                     contract_review_required AS "contractReviewRequired"`,
          [current.id, tenant.tier, amount, Boolean(tenant.has_custom_domain), currentPeriodEnd, billingInterval],
        )
        : await client.query(
          `INSERT INTO public.subscriptions (
             tenant_id, plan_tier, amount, billing_interval, has_custom_domain, active_addons,
             status, current_period_start, current_period_end, contract_review_required
           )
           VALUES ($1, $2, $3, $6, $4, '[]'::jsonb, 'ACTIVE', NOW(), $5, false)
           RETURNING id, tenant_id AS "tenantId", plan_tier AS "planTier", amount,
                     billing_interval AS "billingInterval", status,
                     current_period_start AS "currentPeriodStart", current_period_end AS "currentPeriodEnd",
                     has_custom_domain AS "hasCustomDomain", active_addons AS "activeAddons",
                     contract_review_required AS "contractReviewRequired"`,
          [tenantId, tenant.tier, amount, Boolean(tenant.has_custom_domain), currentPeriodEnd, billingInterval],
        );

      return { contract: result.rows[0], created: !current };
    });
  }

  async findCurrentContract(tenantId: string) {
    const result = await this.db.query(
      `SELECT s.id, s.tenant_id AS "tenantId", t.name AS "tenantName", t.slug AS "tenantSlug",
              s.plan_tier AS "planTier", s.amount, s.billing_interval AS "billingInterval",
              s.has_custom_domain AS "hasCustomDomain", s.active_addons AS "activeAddons",
              s.status, s.current_period_start AS "currentPeriodStart",
              s.current_period_end AS "currentPeriodEnd", s.renewal_amount AS "renewalAmount",
                (SELECT (plan.monthly_price + CASE
                 WHEN s.has_custom_domain AND NOT plan.includes_custom_domain AND UPPER(plan.code) <> 'ENTERPRISE'
                  THEN plan.custom_domain_addon_price ELSE 0 END)
                  * CASE WHEN s.billing_interval = 'ANNUAL' THEN 12 ELSE 1 END
               FROM public.saas_plans plan
               WHERE UPPER(plan.code) = UPPER(s.plan_tier) AND plan.is_active = true
               LIMIT 1) AS "catalogRenewalAmount",
              s.renewal_notice_sent_at AS "renewalNoticeSentAt",
              s.renewal_notice_to AS "renewalNoticeTo",
              s.contract_review_required AS "contractReviewRequired"
       FROM public.subscriptions s
       JOIN public.tenants t ON t.id = s.tenant_id
       WHERE s.tenant_id = $1 AND s.status = 'ACTIVE'
       ORDER BY s.current_period_start DESC NULLS LAST, s.created_at DESC
       LIMIT 1`,
      [tenantId],
    );
    return result.rows[0] || null;
  }

  async recordRenewalNotice(tenantId: string, recipient: string) {
    const result = await this.db.query(
      `WITH current_contract AS (
         SELECT id, plan_tier, has_custom_domain, amount, billing_interval, contract_review_required, current_period_end
         FROM public.subscriptions
         WHERE tenant_id = $1 AND status = 'ACTIVE'
         ORDER BY current_period_start DESC NULLS LAST, created_at DESC
         LIMIT 1
         FOR UPDATE
       ), catalog AS (
         SELECT current_contract.id,
                plan.monthly_price + CASE
                  WHEN current_contract.has_custom_domain
                    AND NOT plan.includes_custom_domain
                    AND UPPER(plan.code) <> 'ENTERPRISE'
                  THEN plan.custom_domain_addon_price
                  ELSE 0
                END AS monthly_amount
         FROM current_contract
         JOIN public.saas_plans plan ON UPPER(plan.code) = UPPER(current_contract.plan_tier)
         WHERE plan.is_active = true
           AND current_contract.amount IS NOT NULL
           AND current_contract.contract_review_required = false
           AND current_contract.current_period_end > NOW()
       )
       UPDATE public.subscriptions subscription
      SET renewal_amount = catalog.monthly_amount * CASE WHEN subscription.billing_interval = 'ANNUAL' THEN 12 ELSE 1 END,
           renewal_notice_sent_at = NOW(),
           renewal_notice_to = $2,
           updated_at = NOW()
       FROM catalog
       WHERE subscription.id = catalog.id
       RETURNING subscription.id, subscription.tenant_id AS "tenantId",
                 subscription.plan_tier AS "planTier", subscription.amount,
                 subscription.billing_interval AS "billingInterval",
                 subscription.renewal_amount AS "renewalAmount",
                 subscription.renewal_notice_sent_at AS "renewalNoticeSentAt",
                 subscription.renewal_notice_to AS "renewalNoticeTo",
                 subscription.current_period_end AS "currentPeriodEnd"`,
      [tenantId, recipient.trim()],
    );
    return result.rows[0] || null;
  }

  async sendRenewalNotice(
    tenantId: string,
    recipient: string,
    deliver: (notice: { tenantName: string; currentAmount: number; renewalAmount: number; billingInterval: 'MONTHLY' | 'ANNUAL'; currentPeriodEnd: Date }) => Promise<void>,
  ) {
    return this.db.withTransaction(async (client) => {
      const currentResult = await client.query(
        `SELECT s.id, s.amount, s.plan_tier, s.has_custom_domain, s.billing_interval AS "billingInterval",
                s.current_period_end AS "currentPeriodEnd", s.contract_review_required AS "contractReviewRequired",
                s.renewal_amount AS "renewalAmount", s.renewal_notice_sent_at AS "renewalNoticeSentAt",
                t.name AS "tenantName"
         FROM public.subscriptions s
         JOIN public.tenants t ON t.id = s.tenant_id
         WHERE s.tenant_id = $1 AND s.status = 'ACTIVE'
         ORDER BY s.current_period_start DESC NULLS LAST, s.created_at DESC
         LIMIT 1 FOR UPDATE OF s`,
        [tenantId],
      );
      const current = currentResult.rows[0];
      if (!current) return { conflict: 'not_found' as const };
      if (current.amount === null || current.contractReviewRequired) return { conflict: 'reconciliation_required' as const };
      if (!current.currentPeriodEnd || new Date(current.currentPeriodEnd).getTime() <= Date.now()) {
        return { conflict: 'expired' as const };
      }

      const planResult = await client.query(
        `SELECT monthly_price + CASE
                  WHEN $2::boolean AND NOT includes_custom_domain AND UPPER(code) <> 'ENTERPRISE'
                  THEN custom_domain_addon_price ELSE 0 END AS monthly_amount
         FROM public.saas_plans
         WHERE UPPER(code) = UPPER($1) AND is_active = true
         FOR SHARE`,
        [current.plan_tier, current.has_custom_domain],
      );
      if (!planResult.rows[0]) return { conflict: 'plan_unavailable' as const };
      const amount = Number(planResult.rows[0].monthly_amount) * (current.billingInterval === 'ANNUAL' ? 12 : 1);
      if (amount <= Number(current.amount)) return { conflict: 'no_increase' as const };
      if (current.renewalNoticeSentAt && Number(current.renewalAmount) === amount) {
        return { conflict: 'already_sent' as const };
      }

      await deliver({ tenantName: current.tenantName, currentAmount: Number(current.amount), renewalAmount: amount, billingInterval: current.billingInterval, currentPeriodEnd: current.currentPeriodEnd });
      const result = await client.query(
        `UPDATE public.subscriptions
         SET renewal_amount = $2, renewal_notice_sent_at = clock_timestamp(),
             renewal_notice_to = $3, updated_at = NOW()
         WHERE id = $1 AND current_period_end > clock_timestamp()
         RETURNING id, tenant_id AS "tenantId", amount, billing_interval AS "billingInterval",
                   renewal_amount AS "renewalAmount", renewal_notice_sent_at AS "renewalNoticeSentAt",
                   renewal_notice_to AS "renewalNoticeTo", current_period_end AS "currentPeriodEnd"`,
        [current.id, amount, recipient],
      );
      if (!result.rows[0]) return { conflict: 'expired' as const };
      return { notice: result.rows[0] };
    });
  }

  async renewSubscription(tenantId: string) {
    return this.db.withTransaction(async (client) => {
      const currentResult = await client.query(
        `SELECT *, (current_period_end <= NOW()) AS period_due
         FROM public.subscriptions
         WHERE tenant_id = $1 AND status = 'ACTIVE'
         ORDER BY current_period_start DESC NULLS LAST, created_at DESC
         LIMIT 1
         FOR UPDATE`,
        [tenantId],
      );
      const current = currentResult.rows[0];
      if (!current) return { conflict: 'not_found' as const };
      if (!current.period_due) return { conflict: 'not_due' as const };
      if (current.amount === null || current.contract_review_required) {
        return { conflict: 'reconciliation_required' as const };
      }

      const planResult = await client.query(
        `SELECT monthly_price,
                monthly_price + CASE
                  WHEN $2::boolean AND NOT includes_custom_domain AND UPPER(code) <> 'ENTERPRISE'
                  THEN custom_domain_addon_price
                  ELSE 0
                END AS monthly_amount
         FROM public.saas_plans
         WHERE UPPER(code) = UPPER($1) AND is_active = true
         FOR SHARE`,
        [current.plan_tier, current.has_custom_domain],
      );
      if (!planResult.rows[0]) return { conflict: 'plan_unavailable' as const };

      const catalogAmount = Number(planResult.rows[0].monthly_amount) * (current.billing_interval === 'ANNUAL' ? 12 : 1);
      const lockedAmount = Number(current.amount);
      const priceIncrease = catalogAmount > lockedAmount;
      if (priceIncrease && (!current.renewal_notice_sent_at
        || new Date(current.renewal_notice_sent_at).getTime() >= new Date(current.current_period_end).getTime()
        || current.renewal_amount === null
        || Number(current.renewal_amount) !== catalogAmount)) {
        return { conflict: 'notice_required' as const };
      }

      const successorAmount = priceIncrease ? Number(current.renewal_amount) : catalogAmount;
      const periodStart = current.current_period_end;
      await client.query(
        `UPDATE public.subscriptions
         SET status = 'RENEWED', updated_at = NOW()
         WHERE id = $1`,
        [current.id],
      );
      const successorResult = await client.query(
        `INSERT INTO public.subscriptions (
           tenant_id, plan_tier, amount, billing_interval, has_custom_domain, active_addons,
           status, current_period_start, current_period_end, contract_review_required
         )
         VALUES ($1, $2, $3, $4::varchar, $5, $6, 'ACTIVE', $7,
           $7::timestamptz + CASE WHEN $4::varchar = 'ANNUAL' THEN INTERVAL '1 year' ELSE INTERVAL '1 month' END, false)
         RETURNING id, tenant_id AS "tenantId", plan_tier AS "planTier", amount,
                   billing_interval AS "billingInterval", has_custom_domain AS "hasCustomDomain",
                   active_addons AS "activeAddons", status,
                   current_period_start AS "currentPeriodStart", current_period_end AS "currentPeriodEnd",
                   renewal_amount AS "renewalAmount", renewal_notice_sent_at AS "renewalNoticeSentAt",
                   renewal_notice_to AS "renewalNoticeTo", contract_review_required AS "contractReviewRequired"`,
        [
          current.tenant_id,
          current.plan_tier,
          successorAmount,
          current.billing_interval,
          current.has_custom_domain,
          current.active_addons,
          periodStart,
        ],
      );
      return { successor: successorResult.rows[0] };
    });
  }
}
