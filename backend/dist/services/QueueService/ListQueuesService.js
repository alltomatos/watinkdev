"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Queue_1 = __importDefault(require("../../models/Queue"));
const Whatsapp_1 = __importDefault(require("../../models/Whatsapp"));
const ListQueuesService = async () => {
    const queues = await Queue_1.default.findAll({
        order: [["name", "ASC"]],
        include: [
            {
                model: Whatsapp_1.default,
                as: "whatsapps",
                attributes: ["id", "name"]
            }
        ]
    });
    return queues;
};
exports.default = ListQueuesService;
