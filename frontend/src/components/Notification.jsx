import { motion } from "framer-motion";
import { createPortal } from "react-dom";

const Notification = ({ notification }) => {
  if (!notification) return null;

  const color = {
    success: "bg-green-600 text-white",
    error: "bg-red-600 text-white",
    warning: "bg-orange-500 text-black font-bold",
    info: "bg-blue-600 text-white"
  };

  const notificationNode = (
    <motion.div
      initial={{ opacity: 0, y: -40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      role="alert"
      className={`fixed top-6 right-6 ${color[notification.type]} px-6 py-4 rounded-xl shadow-xl z-[2147483647] max-w-[calc(100vw-2rem)] pointer-events-none`}
    >
      {notification.message}
    </motion.div>
  );

  return createPortal(notificationNode, document.body);
};

export default Notification;
