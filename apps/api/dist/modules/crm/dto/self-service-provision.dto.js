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
exports.SelfServiceProvisionDto = void 0;
const class_validator_1 = require("class-validator");
class SelfServiceProvisionDto {
    communityName;
    slug;
    tier;
    maxProperties;
    adminName;
    adminEmail;
    adminPassword;
    paymentMethod = 'STRIPE_MOCK_CARD';
    hasCustomDomain = false;
    selectedAddons = [];
    honeypot;
}
exports.SelfServiceProvisionDto = SelfServiceProvisionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'El nombre del fraccionamiento es requerido' }),
    __metadata("design:type", String)
], SelfServiceProvisionDto.prototype, "communityName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'El identificador de subdominio (slug) es requerido' }),
    (0, class_validator_1.Matches)(/^[a-z0-9_]{3,30}$/, {
        message: 'El subdominio debe contener entre 3 y 30 caracteres (minúsculas, números o guiones bajos)',
    }),
    __metadata("design:type", String)
], SelfServiceProvisionDto.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['BASIC', 'STANDARD', 'PROFESSIONAL', 'ENTERPRISE'], { message: 'Tier de suscripción inválido' }),
    __metadata("design:type", String)
], SelfServiceProvisionDto.prototype, "tier", void 0);
__decorate([
    (0, class_validator_1.IsInt)({ message: 'El número de viviendas debe ser un número entero' }),
    (0, class_validator_1.Min)(5, { message: 'El mínimo de viviendas es 5' }),
    __metadata("design:type", Number)
], SelfServiceProvisionDto.prototype, "maxProperties", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'El nombre del administrador es requerido' }),
    __metadata("design:type", String)
], SelfServiceProvisionDto.prototype, "adminName", void 0);
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'El correo electrónico debe ser válido' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El correo electrónico es requerido' }),
    __metadata("design:type", String)
], SelfServiceProvisionDto.prototype, "adminEmail", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8, { message: 'La contraseña de administrador debe tener al menos 8 caracteres' }),
    __metadata("design:type", String)
], SelfServiceProvisionDto.prototype, "adminPassword", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SelfServiceProvisionDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SelfServiceProvisionDto.prototype, "hasCustomDomain", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], SelfServiceProvisionDto.prototype, "selectedAddons", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SelfServiceProvisionDto.prototype, "honeypot", void 0);
//# sourceMappingURL=self-service-provision.dto.js.map