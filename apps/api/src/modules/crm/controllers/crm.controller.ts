import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  Req,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { CrmService } from '../services/crm.service';
import { CrmAnalyticsService } from '../services/crm-analytics.service';
import { CrmAlertsService } from '../services/crm-alerts.service';
import { TelegramAlertService } from '../services/telegram-alert.service';
import { CreateProspectDto } from '../dto/create-prospect.dto';
import { UpdateStageDto } from '../dto/update-stage.dto';
import { CreateGatewayDto } from '../dto/create-gateway.dto';
import { SelfServiceProvisionDto } from '../dto/self-service-provision.dto';
import { UpdatePlanDto } from '../dto/update-plan.dto';
import { CreateInitialContractDto, ReconcileContractDto, RecordRenewalNoticeDto, SendRenewalNoticeDto } from '../dto/reconcile-contract.dto';
import { CrmAdminGuard } from '../../auth/guards/crm-admin.guard';
import { Public, Roles } from '../../auth/decorators/auth-metadata.decorator';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { CreateCrmAlertDto, GatewayHeartbeatDto, ResolveCrmAlertDto, TestTelegramNotificationDto, UpdateGatewayDto, UpdateTelegramConfigDto } from '../dto/crm.dto';

@Controller('crm')
@Roles('SUPER_ADMIN', 'COMMERCIAL_EXEC', 'SUPPORT')
export class CrmController {
  constructor(
    private readonly crmService: CrmService,
    private readonly crmAnalyticsService: CrmAnalyticsService,
    private readonly crmAlertsService: CrmAlertsService,
    private readonly telegramAlertService: TelegramAlertService,
  ) {}

  @Get('public-plans')
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  async getPublicPlans() {
    const plans = await this.crmService.getPublicPlans();
    return {
      success: true,
      data: plans,
      count: plans.length,
    };
  }

  @Get('plans')
  @UseGuards(CrmAdminGuard)
  async getPlans() {
    const plans = await this.crmService.getPlans();
    return {
      success: true,
      data: plans,
      count: plans.length,
    };
  }

