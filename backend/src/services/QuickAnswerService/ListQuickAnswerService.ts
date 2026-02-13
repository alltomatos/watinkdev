import { Sequelize, Op } from "sequelize";
import QuickAnswer from "../../models/QuickAnswer";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  tenantId: string | number;
}

interface Response {
  quickAnswers: QuickAnswer[];
  count: number;
  hasMore: boolean;
}

const ListQuickAnswerService = async ({
  searchParam = "",
  pageNumber = "1",
  tenantId
}: Request): Promise<Response> => {
  const normalized = searchParam.toLowerCase().trim();
  const whereCondition: any = { tenantId };

  if (normalized) {
    whereCondition[Op.or] = [
      Sequelize.where(
        Sequelize.fn("LOWER", Sequelize.col("message")),
        "LIKE",
        `%${normalized}%`
      ),
      Sequelize.where(
        Sequelize.fn("LOWER", Sequelize.col("shortcut")),
        "LIKE",
        `%${normalized}%`
      )
    ];
  }

  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const { count, rows: quickAnswers } = await QuickAnswer.findAndCountAll({
    where: whereCondition,
    limit,
    offset,
    order: [["shortcut", "ASC"]]
  });

  const hasMore = count > offset + quickAnswers.length;

  return {
    quickAnswers,
    count,
    hasMore
  };
};

export default ListQuickAnswerService;
