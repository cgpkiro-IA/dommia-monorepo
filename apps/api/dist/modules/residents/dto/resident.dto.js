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
exports.InviteResidentDto = exports.InviteResidentsDto = exports.UpdateResidentDto = exports.CreateResidentDto = void 0;
const class_validator_1 = require("class-validator");
class CreateResidentDto {
    propertyId;
    firstName;
    lastName;
    email;
    phone;
    role = 'OWNER';
    isPrimary;
    password;
    isActive;
}
exports.CreateResidentDto = CreateResidentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateResidentDto.prototype, "propertyId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateResidentDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateResidentDto.prototype, "lastName", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_object, value) => value !== undefined && value !== null && value !== ''),
    __metadata("design:type", String)
], CreateResidentDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_object, value) => value !== undefined && value !== null && value !== ''),
    (0, class_validator_1.Matches)(/^\d{10}$/, { message: 'El celular debe tener exactamente 10 dígitos.' }),
    __metadata("design:type", String)
], CreateResidentDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateResidentDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateResidentDto.prototype, "isPrimary", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateResidentDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateResidentDto.prototype, "isActive", void 0);
class UpdateResidentDto {
    propertyId;
    firstName;
    lastName;
    email;
    phone;
    role;
    isPrimary;
    isActive;
}
exports.UpdateResidentDto = UpdateResidentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateResidentDto.prototype, "propertyId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateResidentDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateResidentDto.prototype, "lastName", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_object, value) => value !== undefined && value !== null && value !== ''),
    __metadata("design:type", String)
], UpdateResidentDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_object, value) => value !== undefined && value !== null && value !== ''),
    (0, class_validator_1.Matches)(/^\d{10}$/, { message: 'El celular debe tener exactamente 10 dígitos.' }),
    __metadata("design:type", String)
], UpdateResidentDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateResidentDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateResidentDto.prototype, "isPrimary", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateResidentDto.prototype, "isActive", void 0);
class InviteResidentsDto {
    residentIds;
    all;
    createdBy;
    contactMethod;
    delivery;
}
exports.InviteResidentsDto = InviteResidentsDto;
__decorate([
    (0, class_validator_1.ValidateIf)((dto) => dto.residentIds !== 'ALL'),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], InviteResidentsDto.prototype, "residentIds", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], InviteResidentsDto.prototype, "all", void 0);
__decorate([
    (0, class_validator_1.IsUUID)('4'),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], InviteResidentsDto.prototype, "createdBy", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['AUTO', 'EMAIL', 'PHONE']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], InviteResidentsDto.prototype, "contactMethod", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['NONE', 'EMAIL', 'WHATSAPP']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], InviteResidentsDto.prototype, "delivery", void 0);
class InviteResidentDto {
    createdBy;
    contactMethod;
    delivery;
}
exports.InviteResidentDto = InviteResidentDto;
__decorate([
    (0, class_validator_1.IsUUID)('4'),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], InviteResidentDto.prototype, "createdBy", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['AUTO', 'EMAIL', 'PHONE']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], InviteResidentDto.prototype, "contactMethod", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['NONE', 'EMAIL', 'WHATSAPP']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], InviteResidentDto.prototype, "delivery", void 0);
//# sourceMappingURL=resident.dto.js.map