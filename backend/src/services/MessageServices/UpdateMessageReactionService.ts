import AppError from "../../errors/AppError";
import Message from "../../models/Message";

interface Request {
  messageId: string;
  userId: string;
  tenantId: string;
  emoji?: string | null;
}

const ALLOWED_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const UpdateMessageReactionService = async ({
  messageId,
  userId,
  tenantId,
  emoji
}: Request): Promise<Message> => {
  const message = await Message.findOne({
    where: {
      id: messageId,
      tenantId
    }
  });

  if (!message) {
    throw new AppError("ERR_NO_MESSAGE_FOUND", 404);
  }

  if (message.isDeleted) {
    throw new AppError("ERR_MESSAGE_DELETED", 400);
  }

  const normalizedEmoji = typeof emoji === "string" ? emoji.trim() : "";
  if (normalizedEmoji && !ALLOWED_REACTIONS.includes(normalizedEmoji)) {
    throw new AppError("ERR_INVALID_REACTION", 400);
  }

  const existingReactions = Array.isArray(message.reactions)
    ? ([...message.reactions] as any[])
    : [];

  const filtered = existingReactions.filter((reaction: any) => {
    if (!reaction) return false;
    const reactionUserId = reaction.userId != null ? String(reaction.userId) : null;
    return reactionUserId !== String(userId);
  });

  if (normalizedEmoji) {
    filtered.push({
      userId: String(userId),
      text: normalizedEmoji,
      fromMe: true,
      createdAt: new Date().toISOString()
    });
  }

  await message.update({ reactions: filtered });

  await message.reload();

  return message;
};

export default UpdateMessageReactionService;
