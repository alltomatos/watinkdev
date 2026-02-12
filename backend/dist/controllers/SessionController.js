"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove = exports.update = exports.store = void 0;
const AppError_1 = __importDefault(require("../errors/AppError"));
const AuthUserService_1 = __importDefault(require("../services/UserServices/AuthUserService"));
const SendRefreshToken_1 = require("../helpers/SendRefreshToken");
const RefreshTokenService_1 = require("../services/AuthServices/RefreshTokenService");
const store = async (req, res) => {
    const { email, password, rememberMe } = req.body;
    const { token, serializedUser, refreshToken } = await (0, AuthUserService_1.default)({
        email,
        password
    });
    const expires = rememberMe
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        : undefined;
    (0, SendRefreshToken_1.SendRefreshToken)(res, refreshToken, expires);
    return res.status(200).json({
        token,
        user: serializedUser
    });
};
exports.store = store;
const update = async (req, res) => {
    // DEBUG: Log all cookies received
    console.log("[DEBUG refresh_token] Cookies received:", JSON.stringify(req.cookies));
    console.log("[DEBUG refresh_token] Cookie header:", req.headers.cookie);
    const token = req.cookies.jrt;
    if (!token) {
        console.log("[DEBUG refresh_token] No jrt cookie found!");
        throw new AppError_1.default("ERR_SESSION_EXPIRED", 401);
    }
    const { user, newToken, refreshToken } = await (0, RefreshTokenService_1.RefreshTokenService)(res, token);
    (0, SendRefreshToken_1.SendRefreshToken)(res, refreshToken);
    return res.json({ token: newToken, user });
};
exports.update = update;
const remove = async (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || "";
    const isHttps = frontendUrl.startsWith("https://");
    // Extract domain for cookie clearing (must match how it was set)
    let domain;
    try {
        const url = new URL(frontendUrl);
        const hostParts = url.hostname.split(".");
        if (hostParts.length >= 2) {
            if (hostParts[hostParts.length - 1] === "localhost") {
                domain = undefined;
            }
            else {
                domain = "." + hostParts.slice(-2).join(".");
            }
        }
    }
    catch (e) {
        domain = undefined;
    }
    const clearOptions = {
        httpOnly: true,
        sameSite: isHttps ? "none" : "lax",
        secure: isHttps,
        path: "/"
    };
    if (domain) {
        clearOptions.domain = domain;
    }
    res.clearCookie("jrt", clearOptions);
    return res.send();
};
exports.remove = remove;
