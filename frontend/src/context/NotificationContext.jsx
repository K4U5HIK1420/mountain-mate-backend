import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);
  const timeoutRef = useRef(null);

  const notify = useCallback((message, type = "info") => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    setNotification({ message, type });
    timeoutRef.current = window.setTimeout(() => {
      setNotification(null);
    }, 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const value = useMemo(() => ({ notify, notification }), [notify, notification]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotify = () => useContext(NotificationContext);
