import Queue from "../../models/Queue";
import Whatsapp from "../../models/Whatsapp";
import Tag from "../../models/Tag";

const ListWhatsAppsService = async (tenantId?: number | string): Promise<Whatsapp[]> => {
  const ctx = require("../../libs/context").default.getStore();
  const effectiveTenantId = tenantId || ctx?.tenantId;

  const whereCondition: any = {};
  if (effectiveTenantId) {
    whereCondition.tenantId = effectiveTenantId;
  }

  const whatsapps = await Whatsapp.findAll({
    where: whereCondition,
    include: [
      {
        model: Queue,
        as: "queues",
        attributes: ["id", "name", "color", "greetingMessage"]
      },
      {
        model: Tag,
        as: "tags",
        attributes: ["id", "name", "color"]
      }
    ]
  });

  return whatsapps;
};

export default ListWhatsAppsService;
