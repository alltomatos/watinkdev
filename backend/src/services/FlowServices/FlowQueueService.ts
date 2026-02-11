import { v4 as uuidv4 } from "uuid";
import RabbitMQService from "../RabbitMQService";
import { logger } from "../../utils/logger";

export interface FlowEventPayload {
  [key: string]: any;
}

class FlowQueueService {
  public async add(
    type: string,
    payload: FlowEventPayload,
    tenantId: number | string
  ): Promise<boolean> {
    try {
      const envelope = {
        id: uuidv4(),
        timestamp: Date.now(),
        type,
        tenantId,
        payload
      };

      const routingKey = `flow.execution.${type}`;
      const published = await RabbitMQService.publishCommand(routingKey, envelope);

      if (!published) {
        logger.warn(`Flow event NOT published (channel unavailable): ${routingKey}`);
        return false;
      }

      logger.info(`Flow event published: ${routingKey}`);
      return true;
    } catch (err) {
      logger.error(`Error publishing flow event: ${err}`);
      return false;
    }
  }
}

export default new FlowQueueService();
