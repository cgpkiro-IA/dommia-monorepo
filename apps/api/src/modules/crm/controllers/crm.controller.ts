import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { CrmService } from '../services/crm.service';
import { CreateProspectDto } from '../dto/create-prospect.dto';
import { UpdateStageDto } from '../dto/update-stage.dto';
import { CreateGatewayDto } from '../dto/create-gateway.dto';
import { SelfServiceProvisionDto } from '../dto/self-service-provision.dto';
import { UpdatePlanDto } from '../dto/update-plan.dto';

@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get('plans')
  async getPlans() {
    const plans = await this.crmService.getPlans();
    return {
      success: true,
      data: plans,
      count: plans.length,
    };
  }

  @Put('plans/:id')
  async updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    const updated = await this.crmService.updatePlan(id, dto);
    return {
      success: true,
      message: `Plan "${updated.name}" actualizado exitosamente`,
      data: updated,
    };
  }

  @Get('metrics')
  async getMetrics() {
    const metrics = await this.crmService.getMetrics();
    return {
      success: true,
      data: metrics,
    };
  }

  @Post('self-service-provision')
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
  async getProspects() {
    const prospects = await this.crmService.findAllProspects();
    return {
      success: true,
      data: prospects,
      count: prospects.length,
    };
  }

  @Patch('prospects/:id/stage')
  async updateStage(@Param('id') id: string, @Body() dto: UpdateStageDto) {
    const updated = await this.crmService.updateProspectStage(id, dto);
    return {
      success: true,
      message: `Etapa actualizada a ${dto.stage}`,
      data: updated,
    };
  }

  @Get('gateways')
  async getGateways() {
    const gateways = await this.crmService.findAllGateways();
    return {
      success: true,
      data: gateways,
      count: gateways.length,
    };
  }

  @Post('gateways')
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
  @HttpCode(HttpStatus.OK)
  async recordHeartbeat(
    @Param('uuid') uuid: string,
    @Body() body: { ipLocal?: string },
  ) {
    const gateway = await this.crmService.recordHeartbeat(uuid, body.ipLocal);
    return {
      success: true,
      message: 'Heartbeat registrado',
      data: gateway,
    };
  }

  @Put('gateways/:uuid')
  async updateGateway(
    @Param('uuid') uuid: string,
    @Body() body: { name?: string; tenantId?: string; firmwareVersion?: string; notes?: string },
  ) {
    const gateway = await this.crmService.updateGateway(uuid, body);
    return {
      success: true,
      message: 'Gateway actualizado exitosamente',
      data: gateway,
    };
  }
}

