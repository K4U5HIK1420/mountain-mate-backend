import { createContext, useContext, useState } from "react";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {

  const [notification, setNotification] = useState(null);

  const notify = (message, type = "info") => {

    setNotification({ message, type });

    setTimeout(() => {
      setNotification(null);
    }, 4000);

  };

  return (
    <NotificationContext.Provider value={{ notify, notification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotify = () => useContext(NotificationContext);