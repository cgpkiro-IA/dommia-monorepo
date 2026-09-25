"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoticesModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../../database/database.module");
const tenants_module_1 = require("../tenants/tenants.module");
const notices_controller_1 = require("./controllers/notices.controller");
const notices_service_1 = require("./services/notices.service");
const notices_repository_1 = require("./repositories/notices.repository");
let NoticesModule = class NoticesModule {
};
exports.NoticesModule = NoticesModule;
exports.NoticesModule = NoticesModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, tenants_module_1.TenantsModule],
        controllers: [notices_controller_1.NoticesController],
        providers: [notices_service_1.NoticesService, notices_repository_1.NoticesRepository],
        exports: [notices_service_1.NoticesService, notices_repository_1.NoticesRepository],
    })
], NoticesModule);
//# sourceMappingURL=notices.module.js.map