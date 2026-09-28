import { BadRequestException, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ResidentsRepository } from '../repositories/residents.repository';
import { TenantsRepository } from '../../tenants/repositories/tenants.repository';
import { CreateResidentDto, InviteResidentsDto, UpdateResidentDto } from '../dto/resident.dto';
import { AuthRepository } from '../../auth/repositories/auth.repository';
import { NotificationDeliveryService } from '../../notifications/services/notification-delivery.service';

@Injectable()
export class ResidentsService {
  constructor(
    private readonly residentsRepo: ResidentsRepository,
    private readonly tenantsRepo: TenantsRepository,
    private readonly authRepo: AuthRepository,
    private readonly notificationDelivery: NotificationDeliveryService,
  ) {}

  private async validateTenant(slug: string) {
    const tenant = await this.tenantsRepo.findByExactSlug(slug);
    if (!tenant) {
      throw new NotFoundException(`Fraccionamiento con slug "${slug}" no encontrado`);
    }
    return tenant;
  }

  async getTenantResidents(slug: string, propertyId?: string) {
    await this.validateTenant(slug);
    return this.residentsRepo.findAllByTenant(slug, propertyId);
  }

  async createTenantResident(slug: string, dto: CreateResidentDto) {
    await this.validateTenant(slug);

    // Verify property exists
    const propertyExists = await this.residentsRepo.checkPropertyExists(slug, dto.propertyId);
    if (!propertyExists) {
      throw new NotFoundException('La propiedad seleccionada no existe.');
    }

    // Check email uniqueness within tenant
    const emailExists = await this.residentsRepo.checkEmailExists(slug, dto.email);
    if (emailExists) {
      throw new ConflictException(`El correo electrónico "${dto.email}" ya está registrado para otro residente en este fraccionamiento.`);
    }

    const role = dto.role || 'OWNER';
    const isPrimary = dto.isPrimary !== undefined ? dto.isPrimary : (role === 'OWNER');
    const defaultPassword = dto.password || 'Dommia2026!';
    if (!dto.email?.trim() && !dto.phone?.trim()) {
      throw new BadRequestException('Captura un correo electrónico o un número celular para habilitar el acceso Resident.');
    }

    if (isPrimary) {
      await this.residentsRepo.resetPrimaryForProperty(slug, dto.propertyId);
    }

    const created = await this.residentsRepo.create(slug, {
      propertyId: dto.propertyId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email || '',
      phone: dto.phone?.trim() || null,
      role,
      isPrimary,
      password: defaultPassword,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    const full = await this.residentsRepo.findAllByTenant(slug);
    return full.find((r) => r.id === created.id) || created;
  }

  async updateTenantResident(slug: string, id: string, dto: UpdateResidentDto) {
    await this.validateTenant(slug);

    const current = await this.residentsRepo.findById(slug, id);
    if (!current) {
      throw new NotFoundException(`Residente con ID "${id}" no encontrado.`);
    }

    if (dto.email && dto.email.toLowerCase() !== (current.email || '').toLowerCase()) {
      const emailExists = await this.residentsRepo.checkEmailExists(slug, dto.email, id);
      if (emailExists) {
        throw new ConflictException(`El correo electrónico "${dto.email}" ya está registrado por otro residente.`);
      }
    }

    const propertyId = dto.propertyId || current.property_id;
    const firstName = dto.firstName !== undefined ? dto.firstName.trim() : current.first_name;
    const lastName = dto.lastName !== undefined ? dto.lastName.trim() : current.last_name;
    const email = dto.email !== undefined ? (dto.email.trim().toLowerCase() || null) : current.email;
    const phone = dto.phone !== undefined ? dto.phone.trim() : current.phone;
    const role = dto.role !== undefined ? dto.role : current.role;
    const isPrimary = dto.isPrimary !== undefined ? dto.isPrimary : current.is_primary;
    const isActive = dto.isActive !== undefined ? dto.isActive : current.is_active;
    if (!email && !phone) {
      throw new BadRequestException('El residente debe conservar un correo electrónico o un número celular para mantener el acceso Resident.');
    }

    if (isPrimary && !current.is_primary) {
      await this.residentsRepo.resetPrimaryForProperty(slug, propertyId, id);
    }

    await this.residentsRepo.update(slug, id, {
      propertyId,
      firstName,
      lastName,
      email,
      phone,
      role,
      isPrimary,
      isActive,
    });

    const full = await this.residentsRepo.findAllByTenant(slug);
    return full.find((r) => r.id === id);
  }

  async deleteTenantResident(slug: string, id: string) {
    await this.validateTenant(slug);

    const existing = await this.residentsRepo.findById(slug, id);
    if (!existing) {
      throw new NotFoundException(`Residente con ID "${id}" no encontrado.`);
    }

    await this.residentsRepo.delete(slug, id);
    return { success: true, message: 'Residente eliminado exitosamente del padrón.' };
  }

  private resolveInvitationContact(resident: any, requestedMethod: 'AUTO' | 'EMAIL' | 'PHONE' = 'AUTO') {
    const email = resident.email?.trim() || null;
    const phone = resident.phone?.trim() || null;
    if (requestedMethod === 'EMAIL' && email) return { method: 'EMAIL', identifier: email };
    if (requestedMethod === 'PHONE' && phone) return { method: 'PHONE', identifier: phone };
    if (requestedMethod === 'AUTO' && email) return { method: 'EMAIL', identifier: email };
    if (requestedMethod === 'AUTO' && phone) return { method: 'PHONE', identifier: phone };
    return null;
  }

  async inviteTenantResident(slug: string, id: string, createdBy?: string, contactMethod: 'AUTO' | 'EMAIL' | 'PHONE' = 'AUTO', delivery: 'NONE' | 'EMAIL' | 'WHATSAPP' = 'NONE') {
    const tenant = await this.validateTenant(slug);
    const resident = await this.residentsRepo.findById(slug, id);
    if (!resident) throw new NotFoundException(`Residente con ID "${id}" no encontrado.`);
    const contact = this.resolveInvitationContact(resident, contactMethod);
    if (!contact) throw new BadRequestException('El residente no tiene el dato de contacto requerido para generar la invitación.');
    const invitation = await this.authRepo.createResidentInvitation(slug, id, createdBy);
    const activationPath = `/activate-resident?token=${encodeURIComponent(invitation.token)}&tenant=${encodeURIComponent(slug)}`;
    if (delivery !== 'NONE') {
      const recipient = contact.method === 'EMAIL' ? resident.email : resident.phone;
      if (!recipient) throw new BadRequestException(`El residente no tiene un ${delivery === 'EMAIL' ? 'correo' : 'celular'} válido para envío.`);
      const message = { residentName: `${resident.first_name} ${resident.last_name}`, communityName: tenant.name, activationUrl: `${process.env.RESIDENT_APP_URL || 'http://localhost:3003'}${activationPath}`, expiresAt: new Date(invitation.expires_at).toLocaleString('es-MX') };
      if (delivery === 'EMAIL') await this.notificationDelivery.sendEmail(slug, recipient, message);
      else await this.notificationDelivery.sendWhatsApp(slug, recipient, message);
    }
    return {
      residentId: id,
      activationToken: invitation.token,
      expiresAt: invitation.expires_at,
      contactMethod: contact.method,
      loginIdentifier: contact.identifier,
      tenantSlug: slug,
      activationPath,
      delivery,
    };
  }

  async inviteTenantResidents(slug: string, dto: InviteResidentsDto) {
    const tenant = await this.validateTenant(slug);
    const residents = await this.residentsRepo.findAllByTenant(slug);
    const selectAll = dto.all === true || dto.residentIds === 'ALL';
    const selected = selectAll ? residents : residents.filter((resident) => Array.isArray(dto.residentIds) && dto.residentIds.includes(resident.id));
    const contactMethod = dto.contactMethod || 'AUTO';
    const contacts = selected.map((resident) => ({ resident, contact: this.resolveInvitationContact(resident, contactMethod) }));
    const missing = contacts.filter((item) => !item.contact).map((item) => `${item.resident.first_name} ${item.resident.last_name}`);
    if (missing.length > 0) {
      throw new BadRequestException(`No se generaron invitaciones. Falta ${contactMethod === 'PHONE' ? 'celular' : contactMethod === 'EMAIL' ? 'correo' : 'correo o celular'} en: ${missing.join(', ')}.`);
    }
    const results = [];
    for (const { resident, contact } of contacts) {
      const invitation = await this.authRepo.createResidentInvitation(slug, resident.id, dto.createdBy);
      const activationPath = `/activate-resident?token=${encodeURIComponent(invitation.token)}&tenant=${encodeURIComponent(slug)}`;
      if (dto.delivery && dto.delivery !== 'NONE') {
        const recipient = contact?.method === 'EMAIL' ? resident.email : resident.phone;
        if (!recipient) throw new BadRequestException(`El residente ${resident.first_name} ${resident.last_name} no tiene un destino válido para envío.`);
        const message = { residentName: `${resident.first_name} ${resident.last_name}`, communityName: tenant.name, activationUrl: `${process.env.RESIDENT_APP_URL || 'http://localhost:3003'}${activationPath}`, expiresAt: new Date(invitation.expires_at).toLocaleString('es-MX') };
        if (dto.delivery === 'EMAIL') await this.notificationDelivery.sendEmail(slug, recipient, message);
        else await this.notificationDelivery.sendWhatsApp(slug, recipient, message);
      }
      results.push({ ...invitation, activationPath, delivery: dto.delivery || 'NONE' });
    }
    return results.map((invitation, index) => ({
      residentId: selected[index].id,
      residentName: `${selected[index].first_name} ${selected[index].last_name}`,
      email: selected[index].email,
      phone: selected[index].phone,
      contactMethod: contacts[index].contact?.method,
      loginIdentifier: contacts[index].contact?.identifier,
      tenantSlug: slug,
      activationToken: invitation.token,
      expiresAt: invitation.expires_at,
      activationPath: invitation.activationPath,
      delivery: invitation.delivery,
    }));
  }
}
