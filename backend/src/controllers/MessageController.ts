import { Request, Response } from "express";

import SetTicketMessagesAsRead from "../helpers/SetTicketMessagesAsRead";
import { getIO } from "../libs/socket";
import Message from "../models/Message";

import ListMessagesService from "../services/MessageServices/ListMessagesService";
import UpdateMessageReactionService from "../services/MessageServices/UpdateMessageReactionService";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import DeleteWhatsAppMessage from "../services/WbotServices/DeleteWhatsAppMessage";
import SendWhatsAppMedia from "../services/WbotServices/SendWhatsAppMedia";
import SendWhatsAppMessage from "../services/WbotServices/SendWhatsAppMessage";
import SendWhatsAppInteractive from "../services/WbotServices/SendWhatsAppInteractive";
import SendWhatsAppCarousel from "../services/WbotServices/SendWhatsAppCarousel";
import ShowQuickAnswerService from "../services/QuickAnswerService/ShowQuickAnswerService";
import AppError from "../errors/AppError";

type IndexQuery = {
  pageNumber: string;
};

type MessageData = {
  body: string;
  fromMe: boolean;
  read: boolean;
  quotedMsg?: Message;
};

type UpdateReactionData = {
  emoji?: string | null;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { pageNumber } = req.query as IndexQuery;

  const { count, messages, ticket, hasMore } = await ListMessagesService({
    pageNumber,
    ticketId
  });

  SetTicketMessagesAsRead(ticket);

  return res.json({ count, messages, ticket, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { body, quotedMsg, mentionedIds }: MessageData & { mentionedIds?: string[] } = req.body;
  const medias = req.files as Express.Multer.File[];
  const { logger } = require("../utils/logger");
  logger.info(`[MessageController] Store requested for ticket ${ticketId}. Body: ${body}`);

  const ticket = await ShowTicketService(ticketId);

  SetTicketMessagesAsRead(ticket);

  if (medias && medias.length > 0) {
    // req.body.body can be a string or an array of strings (if multiple bodies sent)
    // Multer/Express handles 'body' field. If multiple fields with same name 'body', it becomes an array.
    // If we appended 'body' for each media in the same order, we expect an array (or string if just 1).
    const bodies = Array.isArray(body) ? body : [body];

    await Promise.all(
      medias.map(async (media: Express.Multer.File, index: number) => {
        const caption = bodies[index] !== undefined ? bodies[index] : (bodies[0] || "");
        await SendWhatsAppMedia({ media, ticket, body: caption, mentionedIds });
      })
    );
  } else {
    await SendWhatsAppMessage({ body, ticket, quotedMsg, mentionedIds });
  }

  return res.send();
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { messageId } = req.params;

  const message = await DeleteWhatsAppMessage(messageId);

  const io = getIO();
  io.to(message.ticketId.toString()).emit("appMessage", {
    action: "update",
    message
  });

  return res.send();
};

export const sendQuickAnswer = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId, quickAnswerId } = req.params;
  const { tenantId } = req.user;
  const { logger } = require("../utils/logger");

  const ticket = await ShowTicketService(ticketId, tenantId);
  if (ticket.status !== "open") {
    throw new AppError("ERR_TICKET_CLOSED", 400);
  }
  if (!ticket.whatsappId) {
    throw new AppError("ERR_TICKET_WRONG_WHATSAPP_ID", 400);
  }

  const quickAnswer = await ShowQuickAnswerService(quickAnswerId, tenantId);
  const qaType = quickAnswer.mediaType || "text";
  let parsedPayload: any = null;
  try {
    parsedPayload = quickAnswer.dataJson ? JSON.parse(quickAnswer.dataJson) : null;
  } catch (error) {
    logger.warn(`[MessageController] Invalid quick answer dataJson quickAnswerId=${quickAnswer.id}`);
  }

  logger.info(`[MessageController] sendQuickAnswer quickAnswerId=${quickAnswer.id} ticketId=${ticket.id} type=${qaType}`);

  if (qaType === "text") {
    await SendWhatsAppMessage({ body: quickAnswer.message, ticket });
    return res.status(200).json({ ok: true, type: qaType });
  }

  if (qaType === "buttons" || qaType === "list") {
    await SendWhatsAppInteractive({
      body: quickAnswer.message,
      ticket,
      buttons: qaType === "buttons" ? parsedPayload?.buttons : undefined,
      list: qaType === "list" ? parsedPayload?.list : undefined
    });
    return res.status(200).json({ ok: true, type: qaType });
  }

  if (qaType === "carousel") {
    await SendWhatsAppCarousel({
      ticket,
      body: quickAnswer.message,
      cards: parsedPayload?.cards || []
    });
    return res.status(200).json({ ok: true, type: qaType });
  }

  logger.warn(`[MessageController] Invalid quick answer type fallback to text quickAnswerId=${quickAnswer.id}`);
  await SendWhatsAppMessage({ body: quickAnswer.message, ticket });
  return res.status(200).json({ ok: true, type: "text-fallback" });
};

export const upsertReaction = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { messageId } = req.params;
  const { emoji }: UpdateReactionData = req.body;
  const { id: userId, tenantId } = req.user;

  const message = await UpdateMessageReactionService({
    messageId,
    userId,
    tenantId,
    emoji
  });

  const io = getIO();
  io.to(message.ticketId.toString()).emit("appMessage", {
    action: "update",
    message
  });

  return res.status(200).json(message);
};
