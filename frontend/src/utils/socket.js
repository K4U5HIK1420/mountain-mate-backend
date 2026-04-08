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

let socketInstance = null;

function getSocketInstance() {
  if (socketInstance) return socketInstance;

  socketInstance = io(resolveSocketUrl(), {
    withCredentials: true,
    transports: ["websocket"],
    autoConnect: false,
  });

  return socketInstance;
}

function ensureConnected() {
  const socket = getSocketInstance();
  if (!socket.connected && socket.disconnected) {
    socket.connect();
  }
  return socket;
}

const socket = {
  get id() {
    return getSocketInstance().id;
  },
  get connected() {
    return getSocketInstance().connected;
  },
  connect() {
    return ensureConnected();
  },
  disconnect() {
    if (socketInstance) {
      socketInstance.disconnect();
    }
    return socket;
  },
  emit(...args) {
    ensureConnected().emit(...args);
    return socket;
  },
  on(...args) {
    ensureConnected().on(...args);
    return socket;
  },
  once(...args) {
    ensureConnected().once(...args);
    return socket;
  },
  off(...args) {
    if (socketInstance) {
      socketInstance.off(...args);
    }
    return socket;
  },
};

export { getSocketInstance };
export default socket;
