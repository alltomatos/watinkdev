"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = require("jsonwebtoken");
const AppError_1 = __importDefault(require("../errors/AppError"));
const auth_1 = __importDefault(require("../config/auth"));
const User_1 = __importDefault(require("../models/User"));
const context_1 = __importDefault(require("../libs/context"));
const isAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        throw new AppError_1.default("ERR_SESSION_EXPIRED", 401);
    }
    const [, token] = authHeader.split(" ");
    try {
        const decoded = (0, jsonwebtoken_1.verify)(token, auth_1.default.secret);
        const { id, tenantId, profile } = decoded;
        const user = await User_1.default.findByPk(id);
        if (!user) {
            throw new AppError_1.default("ERR_INVALID_TOKEN", 401);
        }
        req.user = {
            id,
            tenantId: user.tenantId.toString(),
            profile
        };
        return context_1.default.run({ tenantId: user.tenantId.toString(), userId: id }, () => {
            return next();
        });
    }
    catch (err) {
        console.log("DEBUG: isAuth failed. Header:", authHeader ? "YES" : "NO", "Token:", token ? token.slice(-6) : "NONE", "Error:", err.message);
        throw new AppError_1.default("Invalid token. We'll try to assign a new one on next request", 401);
    }
};
exports.default = isAuth;
