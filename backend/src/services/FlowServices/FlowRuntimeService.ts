import FlowSession from "../../models/FlowSession";
import { logger } from "../../utils/logger";
import FlowTriggerService from "./FlowTriggerService";
import FlowExecutorService from "./FlowExecutorService";

export interface WhatsAppFlowEvent {
  ticketId: number;
  contactId: number;
  messageBody: string;
  fromMe: boolean;
  isGroup?: boolean;
}

export interface TagAddedFlowEvent {
  tagId: number;
  entityId: number;
  entityType: "contact" | "ticket" | "deal";
}

class FlowRuntimeService {
  public async processWhatsAppMessage(data: WhatsAppFlowEvent, tenantId: number | string): Promise<void> {
    const { ticketId, contactId, messageBody, fromMe } = data;

    if (fromMe || !ticketId) return;

    const activeSession = await FlowSession.findOne({
      where: {
        entityId: ticketId,
        entityType: "ticket",
        status: "active"
      }
    });

    if (activeSession) {
      logger.info(`[FlowRuntime] Found active session ${activeSession.id} for ticket ${ticketId}`);
      await FlowExecutorService.next(activeSession.id, messageBody);
      return;
    }

    const trigger = await FlowTriggerService.findTrigger(
      "whatsapp_message",
      { body: messageBody },
      tenantId
    );

    if (!trigger) return;

    logger.info(`[FlowRuntime] Trigger matched! Starting Flow ${trigger.flowId}`);
    await FlowExecutorService.start(trigger.flowId, {
      ticketId,
      contactId,
      messageBody
    });
  }

  public async processTagAdded(data: TagAddedFlowEvent, tenantId: number | string): Promise<void> {
    const { tagId, entityId, entityType } = data;

    const trigger = await FlowTriggerService.findTrigger(
      "tagAdded",
      { tagId },
      tenantId
    );

    if (!trigger) return;

    const context: any = {
      tagId,
      entityId,
      entityType
    };

    if (entityType === "ticket") {
      context.ticketId = entityId;
    } else if (entityType === "contact") {
      context.contactId = entityId;
    }

    await FlowExecutorService.start(trigger.flowId, context);
    logger.info(`[FlowRuntime] Flow ${trigger.flowId} started by tagAdded on ${entityType} ${entityId}`);
  }
}

export default new FlowRuntimeService();
