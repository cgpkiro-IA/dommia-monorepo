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
exports.CreateGatewayDto = void 0;
const class_validator_1 = require("class-validator");
class CreateGatewayDto {
    uuid;
    name;
    tenantId;
    firmwareVersion;
    notes;
}
exports.CreateGatewayDto = CreateGatewayDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'El UUID único del hardware es requerido' }),
    __metadata("design:type", String)
], CreateGatewayDto.prototype, "uuid", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'El nombre del Gateway o caseta es requerido' }),
    __metadata("design:type", String)
], CreateGatewayDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsUUID)('4', { message: 'El tenantId debe ser un UUID válido' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateGatewayDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateGatewayDto.prototype, "firmwareVersion", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateGatewayDto.prototype, "notes", void 0);
//# sourceMappingURL=create-gateway.dto.js.map