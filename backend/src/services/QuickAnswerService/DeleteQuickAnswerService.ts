import QuickAnswer from "../../models/QuickAnswer";
import AppError from "../../errors/AppError";

const DeleteQuickAnswerService = async (id: string, tenantId: string | number): Promise<void> => {
  const quickAnswer = await QuickAnswer.findOne({
    where: { id, tenantId }
  });

  if (!quickAnswer) {
    throw new AppError("ERR_NO_QUICK_ANSWER_FOUND", 404);
  }

  await quickAnswer.destroy();
};

export default DeleteQuickAnswerService;
