import { motion } from "framer-motion";

const Notification = ({ notification }) => {

  if (!notification) return null;

  const color = {
    success: "bg-green-600 text-white",
    error: "bg-red-600 text-white",
    warning: "bg-orange-500 text-black font-bold",
    info: "bg-blue-600 text-white"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`fixed top-6 right-6 ${color[notification.type]} text-white px-6 py-4 rounded-xl shadow-xl z-[5000]`}
    >
      {notification.message}
    </motion.div>
  );
};

export default Notification;