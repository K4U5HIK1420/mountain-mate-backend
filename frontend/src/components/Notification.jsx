import { motion } from "framer-motion";

const Notification = ({ notification }) => {

  if (!notification) return null;

  const color = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-orange-600"
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