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
exports.ResidentsService = void 0;
const common_1 = require("@nestjs/common");
const residents_repository_1 = require("../repositories/residents.repository");
const tenants_repository_1 = require("../../tenants/repositories/tenants.repository");
const auth_repository_1 = require("../../auth/repositories/auth.repository");
const notification_delivery_service_1 = require("../../notifications/services/notification-delivery.service");
let ResidentsService = class ResidentsService {
    residentsRepo;
    tenantsRepo;
    authRepo;
    notificationDelivery;
    constructor(residentsRepo, tenantsRepo, authRepo, notificationDelivery) {
        this.residentsRepo = residentsRepo;
        this.tenantsRepo = tenantsRepo;
        this.authRepo = authRepo;
        this.notificationDelivery = notificationDelivery;
    }
    async validateTenant(slug) {
        const tenant = await this.tenantsRepo.findByExactSlug(slug);
        if (!tenant) {
            throw new common_1.NotFoundException(`Fraccionamiento con slug "${slug}" no encontrado`);
        }
        return tenant;
    }
    async getTenantResidents(slug, propertyId) {
        await this.validateTenant(slug);
        return this.residentsRepo.findAllByTenant(slug, propertyId);
    }
    async createTenantResident(slug, dto) {
        await this.validateTenant(slug);
        const propertyExists = await this.residentsRepo.checkPropertyExists(slug, dto.propertyId);
        if (!propertyExists) {
            throw new common_1.NotFoundException('La propiedad seleccionada no existe.');
        }
        const emailExists = await this.residentsRepo.checkEmailExists(slug, dto.email);
        if (emailExists) {
            throw new common_1.ConflictException(`El correo electrónico "${dto.email}" ya está registrado para otro residente en este fraccionamiento.`);
        }
        const role = dto.role || 'OWNER';
        const isPrimary = dto.isPrimary !== undefined ? dto.isPrimary : (role === 'OWNER');
        const defaultPassword = dto.password || 'Dommia2026!';
        if (!dto.email?.trim() && !dto.phone?.trim()) {
            throw new common_1.BadRequestException('Captura un correo electrónico o un número celular para habilitar el acceso Resident.');
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
    async updateTenantResident(slug, id, dto) {
        await this.validateTenant(slug);
        const current = await this.residentsRepo.findById(slug, id);
        if (!current) {
            throw new common_1.NotFoundException(`Residente con ID "${id}" no encontrado.`);
        }
        if (dto.email && dto.email.toLowerCase() !== (current.email || '').toLowerCase()) {
            const emailExists = await this.residentsRepo.checkEmailExists(slug, dto.email, id);
            if (emailExists) {
                throw new common_1.ConflictException(`El correo electrónico "${dto.email}" ya está registrado por otro residente.`);
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
            throw new common_1.BadRequestException('El residente debe conservar un correo electrónico o un número celular para mantener el acceso Resident.');
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
    async deleteTenantResident(slug, id) {
        await this.validateTenant(slug);
        const existing = await this.residentsRepo.findById(slug, id);
        if (!existing) {
            throw new common_1.NotFoundException(`Residente con ID "${id}" no encontrado.`);
        }
        await this.residentsRepo.delete(slug, id);
        return { success: true, message: 'Residente eliminado exitosamente del padrón.' };
    }
    resolveInvitationContact(resident, requestedMethod = 'AUTO') {
        const email = resident.email?.trim() || null;
        const phone = resident.phone?.trim() || null;
        if (requestedMethod === 'EMAIL' && email)
            return { method: 'EMAIL', identifier: email };
        if (requestedMethod === 'PHONE' && phone)
            return { method: 'PHONE', identifier: phone };
        if (requestedMethod === 'AUTO' && email)
            return { method: 'EMAIL', identifier: email };
        if (requestedMethod === 'AUTO' && phone)
            return { method: 'PHONE', identifier: phone };
        return null;
    }
    async inviteTenantResident(slug, id, createdBy, contactMethod = 'AUTO', delivery = 'NONE') {
        const tenant = await this.validateTenant(slug);
        const resident = await this.residentsRepo.findById(slug, id);
        if (!resident)
            throw new common_1.NotFoundException(`Residente con ID "${id}" no encontrado.`);
        const contact = this.resolveInvitationContact(resident, contactMethod);
        if (!contact)
            throw new common_1.BadRequestException('El residente no tiene el dato de contacto requerido para generar la invitación.');
        const invitation = await this.authRepo.createResidentInvitation(slug, id, createdBy);
        const activationPath = `/activate-resident?token=${encodeURIComponent(invitation.token)}&tenant=${encodeURIComponent(slug)}`;
        if (delivery !== 'NONE') {
            const recipient = contact.method === 'EMAIL' ? resident.email : resident.phone;
            if (!recipient)
                throw new common_1.BadRequestException(`El residente no tiene un ${delivery === 'EMAIL' ? 'correo' : 'celular'} válido para envío.`);
            const message = { residentName: `${resident.first_name} ${resident.last_name}`, communityName: tenant.name, activationUrl: `${process.env.RESIDENT_APP_URL || 'http://localhost:3003'}${activationPath}`, expiresAt: new Date(invitation.expires_at).toLocaleString('es-MX') };
            if (delivery === 'EMAIL')
                await this.notificationDelivery.sendEmail(slug, recipient, message);
            else
                await this.notificationDelivery.sendWhatsApp(slug, recipient, message);
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
    async inviteTenantResidents(slug, dto) {
        const tenant = await this.validateTenant(slug);
        const residents = await this.residentsRepo.findAllByTenant(slug);
        const selectAll = dto.all === true || dto.residentIds === 'ALL';
        const selected = selectAll ? residents : residents.filter((resident) => Array.isArray(dto.residentIds) && dto.residentIds.includes(resident.id));
        const contactMethod = dto.contactMethod || 'AUTO';
        const contacts = selected.map((resident) => ({ resident, contact: this.resolveInvitationContact(resident, contactMethod) }));
        const missing = contacts.filter((item) => !item.contact).map((item) => `${item.resident.first_name} ${item.resident.last_name}`);
        if (missing.length > 0) {
            throw new common_1.BadRequestException(`No se generaron invitaciones. Falta ${contactMethod === 'PHONE' ? 'celular' : contactMethod === 'EMAIL' ? 'correo' : 'correo o celular'} en: ${missing.join(', ')}.`);
        }
        const results = [];
        for (const { resident, contact } of contacts) {
            const invitation = await this.authRepo.createResidentInvitation(slug, resident.id, dto.createdBy);
            const activationPath = `/activate-resident?token=${encodeURIComponent(invitation.token)}&tenant=${encodeURIComponent(slug)}`;
            if (dto.delivery && dto.delivery !== 'NONE') {
                const recipient = contact?.method === 'EMAIL' ? resident.email : resident.phone;
                if (!recipient)
                    throw new common_1.BadRequestException(`El residente ${resident.first_name} ${resident.last_name} no tiene un destino válido para envío.`);
                const message = { residentName: `${resident.first_name} ${resident.last_name}`, communityName: tenant.name, activationUrl: `${process.env.RESIDENT_APP_URL || 'http://localhost:3003'}${activationPath}`, expiresAt: new Date(invitation.expires_at).toLocaleString('es-MX') };
                if (dto.delivery === 'EMAIL')
                    await this.notificationDelivery.sendEmail(slug, recipient, message);
                else
                    await this.notificationDelivery.sendWhatsApp(slug, recipient, message);
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
};
exports.ResidentsService = ResidentsService;
exports.ResidentsService = ResidentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [residents_repository_1.ResidentsRepository,
        tenants_repository_1.TenantsRepository,
        auth_repository_1.AuthRepository,
        notification_delivery_service_1.NotificationDeliveryService])
], ResidentsService);
//# sourceMappingURL=residents.service.js.map