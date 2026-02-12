"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AppError_1 = __importDefault(require("../errors/AppError"));
const PermissionService_1 = __importDefault(require("../services/PermissionServices/PermissionService"));
/**
 * Enterprise Middleware for RBAC
 * Usage: checkPermission("tickets:read") or checkPermission("contacts:process")
 */
const checkPermission = (resourceAction) => {
    return async (req, res, next) => {
        const { id, tenantId } = req.user;
        const [resource, action] = resourceAction.split(":");
        if (!resource || !action) {
            throw new Error("Invalid permission format. Expected 'resource:action'");
        }
        try {
            const result = await PermissionService_1.default.check(parseInt(id.toString()), tenantId, resource, action);
            if (!result.authorized) {
                throw new AppError_1.default("ERR_NO_PERMISSION", 403);
            }
            // Inject scope for controllers
            req.permissionScope = result.scope;
            return next();
        }
        catch (err) {
            console.error(err);
            if (err instanceof AppError_1.default)
                throw err;
            throw new AppError_1.default("ERR_PERMISSION_CHECK_FAILED", 500);
        }
    };
};
exports.default = checkPermission;
