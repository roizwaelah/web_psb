import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom"; // Tambahkan ini
import { motion, AnimatePresence } from "framer-motion";
import api from "@/services/api";

export default function FloatingWA() {
  const [isVisible, setIsVisible] = useState(false);
  const [waNumber, setWaNumber] = useState(null);
  
  // Deteksi rute URL saat ini
  const location = useLocation();
  const { kode_lembaga } = useParams();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get(`/public/home?lembaga=${kode_lembaga || "ponpes"}`);
        const whatsapp = res.data?.data?.kontak?.whatsapp;
        if (whatsapp) {
          setWaNumber(whatsapp.startsWith("0") ? `62${whatsapp.substring(1)}` : whatsapp);
        }
      } catch (error) {
        console.error("Gagal memuat nomor WhatsApp", error);
      }
    };

    fetchSettings();

    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, [kode_lembaga]);

  // LOGIKA PENYEMBUNYIAN: Jika di halaman pendaftaran, JANGAN TAMPILKAN
  if (location.pathname === `/${kode_lembaga}/daftar` || !waNumber) {
    return null; 
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.a
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 260, damping: 20 }}
          href={`https://wa.me/${waNumber}?text=Assalamu'alaikum, saya ingin bertanya tentang informasi pendaftaran santri baru.`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center group"
        >
          <span className="absolute right-16 bg-white text-gray-800 text-xs font-bold px-3 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
            Hubungi Admin PSB
          </span>

          <div className="relative">
            <span className="absolute inset-0 inline-flex h-full w-full rounded-full bg-green-500 opacity-40 animate-ping"></span>
            <div className="relative bg-linear-to-tr from-green-500 to-green-400 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all transform group-hover:-translate-y-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" className="w-8 h-8">
                <path d="M19.11 17.43c-.28-.14-1.66-.82-1.92-.91-.26-.09-.45-.14-.64.14-.19.28-.73.91-.89 1.1-.16.19-.33.21-.61.07-.28-.14-1.18-.44-2.24-1.39-.83-.74-1.39-1.66-1.55-1.94-.16-.28-.02-.43.12-.57.13-.13.28-.33.42-.5.14-.17.19-.28.28-.47.09-.19.05-.36-.02-.5-.07-.14-.64-1.55-.88-2.13-.23-.55-.47-.47-.64-.48h-.55c-.19 0-.5.07-.76.36-.26.28-1 1-1 2.44s1.03 2.83 1.17 3.02c.14.19 2.01 3.07 4.88 4.31.68.29 1.21.46 1.62.59.68.21 1.29.18 1.78.11.54-.08 1.66-.68 1.9-1.33.23-.65.23-1.2.16-1.33-.07-.12-.26-.19-.54-.33z" />
                <path d="M16 3C9.37 3 4 8.37 4 15c0 2.39.7 4.61 1.91 6.47L4 29l7.75-1.87A11.94 11.94 0 0016 27c6.63 0 12-5.37 12-12S22.63 3 16 3zm0 21.8c-1.9 0-3.76-.51-5.38-1.48l-.39-.23-4.6 1.11 1.22-4.48-.25-.41A9.77 9.77 0 016.2 15C6.2 9.6 10.6 5.2 16 5.2S25.8 9.6 25.8 15 21.4 24.8 16 24.8z" />
              </svg>
            </div>
          </div>
        </motion.a>
      )}
    </AnimatePresence>
  );
}
