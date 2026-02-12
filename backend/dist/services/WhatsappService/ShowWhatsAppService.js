"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Whatsapp_1 = __importDefault(require("../../models/Whatsapp"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const Queue_1 = __importDefault(require("../../models/Queue"));
const Tag_1 = __importDefault(require("../../models/Tag"));
const Message_1 = __importDefault(require("../../models/Message"));
const Ticket_1 = __importDefault(require("../../models/Ticket"));
const ShowWhatsAppService = async (id) => {
    const whatsapp = await Whatsapp_1.default.findByPk(id, {
        include: [
            {
                model: Queue_1.default,
                as: "queues",
                attributes: ["id", "name", "color", "greetingMessage"]
            },
            {
                model: Tag_1.default,
                as: "tags",
                attributes: ["id", "name", "color"]
            }
        ],
        order: [["queues", "name", "ASC"]]
    });
    if (!whatsapp) {
        throw new AppError_1.default("ERR_NO_WAPP_FOUND", 404);
    }
    // Calculate message counts
    // We need to join with Tickets to filter by whatsappId
    const sentCount = await Message_1.default.count({
        include: [{
                model: Ticket_1.default,
                where: { whatsappId: id },
                attributes: []
            }],
        where: { fromMe: true }
    });
    const receivedCount = await Message_1.default.count({
        include: [{
                model: Ticket_1.default,
                where: { whatsappId: id },
                attributes: []
            }],
        where: { fromMe: false }
    });
    // Convert to JSON and append counts
    const whatsappData = whatsapp.toJSON();
    whatsappData.messagesSent = sentCount;
    whatsappData.messagesReceived = receivedCount;
    return whatsappData;
};
exports.default = ShowWhatsAppService;
