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
exports.UpdateFeeConfigurationDto = exports.CreateFeeConfigurationDto = exports.EarlyBirdDiscountType = exports.LateFeeType = exports.FeeFrequency = exports.FeeType = void 0;
const class_validator_1 = require("class-validator");
var FeeType;
(function (FeeType) {
    FeeType["FIXED_RECURRENT"] = "FIXED_RECURRENT";
    FeeType["VARIABLE_LOT_SIZE"] = "VARIABLE_LOT_SIZE";
    FeeType["EXTRAORDINARY"] = "EXTRAORDINARY";
})(FeeType || (exports.FeeType = FeeType = {}));
var FeeFrequency;
(function (FeeFrequency) {
    FeeFrequency["MONTHLY"] = "MONTHLY";
    FeeFrequency["BI_MONTHLY"] = "BI_MONTHLY";
    FeeFrequency["ANNUAL"] = "ANNUAL";
    FeeFrequency["ONE_TIME"] = "ONE_TIME";
})(FeeFrequency || (exports.FeeFrequency = FeeFrequency = {}));
var LateFeeType;
(function (LateFeeType) {
    LateFeeType["NONE"] = "NONE";
    LateFeeType["PERCENTAGE"] = "PERCENTAGE";
    LateFeeType["FIXED"] = "FIXED";
})(LateFeeType || (exports.LateFeeType = LateFeeType = {}));
var EarlyBirdDiscountType;
(function (EarlyBirdDiscountType) {
    EarlyBirdDiscountType["NONE"] = "NONE";
    EarlyBirdDiscountType["PERCENTAGE"] = "PERCENTAGE";
    EarlyBirdDiscountType["FIXED"] = "FIXED";
})(EarlyBirdDiscountType || (exports.EarlyBirdDiscountType = EarlyBirdDiscountType = {}));
class CreateFeeConfigurationDto {
    name;
    feeType;
    baseAmount;
    frequency = FeeFrequency.MONTHLY;
    dueDay = 10;
    graceDays = 5;
    lateFeeType = LateFeeType.PERCENTAGE;
    lateFeeAmount = 10.0;
    earlyBirdDiscountType = EarlyBirdDiscountType.NONE;
    earlyBirdDiscountAmount = 0.0;
    earlyBirdDeadlineDay;
    appliesToAllProperties = true;
    isActive = true;
    description;
}
exports.CreateFeeConfigurationDto = CreateFeeConfigurationDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'El nombre del concepto de cuota es obligatorio' }),
    __metadata("design:type", String)
], CreateFeeConfigurationDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(FeeType, { message: 'Tipo de cuota inválido (FIXED_RECURRENT, VARIABLE_LOT_SIZE, EXTRAORDINARY)' }),
    __metadata("design:type", String)
], CreateFeeConfigurationDto.prototype, "feeType", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0, { message: 'El monto base no puede ser negativo' }),
    __metadata("design:type", Number)
], CreateFeeConfigurationDto.prototype, "baseAmount", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(FeeFrequency, { message: 'Frecuencia inválida (MONTHLY, BI_MONTHLY, ANNUAL, ONE_TIME)' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateFeeConfigurationDto.prototype, "frequency", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(31),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateFeeConfigurationDto.prototype, "dueDay", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(30),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateFeeConfigurationDto.prototype, "graceDays", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(LateFeeType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateFeeConfigurationDto.prototype, "lateFeeType", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateFeeConfigurationDto.prototype, "lateFeeAmount", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(EarlyBirdDiscountType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateFeeConfigurationDto.prototype, "earlyBirdDiscountType", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateFeeConfigurationDto.prototype, "earlyBirdDiscountAmount", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(31),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateFeeConfigurationDto.prototype, "earlyBirdDeadlineDay", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateFeeConfigurationDto.prototype, "appliesToAllProperties", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateFeeConfigurationDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateFeeConfigurationDto.prototype, "description", void 0);
class UpdateFeeConfigurationDto {
    name;
    feeType;
    baseAmount;
    frequency;
    dueDay;
    graceDays;
    lateFeeType;
    lateFeeAmount;
    earlyBirdDiscountType;
    earlyBirdDiscountAmount;
    earlyBirdDeadlineDay;
    appliesToAllProperties;
    isActive;
    description;
}
exports.UpdateFeeConfigurationDto = UpdateFeeConfigurationDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateFeeConfigurationDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(FeeType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateFeeConfigurationDto.prototype, "feeType", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateFeeConfigurationDto.prototype, "baseAmount", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(FeeFrequency),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateFeeConfigurationDto.prototype, "frequency", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(31),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateFeeConfigurationDto.prototype, "dueDay", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(30),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateFeeConfigurationDto.prototype, "graceDays", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(LateFeeType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateFeeConfigurationDto.prototype, "lateFeeType", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateFeeConfigurationDto.prototype, "lateFeeAmount", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(EarlyBirdDiscountType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateFeeConfigurationDto.prototype, "earlyBirdDiscountType", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateFeeConfigurationDto.prototype, "earlyBirdDiscountAmount", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(31),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateFeeConfigurationDto.prototype, "earlyBirdDeadlineDay", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateFeeConfigurationDto.prototype, "appliesToAllProperties", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateFeeConfigurationDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateFeeConfigurationDto.prototype, "description", void 0);
//# sourceMappingURL=fee-configuration.dto.js.map