import * as client from "amqplib";
import { Connection, Channel, ConsumeMessage } from "amqplib";
import { logger } from "../utils/logger";
import { Envelope } from "../microservice/contracts";
import context from "../libs/context";

class RabbitMQService {
  private connection: any = null;
  private channel: Channel | null = null;
  private url: string;

  constructor() {
    this.url = process.env.AMQP_URL || "amqp://guest:guest@localhost:5672";
  }

  async connect(): Promise<void> {
    try {
      this.connection = await client.connect(this.url) as any;

      this.connection.on("error", (err: any) => {
        logger.error("RabbitMQ Connection Error", err);
        setTimeout(() => this.connect(), 5000);
      });

      this.connection.on("close", () => {
        logger.warn("RabbitMQ Connection Closed");
        setTimeout(() => this.connect(), 5000);
      });

      this.channel = await this.connection!.createChannel();
      logger.info("Connected to RabbitMQ");

      await this.setupExchanges();
    } catch (error) {
      logger.error("Failed to connect to RabbitMQ", error);
      setTimeout(() => this.connect(), 5000);
    }
  }

  private isValidEnvelope(raw: any): raw is Envelope {
    return !!raw
      && typeof raw === "object"
      && typeof raw.id === "string"
      && typeof raw.type === "string"
      && typeof raw.timestamp === "number"
      && (typeof raw.tenantId === "string" || typeof raw.tenantId === "number")
      && Object.prototype.hasOwnProperty.call(raw, "payload");
  }

  private validateEnvelopeOrThrow(raw: any): Envelope {
    if (!this.isValidEnvelope(raw)) {
      throw new Error("Invalid AMQP envelope contract");
    }
    return raw as Envelope;
  }

  private async setupExchanges(): Promise<void> {
    if (!this.channel) return;

    await this.channel.assertExchange("wbot.commands", "topic", { durable: true });
    await this.channel.assertExchange("wbot.events", "topic", { durable: true });

    // Setup Engine Queues (Legacy shared queues for backward compatibility during transition)
    // In "Total Isolation" mode, these would be per-tenant, but for now we fix the bindings
    const standardQueue = await this.channel.assertQueue("wbot_standard_commands", { durable: true });
    await this.channel.bindQueue(standardQueue.queue, "wbot.commands", "wbot.tenant.*.whaileys.#");

    const goQueue = await this.channel.assertQueue("wbot_go_commands", { durable: true });
    await this.channel.bindQueue(goQueue.queue, "wbot.commands", "wbot.tenant.*.whatsmeow.#");
    
    // PAPI Engine
    const papiQueue = await this.channel.assertQueue("wbot_papi_commands", { durable: true });
    await this.channel.bindQueue(papiQueue.queue, "wbot.commands", "wbot.tenant.*.papi.#");
  }

  /**
   * Generates a restrictive routing key following the multi-tenancy contract.
   * Format: wbot.tenant.{tenantId}.{engine}.{sessionId}.{type}
   */
  public generateRoutingKey(tenantId: string | number, engine: string, sessionId: string | number, type: string): string {
    if (!tenantId) throw new Error("tenantId is mandatory for routing keys");
    return `wbot.tenant.${tenantId}.${engine}.${sessionId}.${type}`;
  }

  async publishCommand(routingKey: string, message: Envelope, exchange: string = "wbot.commands"): Promise<boolean> {
    if (!this.channel) {
      logger.warn("Cannot publish command, channel is closed");
      return false;
    }

    logger.info(`[RabbitMQ] Publishing command to ${routingKey} on exchange ${exchange}`);
    return this.channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(message))
    );
  }

  async publishEvent(routingKey: string, message: Envelope): Promise<void> {
    if (!this.channel) {
      logger.warn("Cannot publish event, channel is closed");
      return;
    }

    logger.info(`[RabbitMQ] Publishing event to ${routingKey}`);
    this.channel.publish(
      "wbot.events",
      routingKey,
      Buffer.from(JSON.stringify(message))
    );
  }

  async consumeEvents(queueName: string, routingKeys: string[], handler: (msg: Envelope) => Promise<void>, authorizedTenantId?: string | number): Promise<void> {
    if (!this.channel) return;

    const q = await this.channel.assertQueue(queueName, { durable: true });

    for (const key of routingKeys) {
      await this.channel.bindQueue(q.queue, "wbot.events", key);
    }

    this.channel.consume(q.queue, async (msg: ConsumeMessage | null) => {
      if (msg) {
        try {
          const raw = JSON.parse(msg.content.toString());
          const content = this.validateEnvelopeOrThrow(raw);

          // Security Check: Total Isolation
          if (authorizedTenantId && String(content.tenantId) !== String(authorizedTenantId)) {
            logger.error(`[Security] Worker authorized for tenant ${authorizedTenantId} received message for tenant ${content.tenantId}. Ignoring.`);
            this.channel?.ack(msg);
            return;
          }

          // Fix Context Propagation
          await context.run({ tenantId: String(content.tenantId) }, async () => {
            await handler(content);
          });
          
          this.channel?.ack(msg);
        } catch (error) {
          logger.error(`Error processing event: ${(error as Error).message}\n${(error as Error).stack}`);
          this.channel?.nack(msg, false, false);
        }
      }
    });
  }

  async consumeCommands(queueName: string, routingKeys: string[], handler: (msg: Envelope) => Promise<void>, authorizedTenantId?: string | number): Promise<void> {
    if (!this.channel) return;

    const q = await this.channel.assertQueue(queueName, { durable: true });

    for (const key of routingKeys) {
      await this.channel.bindQueue(q.queue, "wbot.commands", key);
    }

    this.channel.consume(q.queue, async (msg: ConsumeMessage | null) => {
      if (msg) {
        try {
          const raw = JSON.parse(msg.content.toString());
          const content = this.validateEnvelopeOrThrow(raw);

          // Security Check: Total Isolation
          if (authorizedTenantId && String(content.tenantId) !== String(authorizedTenantId)) {
            logger.error(`[Security] Command worker authorized for tenant ${authorizedTenantId} received message for tenant ${content.tenantId}. Ignoring.`);
            this.channel?.ack(msg);
            return;
          }

          // Fix Context Propagation
          await context.run({ tenantId: String(content.tenantId) }, async () => {
             await handler(content);
          });

          this.channel?.ack(msg);
        } catch (error) {
          logger.error("Error processing command", error);
          this.channel?.nack(msg, false, false);
        }
      }
    });
  }

  async consumeQueue(queueName: string, handler: (msg: any) => Promise<void>): Promise<void> {
    if (!this.channel) return;

    await this.channel.assertQueue(queueName, { durable: true });

    this.channel.consume(queueName, async (msg: ConsumeMessage | null) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          await handler(content);
          this.channel?.ack(msg);
        } catch (error) {
          logger.error(`Error processing queue message: ${(error as Error).message}`);
          this.channel?.nack(msg, false, false);
        }
      }
    });
  }
}

export default new RabbitMQService();
