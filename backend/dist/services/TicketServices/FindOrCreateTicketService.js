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
const date_fns_1 = require("date-fns");
const sequelize_1 = require("sequelize");
const Ticket_1 = __importDefault(require("../../models/Ticket"));
const Queue_1 = __importStar(require("../../models/Queue"));
const ShowTicketService_1 = __importDefault(require("./ShowTicketService"));
const TicketDistributionService_1 = __importDefault(require("./TicketDistributionService"));
const socket_1 = require("../../libs/socket");
const logger_1 = require("../../utils/logger");
const FindOrCreateTicketService = async (contact, whatsappId, unreadMessages, tenantId, groupContact, queueId) => {
    // Buscar ticket aberto ou pendente existente
    let ticket = await Ticket_1.default.findOne({
        where: {
            status: {
                [sequelize_1.Op.or]: ["open", "pending"]
            },
            tenantId,
            contactId: groupContact ? groupContact.id : contact.id,
            whatsappId: whatsappId
        }
    });
    if (ticket) {
        await ticket.update({ unreadMessages });
        return await (0, ShowTicketService_1.default)(ticket.id);
    }
    // Lógica removida: Mensagens antigas agora são tratadas no EventListener
    // e não criam tickets - apenas salvam no histórico se ticket existir
    // Para grupos: reabrir como 'open' (grupos sempre prontos para resposta)
    if (!ticket && groupContact) {
        ticket = await Ticket_1.default.findOne({
            where: {
                contactId: groupContact.id,
                whatsappId: whatsappId,
                tenantId
            },
            order: [["updatedAt", "DESC"]]
        });
        if (ticket) {
            await ticket.update({
                status: "open", // Grupos sempre abertos
                unreadMessages
            });
        }
    }
    if (!ticket && !groupContact) {
        ticket = await Ticket_1.default.findOne({
            where: {
                updatedAt: {
                    [sequelize_1.Op.between]: [+(0, date_fns_1.subHours)(new Date(), 2), +new Date()]
                },
                contactId: contact.id,
                whatsappId: whatsappId,
                tenantId
            },
            order: [["updatedAt", "DESC"]]
        });
        if (ticket) {
            await ticket.update({
                status: "pending",
                userId: null,
                unreadMessages
            });
        }
    }
    let isNewTicket = false;
    if (!ticket) {
        // Grupos: criar como 'open' (sempre prontos para resposta)
        // Individuais: criar como 'pending' (aguardando aceite ou distribuição)
        const ticketStatus = groupContact ? "open" : "pending";
        ticket = await Ticket_1.default.create({
            contactId: groupContact ? groupContact.id : contact.id,
            status: ticketStatus,
            isGroup: !!groupContact,
            unreadMessages,
            whatsappId,
            tenantId,
            queueId
        });
        isNewTicket = true;
    }
    // Auto-distribute new tickets (only for individual chats, not groups)
    if (isNewTicket && !groupContact && queueId) {
        try {
            const queue = await Queue_1.default.findByPk(queueId);
            if (queue && queue.distributionStrategy !== Queue_1.DISTRIBUTION_STRATEGIES.MANUAL) {
                const result = await TicketDistributionService_1.default.distributeTicket(ticket, queue);
                if (result.user) {
                    await ticket.update({
                        userId: result.user.id,
                        status: "open"
                    });
                    logger_1.logger.info(`[FindOrCreateTicket] Auto-distributed ticket ${ticket.id} - ${result.reason}`);
                    // Emit socket event for real-time update
                    const io = (0, socket_1.getIO)();
                    io.to("notification").emit("ticket", {
                        action: "update",
                        ticket: await (0, ShowTicketService_1.default)(ticket.id)
                    });
                }
            }
        }
        catch (error) {
            logger_1.logger.error(`[FindOrCreateTicket] Distribution failed for ticket ${ticket.id}:`, error);
            // Continue without distribution - ticket stays pending
        }
    }
    ticket = await (0, ShowTicketService_1.default)(ticket.id);
    return ticket;
};
exports.default = FindOrCreateTicketService;
