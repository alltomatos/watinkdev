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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cors_1 = __importDefault(require("cors"));
const WebchatController = __importStar(require("../controllers/WebchatController"));
const webchatRoutes = (0, express_1.Router)();
// CORS permissivo para o webchat - permite requisições de qualquer origem
// Necessário porque o widget será embarcado em sites de terceiros
const webchatCors = (0, cors_1.default)({
    origin: (origin, callback) => {
        // Se houver origem (browser) e quisermos permitir credenciais, devemos refletir a origem.
        // Para o widget público (sem credenciais), * funcionaria, mas com credenciais (dashboard), precisamos refletir.
        if (origin) {
            callback(null, true); // Reflete a origem (Allow-Origin: <origin>)
        }
        else {
            callback(null, true); // Permite server-to-server ou sem origem
        }
    },
    credentials: true, // Permite cookies/headers de auth
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cache-Control"],
});
// Aplica CORS permissivo a todas as rotas do webchat
// Aplica CORS permissivo a todas as rotas do webchat
webchatRoutes.use("/webchat", webchatCors);
webchatRoutes.get("/webchat/:whatsappId", WebchatController.getConfig);
webchatRoutes.post("/webchat/:whatsappId/tickets", WebchatController.createTicket);
webchatRoutes.post("/webchat/:ticketId/messages", WebchatController.saveMessage);
webchatRoutes.get("/webchat/:ticketId/messages", WebchatController.listMessages);
exports.default = webchatRoutes;
