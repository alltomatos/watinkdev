"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AppError_1 = __importDefault(require("../errors/AppError"));
const User_1 = __importDefault(require("../models/User"));
const Group_1 = __importDefault(require("../models/Group"));
const Permission_1 = __importDefault(require("../models/Permission"));
const checkPermission = (permission) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        const { id } = req.user;
        const user = yield User_1.default.findByPk(id, {
            include: [
                {
                    model: Group_1.default,
                    as: "group",
                    include: [{ model: Permission_1.default, as: "permissions" }]
                },
                {
                    model: Permission_1.default,
                    as: "permissions"
                }
            ]
        });
        if (!user) {
            throw new AppError_1.default("User not found", 401);
        }
        // Super Admin by profile fallback
        if (user.profile === "admin" || user.profile === "superadmin") {
            return next();
        }
        const groupPermissions = ((_b = (_a = user.group) === null || _a === void 0 ? void 0 : _a.permissions) === null || _b === void 0 ? void 0 : _b.map(p => p.name)) || [];
        const individualPermissions = ((_c = user.permissions) === null || _c === void 0 ? void 0 : _c.map(p => p.name)) || [];
        // Merge permissions
        const allPermissions = [...new Set([...groupPermissions, ...individualPermissions])];
        if (!allPermissions.includes(permission)) {
            throw new AppError_1.default("ERR_NO_PERMISSION", 403);
        }
        return next();
    });
};
exports.default = checkPermission;
