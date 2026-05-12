// src/context/ToastContext.jsx
import { createContext, useContext, useState, useCallback } from "react";
import { createPortal } from "react-dom";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const generateId = () => Date.now() + Math.random();

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const showToast = useCallback(
    ({ title, description, type = "info", duration = 4000 }) => {
      const id = generateId();

      setToasts((prev) => [
        ...prev,
        { id, title, description, type, duration },
      ]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    []
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {createPortal(
        <div className="fixed top-6 right-6 z-9999 space-y-4 w-[90%] sm:w-auto">
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              {...toast}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

const ToastItem = ({
  title,
  description,
  type,
  duration,
  onClose,
}) => {
  const typeStyles = {
    success: "border-teal-600",
    error: "border-red-500",
    warning: "border-yellow-400",
    info: "border-blue-500",
  };

  const progressStyles = {
    success: "bg-teal-600",
    error: "bg-red-500",
    warning: "bg-yellow-400",
    info: "bg-blue-500",
  };

  return (
    <div
      className={`relative bg-white dark:bg-gray-800 border-l-4 ${typeStyles[type]} shadow-xl rounded-xl p-4 overflow-hidden animate-toast`}
    >
      <div className="flex justify-between items-start gap-4">
        <div>
          {title && (
            <p className="text-sm font-semibold text-gray-800 dark:text-white">
              {title}
            </p>
          )}
          {description && (
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
              {description}
            </p>
          )}
        </div>

        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg"
        >
          ×
        </button>
      </div>

      {/* Progress Bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 h-[3px] w-full bg-gray-200">
          <div
            className={`h-full ${progressStyles[type]} animate-progress`}
            style={{ animationDuration: `${duration}ms` }}
          />
        </div>
      )}
    </div>
  );
};