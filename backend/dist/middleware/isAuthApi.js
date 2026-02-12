"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AppError_1 = __importDefault(require("../errors/AppError"));
const ListSettingByValueService_1 = __importDefault(require("../services/SettingServices/ListSettingByValueService"));
const context_1 = __importDefault(require("../libs/context"));
const isAuthApi = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        throw new AppError_1.default("ERR_SESSION_EXPIRED", 401);
    }
    const [, token] = authHeader.split(" ");
    try {
        const getToken = await (0, ListSettingByValueService_1.default)(token);
        if (!getToken) {
            throw new AppError_1.default("ERR_SESSION_EXPIRED", 401);
        }
        if (getToken.value !== token) {
            throw new AppError_1.default("ERR_SESSION_EXPIRED", 401);
        }
        const setting = await require("../models/Setting").default.findOne({ where: { value: token } });
        if (!setting) {
            throw new AppError_1.default("ERR_SESSION_EXPIRED", 401);
        }
        req.user = {
            id: "API",
            tenantId: setting.tenantId,
            profile: "admin"
        };
        return context_1.default.run({ tenantId: setting.tenantId.toString(), userId: "API" }, () => {
            return next();
        });
    }
    catch (err) {
        console.log(err);
        throw new AppError_1.default("Invalid token. We'll try to assign a new one on next request", 403);
    }
    return next();
};
exports.default = isAuthApi;
