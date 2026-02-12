import AppError from "../../errors/AppError";
import Setting from "../../models/Setting";

interface Request {
  key: string;
  value: string;
  tenantId: number | string;
}

const UpdateSettingService = async ({
  key,
  value,
  tenantId
}: Request): Promise<Setting | undefined> => {
  const ctx = require("../../libs/context").default.getStore();
  const effectiveTenantId = tenantId || ctx?.tenantId;

  let setting = await Setting.findOne({
    where: { key, tenantId: effectiveTenantId }
  });

  if (!setting) {
    setting = await Setting.create({ key, value, tenantId: effectiveTenantId });
  } else {
    await setting.update({ value });
  }

  return setting;
};

export default UpdateSettingService;
