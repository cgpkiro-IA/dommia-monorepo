import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AccessOperatorClaims, AccessOperatorGuard } from '../../access/guards/access-operator.guard';
import { CollectDeliveryDto, CreateDeliveryDto } from '../dto/delivery.dto';
import { DeliveriesService } from '../services/deliveries.service';
import { Roles } from '../../auth/decorators/auth-metadata.decorator';

@Controller('tenants/:slug/guard/deliveries')
@UseGuards(AccessOperatorGuard)
@Roles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR', 'GUARD')
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Get()
  async list(@Param('slug') slug: string, @Query('status') status?: string) {
    return { success: true, data: await this.deliveriesService.list(slug, status) };
  }

  @Post()
  async receive(
    @Param('slug') slug: string,
    @Req() request: { user: AccessOperatorClaims },
    @Body() dto: CreateDeliveryDto,
  ) {
    return { success: true, data: await this.deliveriesService.receive(slug, request.user.sub, dto) };
  }

  @Patch(':id/collect')
  async collect(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Req() request: { user: AccessOperatorClaims },
    @Body() dto: CollectDeliveryDto,
  ) {
    return { success: true, data: await this.deliveriesService.collect(slug, id, request.user.sub, dto) };
  }
}