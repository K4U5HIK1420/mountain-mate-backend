import { io } from "socket.io-client";

const resolveSocketUrl = () => {
  const raw = import.meta.env.VITE_SOCKET_URL?.replace(/\/$/, "") || "http://localhost:5000";

  try {
    const url = new URL(raw);
    const isLocalhost = ["localhost", "127.0.0.1"].includes(url.hostname);
    const currentHost = window.location.hostname;
    const currentIsLocalNetwork = /^(\d{1,3}\.){3}\d{1,3}$/.test(currentHost);

    if (isLocalhost && currentIsLocalNetwork) {
      url.hostname = currentHost;
      return url.toString().replace(/\/$/, "");
    }
  } catch (_err) {
    // fallback to raw value
  }

  return raw;
};

const socketUrl = resolveSocketUrl();

const socket = io(socketUrl, {
  withCredentials: true,
  transports: ["websocket"],
});

export default socket;
