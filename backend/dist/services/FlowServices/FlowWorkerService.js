"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const RabbitMQService_1 = __importDefault(require("../RabbitMQService"));
const logger_1 = require("../../utils/logger");
const FlowRuntimeService_1 = __importDefault(require("./FlowRuntimeService"));
class FlowWorkerService {
    async start() {
        logger_1.logger.info("Starting FlowWorkerService...");
        const routingKeys = ["flow.tenant.*.execution.*"];
        await RabbitMQService_1.default.consumeCommands("flow.worker.queue", routingKeys, async (msg) => {
            await this.processMessage(msg);
        });
        logger_1.logger.info("FlowWorkerService started and listening on flow.tenant.*.execution.*");
    }
    async processMessage(msg) {
        const { type, payload, tenantId } = msg;
        try {
            switch (type) {
                case "whatsapp_message":
                    await FlowRuntimeService_1.default.processWhatsAppMessage(payload, tenantId);
                    break;
                case "tag_added":
                    await FlowRuntimeService_1.default.processTagAdded(payload, tenantId);
                    break;
                default:
                    logger_1.logger.warn(`FlowWorker ignored unknown message type: ${type}`);
            }
        }
        catch (err) {
            logger_1.logger.error(`Error processing flow message ${msg.id}: ${err}`);
        }
    }
}
exports.default = new FlowWorkerService();
