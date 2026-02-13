import AppError from "../../errors/AppError";
import QuickAnswer from "../../models/QuickAnswer";

interface Request {
  shortcut: string;
  message: string;
  mediaType?: "text" | "buttons" | "list" | "carousel";
  dataJson?: string | null;
  tenantId: string | number;
}

const CreateQuickAnswerService = async ({
  shortcut,
  message,
  mediaType = "text",
  dataJson = null,
  tenantId
}: Request): Promise<QuickAnswer> => {
  const nameExists = await QuickAnswer.findOne({
    where: { shortcut, tenantId }
  });

  if (nameExists) {
    throw new AppError("ERR__SHORTCUT_DUPLICATED");
  }

  const quickAnswer = await QuickAnswer.create({ shortcut, message, mediaType, dataJson, tenantId });

  return quickAnswer;
};

export default CreateQuickAnswerService;
