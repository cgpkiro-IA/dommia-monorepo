import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { AccessService } from '../../access/services/access.service';
import { CreateGuardIncidentDto, CreateVehicleFlagDto, GuardHistoryQueryDto } from '../dto/guard-operations.dto';
import { GuardOperationsRepository } from '../repositories/guard-operations.repository';

@Injectable()
export class GuardOperationsService {
  constructor(
    private readonly repository: GuardOperationsRepository,
    private readonly accessService: AccessService,
  ) {}

  async createIncident(slug: string, actorId: string, dto: CreateGuardIncidentDto) {
    await this.accessService.assertAccessEnabled(slug);
    return this.repository.createIncident(slug, actorId, dto);
  }

  async listIncidents(slug: string, status?: string) {
    await this.accessService.assertAccessEnabled(slug);
    const normalized = status?.toUpperCase();
    return this.repository.listIncidents(slug, normalized === 'OPEN' || normalized === 'RESOLVED' ? normalized : undefined);
  }

  async resolveIncident(slug: string, id: string, actorId: string) {
    await this.accessService.assertAccessEnabled(slug);
    const incident = await this.repository.resolveIncident(slug, id, actorId);
    if (!incident) throw new ConflictException('La incidencia ya fue resuelta o no existe.');
    return incident;
  }

  async history(slug: string, filters: GuardHistoryQueryDto) {
    await this.accessService.assertAccessEnabled(slug);
    if (filters.from && filters.to && new Date(filters.from) > new Date(filters.to)) {
      throw new BadRequestException('El rango de fechas no es válido.');
    }
    return this.repository.history(slug, filters);
  }

  async listVehicleFlags(slug: string) {
    await this.accessService.assertAccessEnabled(slug);
    return this.repository.listVehicleFlags(slug);
  }

  async createVehicleFlag(slug: string, actorId: string, dto: CreateVehicleFlagDto) {
    await this.accessService.assertAccessEnabled(slug);
    return this.repository.createVehicleFlag(slug, actorId, dto);
  }

  async removeVehicleFlag(slug: string, id: string, actorId: string) {
    await this.accessService.assertAccessEnabled(slug);
    const flag = await this.repository.removeVehicleFlag(slug, id, actorId);
    if (!flag) throw new ConflictException('La clasificación ya fue eliminada o no existe.');
    return flag;
  }
}