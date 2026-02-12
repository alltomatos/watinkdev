"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const RabbitMQService_1 = __importDefault(require("../RabbitMQService"));
const logger_1 = require("../../utils/logger");
class FlowQueueService {
    async add(type, payload, tenantId) {
        try {
            const envelope = {
                id: (0, uuid_1.v4)(),
                timestamp: Date.now(),
                type,
                tenantId,
                payload
            };
            const routingKey = `flow.tenant.${tenantId}.execution.${type}`;
            const published = await RabbitMQService_1.default.publishCommand(routingKey, envelope);
            if (!published) {
                logger_1.logger.warn(`Flow event NOT published (channel unavailable): ${routingKey}`);
                return false;
            }
            logger_1.logger.info(`Flow event published: ${routingKey}`);
            return true;
        }
        catch (err) {
            logger_1.logger.error(`Error publishing flow event: ${err}`);
            return false;
        }
    }
}
exports.default = new FlowQueueService();
