import Setting from "../../models/Setting";

interface Request {
  tenantId?: number | string;
}

const ListSettingsService = async (params?: Request): Promise<Setting[] | undefined> => {
  const ctx = require("../../libs/context").default.getStore();
  const effectiveTenantId = params?.tenantId || ctx?.tenantId;

  const whereCondition: any = effectiveTenantId ? { tenantId: effectiveTenantId } : {};

  const settings = await Setting.findAll({
    where: whereCondition
  });

  return settings;
};

export default ListSettingsService;
