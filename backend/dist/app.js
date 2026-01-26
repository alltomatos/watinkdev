"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
require("./bootstrap");
require("reflect-metadata");
require("express-async-errors");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const Sentry = __importStar(require("@sentry/node"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = __importDefault(require("./config/swagger"));
require("./database");
const upload_1 = __importDefault(require("./config/upload"));
const AppError_1 = __importDefault(require("./errors/AppError"));
const routes_1 = __importDefault(require("./routes"));
const logger_1 = require("./utils/logger");
Sentry.init({ dsn: process.env.SENTRY_DSN });
const app = (0, express_1.default)();
const protectedRoutesCors = (0, cors_1.default)({
    credentials: true,
    origin: (origin, callback) => {
        let frontendUrl = process.env.FRONTEND_URL || "http://app.localhost";
        if (frontendUrl.endsWith("/")) {
            frontendUrl = frontendUrl.slice(0, -1);
        }
        const allowedOrigins = [
            frontendUrl,
            frontendUrl.replace("http://", "https://"),
            frontendUrl.replace("https://", "http://"),
            "http://localhost:3000",
            "http://app.localhost"
        ];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            console.log(`[CORS Blocked] Origin: ${origin}, Allowed: ${allowedOrigins.join(", ")}`);
            callback(new Error("Not allowed by CORS"));
        }
    },
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Cache-Control",
        "Pragma",
        "x-tenant-id",
        "x-user-profile"
    ],
});
app.use((req, res, next) => {
    // Configurações de CORS permissivas para webchat e versionamento
    // Permitir que /webchat e /api/webchat passem sem o CORS restrito (protectedRoutesCors)
    // MAS, rotas como /webchat/version (que são internas/monitoramento) devem passar pelo CORS restrito
    // para garantir que headers corretos (Origin) sejam retornados em vez de * ou nada.
    const isWebchat = req.url.startsWith("/webchat") || req.url.startsWith("/api/webchat");
    const isVersionCheck = req.url.includes("/version");
    if (isWebchat && !isVersionCheck) {
        return next();
    }
    protectedRoutesCors(req, res, next);
});
const pluginRoutes_1 = __importDefault(require("./routes/pluginRoutes")); // Import plugin routes
// ... imports ...
// MOUNT PLUGIN ROUTES BEFORE BODY PARSER
// This ensures http-proxy-middleware receives the raw request stream
app.use(pluginRoutes_1.default);
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use(Sentry.Handlers.requestHandler());
app.use("/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default));
app.use("/public", express_1.default.static(upload_1.default.directory));
app.use((req, res, next) => {
    console.log(`[DEBUG] ${new Date().toISOString()} - ${req.method} ${req.url}`);
    logger_1.logger.info(`${req.method} ${req.url}`);
    next();
});
app.get("/test", (req, res) => {
    res.send("Backend is working!");
});
app.use(routes_1.default);
app.use(Sentry.Handlers.errorHandler());
app.use((err, req, res, _) => __awaiter(void 0, void 0, void 0, function* () {
    if (err instanceof AppError_1.default) {
        logger_1.logger.warn(err);
        return res.status(err.statusCode).json({ error: err.message });
    }
    logger_1.logger.error(err);
    return res.status(500).json({ error: "Internal server error" });
}));
exports.default = app;
