import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { AccessService } from '../../access/services/access.service';
import { NotificationDeliveryService } from '../../notifications/services/notification-delivery.service';
import { TenantsRepository } from '../../tenants/repositories/tenants.repository';
import { CreateDeliveryDto, CollectDeliveryDto } from '../dto/delivery.dto';
import { DeliveriesRepository } from '../repositories/deliveries.repository';

@Injectable()
export class DeliveriesService {
  private readonly logger = new Logger(DeliveriesService.name);

  constructor(
    private readonly deliveriesRepository: DeliveriesRepository,
    private readonly accessService: AccessService,
    private readonly notificationDelivery: NotificationDeliveryService,
    private readonly tenantsRepo: TenantsRepository,
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

    // Notificar al residente registrado de la propiedad
    try {
      const residents = await this.deliveriesRepository.findResidentsByAddress(slug, dto.propertyAddress);
      const tenant = await this.tenantsRepo.findBySlug(slug);
      if (tenant && residents.length > 0) {
        for (const resident of residents) {
          if (resident.email || resident.phone) {
            await this.notificationDelivery.sendAccessGranted(
              slug,
              { email: resident.email || null, phone: resident.phone || null },
              {
                visitorName: `Paquete en resguardo (${dto.carrier})${dto.trackingCode ? ` [Guía: ${dto.trackingCode}]` : ''} - Destinatario: ${dto.recipientName}`,
                communityName: tenant.name,
                propertyAddress: dto.propertyAddress,
                accessTime: new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }),
              },
            );
          }
        }
      }
    } catch (error) {
      this.logger.warn(`No se pudo enviar notificación de paquetería para ${dto.propertyAddress}: ${error instanceof Error ? error.message : 'error desconocido'}`);
    }

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