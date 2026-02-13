import QuickAnswer from "../../models/QuickAnswer";
import AppError from "../../errors/AppError";

interface QuickAnswerData {
  shortcut?: string;
  message?: string;
  mediaType?: "text" | "buttons" | "list" | "carousel";
  dataJson?: string | null;
}

interface Request {
  quickAnswerData: QuickAnswerData;
  quickAnswerId: string;
  tenantId: string | number;
}

const UpdateQuickAnswerService = async ({
  quickAnswerData,
  quickAnswerId,
  tenantId
}: Request): Promise<QuickAnswer> => {
  const { shortcut, message, mediaType, dataJson } = quickAnswerData;

  const quickAnswer = await QuickAnswer.findOne({
    where: { id: quickAnswerId, tenantId },
    attributes: ["id", "shortcut", "message", "mediaType", "dataJson", "tenantId"]
  });

  if (!quickAnswer) {
    throw new AppError("ERR_NO_QUICK_ANSWERS_FOUND", 404);
  }
  await quickAnswer.update({
    shortcut,
    message,
    mediaType,
    dataJson
  });

  await quickAnswer.reload({
    attributes: ["id", "shortcut", "message", "mediaType", "dataJson", "tenantId"]
  });

  return quickAnswer;
};

export default UpdateQuickAnswerService;
