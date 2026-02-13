import openSocket from "socket.io-client";
import { getBackendUrl } from "../config";

function resolveSocketUrl() {
  const backendUrl = getBackendUrl() || "/";

  if (backendUrl.startsWith("/")) {
    return window.location.origin;
  }

  try {
    const parsed = new URL(backendUrl);
    return parsed.origin;
  } catch (_e) {
    return window.location.origin;
  }
}

function connectToSocket() {
  const token = localStorage.getItem("token");
  if (!token) {
    return;
  }

  return openSocket(resolveSocketUrl(), {
    path: "/socket.io",
    transports: ["websocket"],
    query: {
      token,
    },
  });
}

export default connectToSocket;
