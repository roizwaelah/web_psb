import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/context/ToastContext";
import api from "@/services/api";
import { motion } from "framer-motion";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "").trim();

    if (!username || !password) {
      showToast({ type: "error", title: "Validasi Gagal", description: "Username dan password wajib diisi." });
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post("/auth/admin/login", { username, password });
      const { user } = response.data;

      localStorage.setItem("admin_data", JSON.stringify(user));

      showToast({ type: "success", title: "Login Berhasil", description: `Selamat datang, ${user.nama_lengkap} (${user.role.toUpperCase()})` });
      
      // Arahkan ke dashboard admin
      navigate("/admin/dashboard"); 
      
    } catch (error) {
      showToast({ 
        type: "error", 
        title: "Login Gagal", 
        description: error.response?.data?.message || "Terjadi kesalahan pada server." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 relative overflow-hidden">
      {/* Background Decor (Disesuaikan ukurannya untuk mobile & desktop) */}
      <div className="absolute top-[-5%] left-[-10%] w-64 h-64 sm:w-80 sm:h-80 bg-teal-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-5%] right-[-10%] w-64 h-64 sm:w-80 sm:h-80 bg-blue-500/20 rounded-full blur-3xl"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-slate-800/80 backdrop-blur-xl p-5 sm:p-6 rounded-3xl shadow-2xl border border-slate-700 relative z-10"
      >
        <div className="text-center mb-5 sm:mb-6 mt-1">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-linear-to-tr from-teal-500 to-blue-500 text-white rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg transform rotate-3">
            <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white">Admin Panel PSB</h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-1">Otorisasi Panel Admin & Validator</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-300 mb-1 sm:mb-1.5 uppercase tracking-wider">
              Username
            </label>
            <input
              name="username"
              type="text"
              placeholder="Masukkan username"
              disabled={isLoading}
              className="w-full p-2.5 sm:p-3 bg-slate-900/50 border border-slate-600 rounded-xl focus:bg-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none text-xs sm:text-sm text-white disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-300 mb-1 sm:mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              disabled={isLoading}
              className="w-full p-2.5 sm:p-3 bg-slate-900/50 border border-slate-600 rounded-xl focus:bg-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none text-xs sm:text-sm text-white disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 sm:py-3 mt-2 sm:mt-4 bg-linear-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-70 flex justify-center items-center gap-2 text-[13px] sm:text-sm"
          >
            {isLoading ? "Mengautentikasi..." : "Masuk"}
          </button>
        </form>

        {/* BAGIAN YANG DITAMBAHKAN: Tombol Kembali ke Beranda */}
        <div className="mt-5 sm:mt-6 pt-4 border-t border-slate-700/50 text-center">
          <a 
            href="/" 
            className="inline-flex items-center justify-center gap-2 text-[11px] sm:text-xs text-slate-400 hover:text-teal-400 transition-colors duration-200"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Beranda
          </a>
        </div>

      </motion.div>
    </div>
  );
}
