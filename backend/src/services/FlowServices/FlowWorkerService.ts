import { Envelope } from "../../microservice/contracts";
import RabbitMQService from "../RabbitMQService";
import { logger } from "../../utils/logger";
import FlowRuntimeService, { TagAddedFlowEvent, WhatsAppFlowEvent } from "./FlowRuntimeService";

class FlowWorkerService {
  public async start() {
    logger.info("Starting FlowWorkerService...");

    const routingKeys = ["flow.execution.*"];

    await RabbitMQService.consumeCommands("flow.worker.queue", routingKeys, async (msg: Envelope) => {
      await this.processMessage(msg);
    });

    logger.info("FlowWorkerService started and listening on flow.execution.*");
  }

  private async processMessage(msg: Envelope) {
    const { type, payload, tenantId } = msg;

    try {
      switch (type) {
        case "whatsapp_message":
          await FlowRuntimeService.processWhatsAppMessage(payload as WhatsAppFlowEvent, tenantId);
          break;
        case "tag_added":
          await FlowRuntimeService.processTagAdded(payload as TagAddedFlowEvent, tenantId);
          break;
        default:
          logger.warn(`FlowWorker ignored unknown message type: ${type}`);
      }
    } catch (err) {
      logger.error(`Error processing flow message ${msg.id}: ${err}`);
    }
  }
}

export default new FlowWorkerService();
