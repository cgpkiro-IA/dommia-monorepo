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
exports.CrmRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../../database/database.service");
let CrmRepository = class CrmRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async insertProspect(data) {
        const res = await this.db.query(`INSERT INTO public.crm_prospects (name, email, phone, community_name, estimated_houses, stage, notes)
       VALUES ($1, $2, $3, $4, $5, 'LEAD', $6)
       RETURNING id, name, email, phone, community_name, estimated_houses, stage, notes, created_at`, [
            data.name,
            data.email.toLowerCase().trim(),
            data.phone,
            data.communityName,
            data.estimatedHouses,
            data.notes,
        ]);
        return res.rows[0];
    }
    async findAllProspects() {
        const res = await this.db.query('SELECT id, name, email, phone, community_name, estimated_houses, stage, notes, created_at FROM public.crm_prospects ORDER BY created_at DESC');
        return res.rows;
    }
    async findProspectById(id) {
        const res = await this.db.query('SELECT id, name, email, phone, community_name, estimated_houses, stage, notes, created_at FROM public.crm_prospects WHERE id = $1', [id]);
        return res.rows[0] || null;
    }
    async updateProspectStage(id, stage) {
        const res = await this.db.query('UPDATE public.crm_prospects SET stage = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, stage, updated_at', [stage, id]);
        return res.rows[0] || null;
    }
    async findAllGateways() {
        const res = await this.db.query(`SELECT g.id, g.uuid, g.name, g.firmware_version, g.ip_local, g.status, 
              g.last_heartbeat, g.last_heartbeat as last_seen_at, g.notes, g.created_at,
              t.name as tenant_name, t.slug as tenant_slug
       FROM public.gateway_inventory g
       LEFT JOIN public.tenants t ON g.tenant_id = t.id
       ORDER BY g.created_at DESC`);
        return res.rows;
    }
    async findGatewayByUuid(uuid) {
        const res = await this.db.query('SELECT * FROM public.gateway_inventory WHERE uuid = $1', [uuid]);
        return res.rows[0] || null;
    }
    async createGateway(data) {
        const res = await this.db.query(`INSERT INTO public.gateway_inventory (uuid, name, firmware_version, tenant_id, status)
       VALUES ($1, $2, $3, $4, 'OFFLINE')
       RETURNING id, uuid, name, firmware_version, tenant_id, status, created_at`, [data.uuid, data.name || `Gateway-${data.uuid.slice(-6)}`, data.firmwareVersion || 'v1.0.0-dommia', data.tenantId || null]);
        return res.rows[0];
    }
    async updateHeartbeat(uuid, ipLocal) {
        const res = await this.db.query(`UPDATE public.gateway_inventory
       SET status = 'ONLINE', last_heartbeat = NOW(), ip_local = COALESCE($1, ip_local)
       WHERE uuid = $2
       RETURNING id, uuid, status, last_heartbeat, last_heartbeat as last_seen_at, ip_local`, [ipLocal || null, uuid]);
        return res.rows[0] || null;
    }
    async updateGateway(uuid, data) {
        const fields = [];
        const values = [];
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
        if (fields.length === 0)
            return this.findGatewayByUuid(uuid);
        values.push(uuid);
        const query = `UPDATE public.gateway_inventory SET ${fields.join(', ')}, updated_at = NOW() WHERE uuid = $${idx} RETURNING *`;
        const res = await this.db.query(query, values);
        return res.rows[0] || null;
    }
    async findAllPlans() {
        const res = await this.db.query(`SELECT id, code, name, description, 
              monthly_price as "monthly_price", monthly_price as "monthlyPrice", 
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
       ORDER BY sort_order ASC, monthly_price ASC`);
        return res.rows;
    }
    async findPlanById(id) {
        const res = await this.db.query(`SELECT id, code, name, description, 
              monthly_price as "monthly_price", monthly_price as "monthlyPrice", 
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
       WHERE id = $1`, [id]);
        return res.rows[0] || null;
    }
    async findPlanByCode(code) {
        const res = await this.db.query(`SELECT id, code, name, description, 
              monthly_price as "monthly_price", monthly_price as "monthlyPrice", 
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
       WHERE UPPER(code) = $1`, [code.toUpperCase()]);
        return res.rows[0] || null;
    }
    async updatePlan(id, data) {
        const fields = [];
        const values = [];
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
        if (fields.length === 0)
            return this.findPlanById(id);
        fields.push('updated_at = NOW()');
        values.push(id);
        await this.db.query(`UPDATE public.saas_plans SET ${fields.join(', ')} WHERE id = $${idx}`, values);
        return this.findPlanById(id);
    }
    async getMetricsRaw() {
        const [prospectsRes, tenantsRes, gatewaysRes, plansRes] = await Promise.all([
            this.db.query('SELECT stage, count(*)::int as count FROM public.crm_prospects GROUP BY stage'),
            this.db.query(`SELECT id, slug, name, tier, max_properties, is_active, has_custom_domain 
         FROM public.tenants 
         WHERE is_active = true`),
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
    async recordProspectWon(data) {
        const res = await this.db.query(`INSERT INTO public.crm_prospects (name, email, phone, community_name, estimated_houses, stage, notes)
       VALUES ($1, $2, $3, $4, $5, 'WON', 'Auto-contratación digital directa completada exitosamente.')
       RETURNING id`, [data.name, data.email, data.phone, data.communityName, data.maxHouses]);
        return res.rows[0]?.id;
    }
    async recordSubscription(data) {
        await this.db.query(`INSERT INTO public.subscriptions (tenant_id, plan_tier, amount, status, current_period_end, has_custom_domain, active_addons)
       VALUES ($1, $2, $3, 'ACTIVE', NOW() + INTERVAL '30 days', $4, $5)`, [
            data.tenantId,
            data.tier,
            data.amount,
            data.hasCustomDomain,
            JSON.stringify(data.activeAddons),
        ]);
    }
};
exports.CrmRepository = CrmRepository;
exports.CrmRepository = CrmRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], CrmRepository);
//# sourceMappingURL=crm.repository.js.map