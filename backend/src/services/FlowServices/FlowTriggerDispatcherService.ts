import FlowQueueService from "./FlowQueueService";
import FlowRuntimeService, { TagAddedFlowEvent, WhatsAppFlowEvent } from "./FlowRuntimeService";
import { logger } from "../../utils/logger";

const isTruthy = (value?: string): boolean => {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};

class FlowTriggerDispatcherService {
  private shouldUseQueue(): boolean {
    return isTruthy(process.env.FLOW_TRIGGER_QUEUE_ENABLED);
  }

  public async dispatchWhatsAppMessage(payload: WhatsAppFlowEvent, tenantId: number | string): Promise<void> {
    if (this.shouldUseQueue()) {
      const queued = await FlowQueueService.add("whatsapp_message", payload, tenantId);
      if (queued) return;

      logger.warn("[FlowTriggerDispatcher] Queue publish failed for whatsapp_message. Falling back to direct execution.");
    }

    await FlowRuntimeService.processWhatsAppMessage(payload, tenantId);
  }

  public async dispatchTagAdded(payload: TagAddedFlowEvent, tenantId: number | string): Promise<void> {
    if (this.shouldUseQueue()) {
      const queued = await FlowQueueService.add("tag_added", payload, tenantId);
      if (queued) return;

      logger.warn("[FlowTriggerDispatcher] Queue publish failed for tag_added. Falling back to direct execution.");
    }

    await FlowRuntimeService.processTagAdded(payload, tenantId);
  }
}

export default new FlowTriggerDispatcherService();
