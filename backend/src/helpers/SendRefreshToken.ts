import { Response } from "express";

export const SendRefreshToken = (res: Response, token: string): void => {
  const frontendUrl = process.env.FRONTEND_URL || "";
  const isHttps = frontendUrl.startsWith("https://");

  // Extract base domain for cookie sharing between subdomains
  // e.g., "http://app.localhost" -> ".localhost"
  // e.g., "https://app.example.com" -> ".example.com"
  let domain: string | undefined;
  try {
    const url = new URL(frontendUrl);
    const hostParts = url.hostname.split(".");
    if (hostParts.length >= 2) {
      // For localhost subdomains (app.localhost), use ".localhost"
      // For real domains (app.example.com), use ".example.com"
      if (hostParts[hostParts.length - 1] === "localhost") {
        domain = ".localhost";
      } else {
        domain = "." + hostParts.slice(-2).join(".");
      }
    }
  } catch (e) {
    // If URL parsing fails, don't set domain
    domain = undefined;
  }

  // For cross-subdomain cookies on HTTP (localhost dev), we need to relax sameSite
  // Browsers treat different subdomains as cross-site for sameSite purposes
  const cookieOptions: any = {
    httpOnly: true,
    sameSite: isHttps ? "none" : "lax",
    secure: isHttps,
    path: "/",
  };

  // Set domain for subdomain sharing (e.g., app.localhost <-> api.localhost)
  if (domain) {
    cookieOptions.domain = domain;
  }

  res.cookie("jrt", token, cookieOptions);
};

