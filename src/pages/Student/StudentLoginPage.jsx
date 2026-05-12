import { useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { useToast } from "@/context/ToastContext";
import api from "@/services/api";
import { motion } from "framer-motion";

export default function StudentLoginPage() {
  const { kode_lembaga } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nisn = String(formData.get("nisn") || "").trim();
    const tanggalLahir = String(formData.get("tanggal_lahir") || "").trim();

    if (!nisn || !tanggalLahir) {
      showToast({
        type: "error",
        title: "Validasi Gagal",
        description: "NISN dan tanggal lahir wajib diisi.",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Tembak API Backend PHP beserta kode_lembaga
      const response = await api.post("/auth/siswa/login", {
        kode_lembaga: kode_lembaga,
        nisn: nisn,
        tanggal_lahir: tanggalLahir,
      });

      const { user } = response.data;

      localStorage.setItem("siswa_data", JSON.stringify(user));

      showToast({
        type: "success",
        title: "Login Berhasil",
        description: `Selamat datang, ${user.nama_lengkap}.`,
      });
      navigate("/siswa/dashboard");
    } catch (error) {
      showToast({
        type: "error",
        title: "Login Gagal",
        description:
          error.response?.data?.message || "Terjadi kesalahan pada server.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-6 py-6 sm:py-10 bg-gray-50/50">
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm bg-white p-5 sm:p-6 rounded-3xl shadow-2xl border border-gray-100 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-[#0e673b] to-[#f4c430]"></div>
        
        <div className="text-center mb-5 sm:mb-6 mt-1">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#0e673b]/10 text-[#0e673b] rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
            <svg
              className="w-6 h-6 sm:w-7 sm:h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
              />
            </svg>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">
            PANEL CALON SANTRI/SISWA
          </h1>
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">
            {kode_lembaga.toUpperCase()}
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500 mt-1 sm:mt-1.5 leading-relaxed">
            Gunakan NISN dan Tanggal Lahir Anda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1">
              NISN <span className="text-red-500">*</span>
            </label>
            <input
              name="nisn"
              type="text"
              placeholder="Masukkan 10 digit NISN"
              disabled={isLoading}
              className="w-full p-2.5 sm:p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0e673b]/20 focus:border-[#0e673b] transition-all outline-none text-xs sm:text-sm disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1">
              Tanggal Lahir <span className="text-red-500">*</span>
            </label>
            <input
              name="tanggal_lahir"
              type="date"
              disabled={isLoading}
              className="w-full p-2.5 sm:p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0e673b]/20 focus:border-[#0e673b] transition-all outline-none text-xs sm:text-sm text-gray-700 disabled:bg-gray-100"
            />
          </div>
          
          {/* ================= GABUNGAN TOMBOL KEMBALI & SUBMIT ================= */}
          <div className="flex items-center gap-2 sm:gap-3 mt-2 pt-1">
            <Link
              to={`/${kode_lembaga}`}
              title="Kembali ke Beranda"
              className="flex items-center justify-center p-2.5 sm:p-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors shrink-0 border border-gray-200"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 sm:py-3 bg-[#0e673b] hover:bg-[#0a4d2c] text-white font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2"
            >
              {isLoading ? "Memeriksa..." : "Masuk"}
            </button>
          </div>
          {/* ==================================================================== */}
          
        </form>

        <div className="mt-5 sm:mt-6 text-center bg-yellow-50/50 p-2.5 sm:p-3 rounded-xl border border-yellow-100">
          <p className="text-[11px] sm:text-xs text-gray-600">
            Belum mendaftar?{" "}
            <Link
              to={`/${kode_lembaga}/daftar`}
              className="font-bold text-[#0e673b] hover:underline"
            >
              Daftar Sekarang
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
