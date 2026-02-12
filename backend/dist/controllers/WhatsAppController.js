"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testPapiConnection = exports.remove = exports.update = exports.show = exports.store = exports.index = void 0;
const socket_1 = require("../libs/socket");
const AppError_1 = __importDefault(require("../errors/AppError"));
const CreateWhatsAppService_1 = __importDefault(require("../services/WhatsappService/CreateWhatsAppService"));
const DeleteWhatsAppService_1 = __importDefault(require("../services/WhatsappService/DeleteWhatsAppService"));
const ListWhatsAppsService_1 = __importDefault(require("../services/WhatsappService/ListWhatsAppsService"));
const ShowWhatsAppService_1 = __importDefault(require("../services/WhatsappService/ShowWhatsAppService"));
const UpdateWhatsAppService_1 = __importDefault(require("../services/WhatsappService/UpdateWhatsAppService"));
const Plugin_1 = __importDefault(require("../models/Plugin"));
const axios_1 = __importDefault(require("axios"));
const PluginInstallation_1 = __importDefault(require("../models/PluginInstallation"));
const index = async (req, res) => {
    const { tenantId } = req.user;
    const whatsapps = await (0, ListWhatsAppsService_1.default)(tenantId);
    return res.status(200).json(whatsapps);
};
exports.index = index;
const store = async (req, res) => {
    const { name, status, isDefault, greetingMessage, farewellMessage, queueIds, syncHistory, syncPeriod, keepAlive, type, chatConfig, tags, engineType, importOldMessages } = req.body;
    const { tenantId } = req.user;
    if (type === "webchat") {
        const plugin = await Plugin_1.default.findOne({ where: { slug: "webchat" } });
        if (plugin) {
            const installation = await PluginInstallation_1.default.findOne({
                where: {
                    pluginId: plugin.id,
                    tenantId,
                    status: "active"
                }
            });
            if (!installation) {
                throw new AppError_1.default("Webchat plugin is not active for this tenant.");
            }
        }
    }
    if (engineType === "whatsmeow") {
        const plugin = await Plugin_1.default.findOne({ where: { slug: "whatsmeow" } });
        if (plugin) {
            const installation = await PluginInstallation_1.default.findOne({
                where: {
                    pluginId: plugin.id,
                    tenantId,
                    status: "active"
                }
            });
            if (!installation) {
                throw new AppError_1.default("WhatsMeow plugin is not active for this tenant.");
            }
        }
    }
    if (engineType === "papi") {
        const plugin = await Plugin_1.default.findOne({ where: { slug: "engine-papi" } });
        if (plugin) {
            const installation = await PluginInstallation_1.default.findOne({
                where: {
                    pluginId: plugin.id,
                    tenantId,
                    status: "active"
                }
            });
            if (!installation) {
                throw new AppError_1.default("Engine PAPI plugin is not active for this tenant.");
            }
        }
    }
    const { whatsapp, oldDefaultWhatsapp } = await (0, CreateWhatsAppService_1.default)({
        name,
        status,
        isDefault,
        greetingMessage,
        farewellMessage,
        queueIds,
        syncHistory,
        syncPeriod,
        keepAlive,
        tenantId,
        type,
        chatConfig,
        tags,
        engineType,
        importOldMessages
    });
    // StartWhatsAppSession(whatsapp); // [REMOVED] Manual connect only
    const io = (0, socket_1.getIO)();
    io.emit("whatsapp", {
        action: "update",
        whatsapp
    });
    if (oldDefaultWhatsapp) {
        io.emit("whatsapp", {
            action: "update",
            whatsapp: oldDefaultWhatsapp
        });
    }
    return res.status(200).json(whatsapp);
};
exports.store = store;
const show = async (req, res) => {
    const { whatsappId } = req.params;
    const whatsapp = await (0, ShowWhatsAppService_1.default)(whatsappId);
    return res.status(200).json(whatsapp);
};
exports.show = show;
const update = async (req, res) => {
    const { whatsappId } = req.params;
    const whatsappData = req.body;
    const { tenantId } = req.user;
    if (whatsappData.type === "webchat") {
        const plugin = await Plugin_1.default.findOne({ where: { slug: "webchat" } });
        if (plugin) {
            const installation = await PluginInstallation_1.default.findOne({
                where: {
                    pluginId: plugin.id,
                    tenantId,
                    status: "active"
                }
            });
            if (!installation) {
                throw new AppError_1.default("Webchat plugin is not active for this tenant.");
            }
        }
    }
    const { whatsapp, oldDefaultWhatsapp } = await (0, UpdateWhatsAppService_1.default)({
        whatsappData,
        whatsappId
    });
    const io = (0, socket_1.getIO)();
    io.emit("whatsapp", {
        action: "update",
        whatsapp
    });
    if (oldDefaultWhatsapp) {
        io.emit("whatsapp", {
            action: "update",
            whatsapp: oldDefaultWhatsapp
        });
    }
    return res.status(200).json(whatsapp);
};
exports.update = update;
const remove = async (req, res) => {
    const { whatsappId } = req.params;
    await (0, DeleteWhatsAppService_1.default)(whatsappId);
    const io = (0, socket_1.getIO)();
    io.emit("whatsapp", {
        action: "delete",
        whatsappId: +whatsappId
    });
    return res.status(200).json({ message: "Whatsapp deleted." });
};
exports.remove = remove;
const testPapiConnection = async (req, res) => {
    const { papiUrl, papiKey } = req.body;
    try {
        // PAPI usually has a status endpoint or just listing instances
        await axios_1.default.get(`${papiUrl}/api/instances`, {
            headers: {
                "x-api-key": papiKey
            },
            timeout: 5000
        });
        return res.status(200).json({ message: "Connection successful" });
    }
    catch (err) {
        return res.status(400).json({ error: "Connection failed", details: err.message });
    }
};
exports.testPapiConnection = testPapiConnection;
