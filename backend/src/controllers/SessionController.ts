import { Request, Response } from "express";
import AppError from "../errors/AppError";

import AuthUserService from "../services/UserServices/AuthUserService";
import { SendRefreshToken } from "../helpers/SendRefreshToken";
import { RefreshTokenService } from "../services/AuthServices/RefreshTokenService";

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { email, password } = req.body;

  const { token, serializedUser, refreshToken } = await AuthUserService({
    email,
    password
  });

  SendRefreshToken(res, refreshToken);

  return res.status(200).json({
    token,
    user: serializedUser
  });
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const token: string = req.cookies.jrt;

  if (!token) {
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }

  const { user, newToken, refreshToken } = await RefreshTokenService(
    res,
    token
  );

  SendRefreshToken(res, refreshToken);

  return res.json({ token: newToken, user });
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const frontendUrl = process.env.FRONTEND_URL || "";
  const isHttps = frontendUrl.startsWith("https://");

  // Extract domain for cookie clearing (must match how it was set)
  let domain: string | undefined;
  try {
    const url = new URL(frontendUrl);
    const hostParts = url.hostname.split(".");
    if (hostParts.length >= 2) {
      if (hostParts[hostParts.length - 1] === "localhost") {
        domain = ".localhost";
      } else {
        domain = "." + hostParts.slice(-2).join(".");
      }
    }
  } catch (e) {
    domain = undefined;
  }

  const clearOptions: any = {
    httpOnly: true,
    sameSite: isHttps ? "none" : "lax",
    secure: isHttps,
    path: "/"
  };

  if (domain) {
    clearOptions.domain = domain;
  }

  res.clearCookie("jrt", clearOptions);

  return res.send();
};
