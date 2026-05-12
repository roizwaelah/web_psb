import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "@/services/api";
import { useToast } from "@/context/ToastContext";
import { Link } from "react-router-dom";

// Helper untuk mewarnai badge status
const StatusBadge = ({ status }) => {
  const colors = {
    "Diterima": "bg-green-100 text-green-700 border-green-200",
    "Ditolak": "bg-red-100 text-red-700 border-red-200",
    "Proses Seleksi": "bg-blue-100 text-blue-700 border-blue-200",
    "Menunggu": "bg-amber-100 text-amber-700 border-amber-200"
  };
  const colorClass = colors[status] || colors["Menunggu"];
  
  return (
    <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-bold rounded-full border ${colorClass} uppercase tracking-wider inline-flex items-center gap-1 sm:gap-1.5`}>
      <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${colorClass.replace('bg-', 'bg-').replace('100', '500')}`}></span>
      {status}
    </span>
  );
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/admin/dashboard/stats");
        setStats(response.data.data);
      } catch (error) {
        if (error.response?.status !== 401) {
          showToast({ type: "error", title: "Gagal memuat", description: "Tidak dapat menarik data statistik." });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [showToast]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <svg className="animate-spin h-8 w-8 text-slate-500 mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <p className="text-sm text-slate-500 font-medium">Memuat statistik dashboard...</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-4 sm:space-y-5">
      
      {/* Header Halaman */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5 sm:mb-6">
        <h1 className="text-lg sm:text-xl font-bold text-slate-800 border-l-4 sm:border-l-[5px] border-teal-500 pl-3">
          Tinjauan Data PSB
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1 sm:mt-1.5 ml-4">
          Pantau statistik pendaftaran santri baru secara real-time.
        </p>
      </motion.div>

      {/* ================= KARTU STATISTIK ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        
        {/* Card: Total Pendaftar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3 sm:gap-4 relative overflow-hidden group">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-slate-800 group-hover:text-white transition-colors duration-300">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <div>
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500">Total Pendaftar</p>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-800">{stats.total_pendaftar}</p>
          </div>
        </motion.div>

        {/* Card: Menunggu Verifikasi */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3 sm:gap-4 relative overflow-hidden group">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500">Menunggu Verifikasi</p>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-800">{stats.total_menunggu}</p>
          </div>
        </motion.div>

        {/* Card: Proses Seleksi */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3 sm:gap-4 relative overflow-hidden group">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </div>
          <div>
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500">Proses Seleksi</p>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-800">{stats.total_proses}</p>
          </div>
        </motion.div>

        {/* Card: Diterima */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3 sm:gap-4 relative overflow-hidden group">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 group-hover:bg-teal-500 group-hover:text-white transition-colors duration-300">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500">Santri Diterima</p>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-800">{stats.total_diterima}</p>
          </div>
        </motion.div>
      </div>

      {/* ================= TABEL PENDAFTAR TERBARU ================= */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
        
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Pendaftar Terbaru
          </h2>
          <Link to="/admin/validasi" className="text-[11px] sm:text-xs font-semibold text-teal-600 hover:text-teal-800 transition">
            Lihat Semua Pendaftar →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] sm:text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="p-3 sm:p-4 font-semibold whitespace-nowrap">No. Pendaftaran</th>
                <th className="p-3 sm:p-4 font-semibold whitespace-nowrap">Nama Lengkap</th>
                <th className="p-3 sm:p-4 font-semibold whitespace-nowrap">Asal Sekolah</th>
                <th className="p-3 sm:p-4 font-semibold whitespace-nowrap">Tanggal Daftar</th>
                <th className="p-3 sm:p-4 font-semibold text-right whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-[13px]">
              {stats.recent_registrants.length > 0 ? (
                stats.recent_registrants.map((santri) => (
                  <tr key={santri.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-3 sm:p-4 font-mono font-medium text-slate-600 whitespace-nowrap">{santri.nomor_pendaftaran}</td>
                    <td className="p-3 sm:p-4 font-bold text-slate-800 whitespace-nowrap">{santri.nama_lengkap}</td>
                    <td className="p-3 sm:p-4 text-slate-500 truncate max-w-[150px] sm:max-w-[200px]">{santri.asal_sekolah}</td>
                    <td className="p-3 sm:p-4 text-slate-500 whitespace-nowrap">
                      {new Date(santri.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-3 sm:p-4 text-right whitespace-nowrap">
                      <StatusBadge status={santri.status_penerimaan} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-6 sm:p-8 text-center text-xs sm:text-sm text-slate-400">
                    Belum ada data pendaftar saat ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

    </div>
  );
}