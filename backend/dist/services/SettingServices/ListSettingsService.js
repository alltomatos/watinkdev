"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Setting_1 = __importDefault(require("../../models/Setting"));
const ListSettingsService = async (params) => {
    const ctx = require("../../libs/context").default.getStore();
    const effectiveTenantId = (params === null || params === void 0 ? void 0 : params.tenantId) || (ctx === null || ctx === void 0 ? void 0 : ctx.tenantId);
    const whereCondition = effectiveTenantId ? { tenantId: effectiveTenantId } : {};
    const settings = await Setting_1.default.findAll({
        where: whereCondition
    });
    return settings;
};
exports.default = ListSettingsService;
