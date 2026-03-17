import { io } from "socket.io-client";

const socketUrl =
  import.meta.env.VITE_SOCKET_URL?.replace(/\/$/, "") || "http://localhost:5000";

const socket = io(socketUrl, {
  withCredentials: true,
  transports: ["websocket"],
});

export default socket;