import { ConflictException, Injectable } from '@nestjs/common';
import { AccessService } from '../../access/services/access.service';
import { CreateDeliveryDto, CollectDeliveryDto } from '../dto/delivery.dto';
import { DeliveriesRepository } from '../repositories/deliveries.repository';

@Injectable()
export class DeliveriesService {
  constructor(
    private readonly deliveriesRepository: DeliveriesRepository,
    private readonly accessService: AccessService,
  ) {}

  async list(slug: string, status?: string) {
    await this.accessService.assertAccessEnabled(slug);
    const normalizedStatus = status?.toUpperCase();
    const filter = normalizedStatus === 'PENDING' || normalizedStatus === 'COLLECTED'
      ? normalizedStatus
      : undefined;
    const rows = await this.deliveriesRepository.findRecent(slug, filter);
    return rows.map((row) => this.toDelivery(row));
  }

  async receive(slug: string, guardId: string, dto: CreateDeliveryDto) {
    await this.accessService.assertAccessEnabled(slug);
    const row = await this.deliveriesRepository.create(slug, guardId, dto);
    return this.toDelivery(row);
  }

  async collect(slug: string, id: string, guardId: string, dto: CollectDeliveryDto) {
    await this.accessService.assertAccessEnabled(slug);
    const row = await this.deliveriesRepository.collect(slug, id, guardId, dto.collectedByName);
    if (!row) throw new ConflictException('El paquete ya fue entregado o no está disponible.');
    return this.toDelivery(row);
  }

  private toDelivery(row: Record<string, any>) {
    return {
      id: row.id,
      recipientName: row.recipient_name,
      propertyAddress: row.property_address,
      carrier: row.carrier,
      trackingCode: row.tracking_code || undefined,
      notes: row.notes || undefined,
      status: row.status as 'PENDING' | 'COLLECTED',
      receivedBy: row.received_by,
      receivedAt: new Date(row.received_at).toISOString(),
      collectedBy: row.collected_by || undefined,
      collectedByName: row.collected_by_name || undefined,
      collectedAt: row.collected_at ? new Date(row.collected_at).toISOString() : undefined,
    };
  }
}