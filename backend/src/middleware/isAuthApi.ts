import { Request, Response, NextFunction } from "express";

import AppError from "../errors/AppError";
import ListSettingByValueService from "../services/SettingServices/ListSettingByValueService";
import context from "../libs/context";

const isAuthApi = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }

  const [, token] = authHeader.split(" ");

  try {
    const getToken = await ListSettingByValueService(token);
    if (!getToken) {
      throw new AppError("ERR_SESSION_EXPIRED", 401);
    }

    if (getToken.value !== token) {
      throw new AppError("ERR_SESSION_EXPIRED", 401);
    }

    const setting = await require("../models/Setting").default.findOne({ where: { value: token } });

    if (!setting) {
        throw new AppError("ERR_SESSION_EXPIRED", 401);
    }

    req.user = {
      id: "API",
      tenantId: setting.tenantId,
      profile: "admin"
    };

    return context.run({ tenantId: setting.tenantId.toString(), userId: "API" }, () => {
      return next();
    });
  } catch (err) {
    console.log(err);
    throw new AppError(
      "Invalid token. We'll try to assign a new one on next request",
      403
    );
  }

  return next();
};

export default isAuthApi;
