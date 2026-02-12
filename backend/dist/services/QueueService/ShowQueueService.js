"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AppError_1 = __importDefault(require("../../errors/AppError"));
const Queue_1 = __importDefault(require("../../models/Queue"));
const Whatsapp_1 = __importDefault(require("../../models/Whatsapp"));
const ShowQueueService = async (queueId) => {
    const queue = await Queue_1.default.findByPk(queueId, {
        include: [
            {
                model: Whatsapp_1.default,
                as: "whatsapps",
                attributes: ["id", "name"]
            }
        ]
    });
    if (!queue) {
        throw new AppError_1.default("ERR_QUEUE_NOT_FOUND");
    }
    return queue;
};
exports.default = ShowQueueService;
