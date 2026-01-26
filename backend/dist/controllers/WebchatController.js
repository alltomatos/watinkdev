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
exports.saveMessage = exports.listMessages = exports.createTicket = exports.getConfig = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const Whatsapp_1 = __importDefault(require("../models/Whatsapp"));
const Contact_1 = __importDefault(require("../models/Contact"));
const FindOrCreateTicketService_1 = __importDefault(require("../services/TicketServices/FindOrCreateTicketService"));
const ShowTicketService_1 = __importDefault(require("../services/TicketServices/ShowTicketService"));
const CreateMessageService_1 = __importDefault(require("../services/MessageServices/CreateMessageService"));
const RabbitMQService_1 = __importDefault(require("../services/RabbitMQService"));
const verifyAuthorizedDomain = (req, chatConfig) => {
    if (!chatConfig || !chatConfig.authorizedDomains)
        return true;
    const authorizedDomains = chatConfig.authorizedDomains
        .split(",")
        .map((d) => d.trim().toLowerCase())
        .filter((d) => d.length > 0);
    if (authorizedDomains.length === 0)
        return true; // Empty list allows all
    const origin = req.headers.origin || req.headers.referer;
    if (!origin)
        return false; // Block completely unknown origins if restrictions are set
    // Simple check: does origin contain one of the allowed domains?
    // Using includes to allow subdomains/protocols matching logic flexibility
    return authorizedDomains.some((domain) => origin.toLowerCase().includes(domain));
};
const getConfig = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { whatsappId } = req.params;
    const whatsapp = yield Whatsapp_1.default.findByPk(whatsappId);
    if (!whatsapp || whatsapp.type !== "webchat") {
        return res.status(404).json({ error: "Webchat not found" });
    }
    // Security: Origin Validation
    if (!verifyAuthorizedDomain(req, whatsapp.chatConfig)) {
        return res.status(403).json({ error: "Forbidden: Unauthorized Origin" });
    }
    return res.json({
        name: whatsapp.name,
        greetingMessage: whatsapp.greetingMessage,
        farewellMessage: whatsapp.farewellMessage,
        chatConfig: whatsapp.chatConfig
    });
});
exports.getConfig = getConfig;
const createTicket = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { whatsappId } = req.params;
    const { name, email, phone, message } = req.body;
    const whatsapp = yield Whatsapp_1.default.findByPk(whatsappId);
    if (!whatsapp || whatsapp.type !== "webchat") {
        return res.status(404).json({ error: "Webchat not found" });
    }
    // Security: Origin Validation
    if (!verifyAuthorizedDomain(req, whatsapp.chatConfig)) {
        return res.status(403).json({ error: "Forbidden: Unauthorized Origin" });
    }
    // Find or Create Contact
    let contact = null;
    if (email || phone) {
        const orConditions = [];
        if (email)
            orConditions.push({ email });
        if (phone)
            orConditions.push({ number: phone });
        if (orConditions.length > 0) {
            contact = yield Contact_1.default.findOne({
                where: {
                    tenantId: whatsapp.tenantId,
                    [sequelize_1.Op.or]: orConditions
                }
            });
        }
    }
    if (contact) {
        // Update contact info if provided
        const updateData = {};
        if (name && contact.name !== name) {
            updateData.name = name;
        }
        if (phone && contact.number !== phone && contact.number.includes("webchat-")) {
            updateData.number = phone;
        }
        if (email && contact.email !== email) {
            updateData.email = email;
        }
        if (Object.keys(updateData).length > 0) {
            yield contact.update(updateData);
        }
    }
    if (!contact) {
        const number = phone || `webchat-${Date.now()}`;
        const contactName = name || number;
        contact = yield Contact_1.default.create({
            name: contactName,
            number,
            email: email || "",
            tenantId: whatsapp.tenantId,
            isGroup: false,
            profilePicUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(contactName)}&background=25D366&color=fff`
        });
    }
    // Find or Create Ticket
    const ticket = yield (0, FindOrCreateTicketService_1.default)(contact, whatsapp.id, 1, // unreadMessages
    whatsapp.tenantId);
    // Update Ticket status to open if needed
    if (ticket.status === "closed") {
        yield ticket.update({ status: "pending" });
    }
    // Send initial message directly via Service to ensure persistence and socket emit
    let messageId = null;
    if (message) {
        messageId = (0, uuid_1.v4)();
        const messageData = {
            id: messageId,
            ticketId: ticket.id,
            contactId: contact.id,
            body: message,
            fromMe: false,
            read: true,
            mediaType: "chat",
            sendType: "chat",
            status: "received",
            timestamp: Date.now(),
            createdAt: new Date(),
            tenantId: whatsapp.tenantId
        };
        yield (0, CreateMessageService_1.default)({ messageData });
    }
    return res.json({ ticketId: ticket.id, contactId: contact.id, messageId });
});
exports.createTicket = createTicket;
const ListMessagesService_1 = __importDefault(require("../services/MessageServices/ListMessagesService"));
const listMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { ticketId } = req.params;
    const { contactId, pageNumber } = req.query;
    const ticket = yield (0, ShowTicketService_1.default)(ticketId);
    if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
    }
    // Security check: ensure ticket belongs to the contact claiming it
    if (ticket.contactId !== Number(contactId)) {
        return res.status(403).json({ error: "Unauthorized" });
    }
    const { count, messages, hasMore } = yield (0, ListMessagesService_1.default)({
        pageNumber,
        ticketId
    });
    return res.json({ count, messages, hasMore });
});
exports.listMessages = listMessages;
const saveMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { ticketId } = req.params;
    const { body } = req.body;
    const ticket = yield (0, ShowTicketService_1.default)(ticketId);
    if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
    }
    const whatsapp = yield Whatsapp_1.default.findByPk(ticket.whatsappId);
    if (!whatsapp) {
        return res.status(404).json({ error: "Whatsapp not found" });
    }
    // ShowTicketService returns ticket with contact included
    const contact = ticket.contact;
    const messageId = (0, uuid_1.v4)();
    const payload = {
        sessionId: whatsapp.id,
        message: {
            id: messageId,
            from: contact.number,
            to: whatsapp.number || "",
            body: body,
            fromMe: false,
            isGroup: false,
            type: "chat",
            timestamp: Date.now() / 1000,
            hasMedia: false,
            participant: contact.number,
            profilePicUrl: contact.profilePicUrl,
            pushName: contact.name,
        }
    };
    const envelope = {
        id: (0, uuid_1.v4)(),
        timestamp: Date.now(),
        tenantId: whatsapp.tenantId,
        type: "message.received",
        payload
    };
    yield RabbitMQService_1.default.publishEvent(`wbot.${whatsapp.tenantId}.${whatsapp.id}.message.received`, envelope);
    return res.json({ messageId });
});
exports.saveMessage = saveMessage;
