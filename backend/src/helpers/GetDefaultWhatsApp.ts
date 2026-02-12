import AppError from "../errors/AppError";
import Whatsapp from "../models/Whatsapp";
import GetDefaultWhatsAppByUser from "./GetDefaultWhatsAppByUser";

const GetDefaultWhatsApp = async (userId?: number): Promise<Whatsapp> => {
  const ctx = require("./context").default.getStore();
  const effectiveTenantId = ctx?.tenantId;

  if (userId) {
    const whatsappByUser = await GetDefaultWhatsAppByUser(userId);
    if (whatsappByUser !== null) {
      return whatsappByUser;
    }
  }

  const where: any = { isDefault: true };
  if (effectiveTenantId) where.tenantId = effectiveTenantId;

  const defaultWhatsapp = await Whatsapp.findOne({
    where
  });

  if (!defaultWhatsapp) {
    // If no default for tenant, try absolute default (optional) or fail
    throw new AppError("ERR_NO_DEF_WAPP_FOUND");
  }

  return defaultWhatsapp;
};

export default GetDefaultWhatsApp;