  @Put('plans/:id')
  @UseGuards(CrmAdminGuard)
  async updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    const updated = await this.crmService.updatePlan(id, dto);
    return {
      success: true,
      message: `Plan "${updated.name}" actualizado exitosamente`,
      data: updated,
    };
  }

  @Get('metrics')
  @UseGuards(CrmAdminGuard)
  async getMetrics() {
    const metrics = await this.crmService.getMetrics();
    return {
      success: true,
      data: metrics,
    };
  }

  @Get('tenants/:tenantId/contract')
  @UseGuards(CrmAdminGuard)
  async getCurrentContract(@Param('tenantId') tenantId: string) {
    return { success: true, data: await this.crmService.getCurrentContract(tenantId) };
  }

  @Post('tenants/:tenantId/contract')
  @UseGuards(CrmAdminGuard)
  @HttpCode(HttpStatus.CREATED)
  async createInitialContract(@Param('tenantId') tenantId: string, @Body() dto: CreateInitialContractDto) {
    const result = await this.crmService.createInitialContract(tenantId, dto?.billingInterval || 'MONTHLY');
    return {
      success: true,
      message: result.created ? 'Snapshot creado con el precio vigente del catálogo.' : 'El tenant ya tenía un contrato activo.',
      data: result.contract,
      created: result.created,
    };
  }

  @Post('tenants/:tenantId/contract/reconcile')
  @UseGuards(CrmAdminGuard)
  async reconcileCurrentContract(@Param('tenantId') tenantId: string, @Body() dto: ReconcileContractDto) {
    return {
      success: true,
      message: 'Contrato reconciliado con los términos confirmados por el operador.',
      data: await this.crmService.reconcileCurrentContract(tenantId, dto.amount, dto.currentPeriodEnd, dto.billingInterval || 'MONTHLY'),
    };
  }

  @Post('tenants/:tenantId/contract/renewal-notice')
  @UseGuards(CrmAdminGuard)
  async recordRenewalNotice(
    @Param('tenantId') tenantId: string,
    @Body() dto: RecordRenewalNoticeDto,
  ) {
    const result = await this.crmService.recordRenewalNotice(tenantId, dto.recipient, dto.noticeSent);
    return {
      success: true,
      message: 'Aviso registrado; este endpoint no envía correo.',
      data: result,
    };
  }

  @Post('tenants/:tenantId/contract/renewal-notice/send')
  @UseGuards(CrmAdminGuard)
  async sendRenewalNotice(@Param('tenantId') tenantId: string, @Body() dto: SendRenewalNoticeDto) {
    return {
      success: true,
      message: 'Aviso enviado por correo y registrado.',
      data: await this.crmService.sendRenewalNotice(tenantId, dto.recipient),
    };
  }

  @Post('tenants/:tenantId/contract/renewal-notice/preview')
  @UseGuards(CrmAdminGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async previewRenewalNotice(@Param('tenantId') tenantId: string, @Body() dto: SendRenewalNoticeDto) {
    return {
      success: true,
      message: 'Vista previa enviada sin modificar el contrato.',
      data: await this.crmService.previewRenewalNotice(tenantId, dto.recipient),
    };
  }

  @Post('tenants/:tenantId/contract/renew')
  @UseGuards(CrmAdminGuard)
  async renewSubscription(@Param('tenantId') tenantId: string) {
    return {
      success: true,
      message: 'Contrato renovado manualmente.',
      data: await this.crmService.renewSubscription(tenantId),
    };
  }

  @Post('self-service-provision')
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 15 * 60 * 1000 } })
  @HttpCode(HttpStatus.CREATED)
  async selfServiceProvision(@Body() dto: SelfServiceProvisionDto) {
    const result = await this.crmService.selfServiceProvision(dto);
    return {
      success: true,
      message: `¡Comunidad "${result.communityName}" activada y aprovisionada exitosamente en el plan ${result.tier}!`,
      data: result,
    };
  }

  @Post('prospects')
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  @HttpCode(HttpStatus.CREATED)
  async createProspect(@Body() dto: CreateProspectDto) {
    const prospect = await this.crmService.createProspect(dto);
    return {
      success: true,
      message: '¡Gracias por tu interés! Un asesor comercial de Dommia se pondrá en contacto contigo.',
      data: prospect,
    };
  }

  @Get('prospects')
  @UseGuards(CrmAdminGuard)
  async getProspects() {
    const prospects = await this.crmService.findAllProspects();
    return {
      success: true,
      data: prospects,
      count: prospects.length,
    };
  }

  @Patch('prospects/:id/stage')
  @UseGuards(CrmAdminGuard)
  async updateStage(@Param('id') id: string, @Body() dto: UpdateStageDto) {
    const updated = await this.crmService.updateProspectStage(id, dto);
    return {
      success: true,
      message: `Etapa actualizada a ${dto.stage}`,
      data: updated,
    };
  }

  @Get('gateways')
  @UseGuards(CrmAdminGuard)
  async getGateways() {
    const gateways = await this.crmService.findAllGateways();
    return {
      success: true,
      data: gateways,
      count: gateways.length,
    };
  }

  @Post('gateways')
  @UseGuards(CrmAdminGuard)
  @HttpCode(HttpStatus.CREATED)
  async registerGateway(@Body() dto: CreateGatewayDto) {
    const gateway = await this.crmService.registerGateway(dto);
    return {
      success: true,
      message: 'Gateway registrado exitosamente en el inventario IoT',
      data: gateway,
    };
  }

  @Post('gateways/:uuid/heartbeat')
  @UseGuards(CrmAdminGuard)
  @HttpCode(HttpStatus.OK)
  async recordHeartbeat(
    @Param('uuid') uuid: string,
    @Body() body: GatewayHeartbeatDto,
  ) {
    const gateway = await this.crmService.recordHeartbeat(uuid, body.ipLocal);
    return {
      success: true,
      message: 'Heartbeat registrado',
      data: gateway,
    };
  }

  @Put('gateways/:uuid')
  @UseGuards(CrmAdminGuard)
  async updateGateway(
    @Param('uuid') uuid: string,
    @Body() body: UpdateGatewayDto,
  ) {
    const gateway = await this.crmService.updateGateway(uuid, body);
    return {
      success: true,
      message: 'Gateway actualizado exitosamente',
      data: gateway,
    };
  }

  // ==========================================
  // DOMMIA ANALYTICS (EXCLUSIVO CRM MAESTRO)
  // ==========================================
  @Get('analytics')
  @UseGuards(CrmAdminGuard)
  async getAnalytics() {
    const analytics = await this.crmAnalyticsService.getAnalytics();
    return {
      success: true,
      data: analytics,
    };
  }

  // ==========================================
  // CENTRO DE ALERTAS & INCIDENTES DE PLATAFORMA
  // ==========================================
  @Get('alerts')
  @UseGuards(CrmAdminGuard)
  async getAlerts(
    @Query('status') status?: string,
    @Query('severity') severity?: string,
  ) {
    const alerts = await this.crmAlertsService.findAll(status, severity);
    const summary = await this.crmAlertsService.getSummary();
    return {
      success: true,
      data: alerts,
      summary,
    };
  }

  @Post('alerts')
  @UseGuards(CrmAdminGuard)
  @HttpCode(HttpStatus.CREATED)
  async createAlert(@Body() dto: CreateCrmAlertDto) {
    const created = await this.crmAlertsService.create(dto);
    return {
      success: true,
      message: 'Alerta registrada y despachada a canales configurados',
      data: created,
    };
  }

  @Post('alerts/:id/acknowledge')
  @UseGuards(CrmAdminGuard)
  async acknowledgeAlert(
    @Param('id') id: string,
    @Req() request: { user?: { email: string } },
  ) {
    const userEmail = request.user?.email || 'operador-crm@dommia.com.mx';
    const updated = await this.crmAlertsService.acknowledge(id, userEmail);
    return {
      success: true,
      message: 'Alerta marcada como reconocida',
      data: updated,
    };
  }

  @Post('alerts/:id/resolve')
  @UseGuards(CrmAdminGuard)
  async resolveAlert(
    @Param('id') id: string,
    @Body() body: ResolveCrmAlertDto,
    @Req() request: { user?: { email: string } },
  ) {
    const userEmail = request.user?.email || 'operador-crm@dommia.com.mx';
    const updated = await this.crmAlertsService.resolve(id, userEmail, body.notes);
    return {
      success: true,
      message: 'Alerta resuelta satisfactoriamente',
      data: updated,
    };
  }

  // ==========================================
  // CONFIGURACIÓN DE NOTIFICACIONES TELEGRAM BOT
  // ==========================================
  @Get('alerts/telegram-config')
  @UseGuards(CrmAdminGuard)
  async getTelegramConfig() {
    const config = await this.telegramAlertService.getConfig();
    return {
      success: true,
      data: config,
    };
  }

  @Put('alerts/telegram-config')
  @UseGuards(CrmAdminGuard)
  async updateTelegramConfig(
    @Body() body: UpdateTelegramConfigDto,
  ) {
    const config = await this.telegramAlertService.saveConfig(body);
    return {
      success: true,
      message: 'Configuración de Telegram actualizada',
      data: config,
    };
  }

  @Post('alerts/telegram-test')
  @UseGuards(CrmAdminGuard)
  async testTelegramNotification(
    @Body() body: TestTelegramNotificationDto,
  ) {
    const result = await this.telegramAlertService.testNotification(body.botToken, body.chatId);
    return {
      success: result.success,
      message: result.message,
    };
  }
}

