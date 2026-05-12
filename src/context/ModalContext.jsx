import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    content: null,
    onConfirm: null,
    confirmText: "Ya",
    cancelText: "Batal",
    isDanger: false, // Menentukan apakah tombol konfirmasi berwarna merah
  });

  const openModal = useCallback((options) => {
    setModal({
      isOpen: true,
      title: options.title || "",
      content: options.content || null,
      onConfirm: options.onConfirm || null,
      confirmText: options.confirmText || "Ya",
      cancelText: options.cancelText || "Batal",
      isDanger: options.isDanger || false,
    });
  }, []);

  const closeModal = useCallback(() => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Tutup dengan tombol ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") closeModal();
    };
    if (modal.isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [modal.isOpen, closeModal]);

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {createPortal(
        <AnimatePresence>
          {modal.isOpen && <ModalComponent {...modal} onClose={closeModal} />}
        </AnimatePresence>,
        document.body
      )}
    </ModalContext.Provider>
  );
};

// UI Component untuk Modal
const ModalComponent = ({
  title,
  content,
  onConfirm,
  confirmText,
  cancelText,
  isDanger,
  onClose,
}) => {
  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-0">
      
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Box */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
        className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 z-10 overflow-hidden"
      >
        {/* Dekorasi Garis Atas */}
        <div className={`absolute top-0 left-0 w-full h-1.5 ${isDanger ? 'bg-red-500' : 'bg-[#0e673b]'}`}></div>

        <div className="flex flex-col items-center text-center mt-2">
          {/* Ikon Dinamis */}
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${isDanger ? 'bg-red-50 text-red-500' : 'bg-teal-50 text-[#0e673b]'}`}>
            {isDanger ? (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            ) : (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )}
          </div>

          {title && (
            <h2 className="text-xl font-bold mb-2 text-gray-800">
              {title}
            </h2>
          )}

          <div className="text-sm text-gray-500 mb-8 leading-relaxed">
            {typeof content === "string" ? <p>{content}</p> : content}
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 w-full">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition text-sm"
          >
            {cancelText}
          </button>

          {onConfirm && (
            <button
              onClick={handleConfirm}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-white font-semibold transition text-sm shadow-md ${
                isDanger 
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30' 
                  : 'bg-[#0e673b] hover:bg-[#0a4d2c] shadow-teal-700/30'
              }`}
            >
              {confirmText}
            </button>
          )}
        </div>

      </motion.div>
    </div>
  );
};