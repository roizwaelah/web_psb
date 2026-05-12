import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // TAMBAHAN: Import useNavigate
import { useToast } from "@/context/ToastContext";
import api from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";

export default function StudentDashboardPage() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [pengumuman, setPengumuman] = useState("");
  const [isAnnouncementVisible, setIsAnnouncementVisible] = useState(true);
  
  const santriData = JSON.parse(localStorage.getItem("siswa_data") || "{}");
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/siswa/profile");
        const freshData = response.data.data; // <-- TAMBAHKAN BARIS INI
        
        setProfile(freshData); // <-- UBAH BARIS INI
        
        const oldData = JSON.parse(localStorage.getItem("siswa_data") || "{}");
        const updatedData = { ...oldData, ...freshData }; // Sekarang freshData sudah dikenali
        localStorage.setItem("siswa_data", JSON.stringify(updatedData));
        
        window.dispatchEvent(new Event("storageUpdate"));
      } catch (error) {
        if (error.response?.status !== 401) {
          showToast({
            type: "error",
            title: "Gagal memuat data",
            description: "Terjadi kesalahan saat mengambil data profil dari server.",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
    
    const fetchPengumuman = async () => {
      try {
        const res = await api.get(`/public/home?lembaga=${santriData.kode_lembaga || "ponpes"}`);
        if (res.data?.data?.pengumuman_santri) {
          setPengumuman(res.data.data.pengumuman_santri);
        }
      } catch (error) {
        console.error("Gagal menarik pengumuman");
      }
    };

    fetchPengumuman();
    
  }, [showToast]);

  const handleLockedMenuClick = () => {
    showToast({
      type: "warning",
      title: "Akses Terkunci",
      description: "Silakan selesaikan pembayaran pendaftaran terlebih dahulu untuk membuka menu ini."
    });
    navigate("/siswa/pembayaran");
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <svg className="animate-spin h-10 w-10 text-[#0e673b]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-gray-500 font-medium animate-pulse">Memuat data santri...</p>
      </div>
    );
  }

  if (!profile) return null;

  const isLunas = profile.status_pembayaran === "Lunas";

  // Fungsi penentu warna dan ikon berdasarkan status penerimaan
  const getStatusData = (status) => {
    switch (status) {
      case "Diterima":
        return {
          bg: "bg-[#0e673b]", // Hijau Pesantren
          titleColor: "text-green-300",
          desc: "Selamat! Anda telah resmi diterima sebagai santri baru. Silakan cetak Surat Keterangan Lulus pada menu Cetak Kartu.",
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        };
      case "Ditolak":
        return {
          bg: "bg-red-600", // Merah
          titleColor: "text-red-200",
          desc: "Mohon maaf, Anda belum memenuhi kriteria penerimaan kami tahun ini. Tetap semangat dan jangan menyerah!",
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        };
      case "Proses Seleksi":
        return {
          bg: "bg-blue-600", // Biru
          titleColor: "text-blue-200",
          desc: "Berkas Anda sedang dalam proses evaluasi dan seleksi oleh panitia. Mohon tunggu pengumuman selanjutnya.",
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        };
      case "Menunggu":
      default:
        return {
          bg: "bg-amber-500", // Kuning/Amber
          titleColor: "text-yellow-200",
          desc: "Data Anda telah masuk ke sistem. Silakan lengkapi dokumen pendukung dan tunggu verifikasi panitia.",
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        };
    }
  };

  const status = profile.status_penerimaan || "Menunggu";
  const statusData = getStatusData(status);
  
  return (
    <div className="space-y-6">
      {/* ================= BANNER PERINGATAN PEMBAYARAN ================= */}
      {!isLunas && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-50 border-l-4 border-amber-500 p-4 sm:p-5 mb-6 rounded-r-xl shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0 text-amber-600"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-amber-800">Aksi Diperlukan: Selesaikan Pembayaran</h3>
              <p className="text-xs sm:text-[13px] text-amber-700 mt-1 leading-relaxed">Anda belum melakukan pembayaran biaya pendaftaran. Akses ke menu <strong className="font-bold">Unggah Dokumen</strong> dan <strong className="font-bold">Cetak Kartu</strong> masih dikunci.</p>
            </div>
          </div>
          <Link to="/siswa/pembayaran" className="w-full sm:w-auto text-center shrink-0 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold rounded-lg transition shadow-md shadow-amber-500/20 whitespace-nowrap">Bayar Sekarang</Link>
        </motion.div>
      )}
      
      {/* ================= BANNER PENGUMUMAN ================= */}
      <AnimatePresence>
        {pengumuman && isAnnouncementVisible && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-linear-to-r from-amber-500 to-orange-500 p-1 rounded-2xl shadow-lg relative overflow-hidden"
          >
            <div className="bg-amber-50/95 backdrop-blur-sm p-4 rounded-xl flex items-start sm:items-center gap-4 border border-amber-200/50 relative z-10">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0 text-amber-600 shadow-inner">
                <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-0.5">Informasi Penting Panitia</h3>
                <p className="text-sm text-amber-900/80 font-medium whitespace-pre-wrap leading-relaxed">
                  {pengumuman}
                </p>
              </div>
              <button 
                onClick={() => setIsAnnouncementVisible(false)}
                className="p-2 text-amber-600 hover:bg-amber-200/50 rounded-lg transition shrink-0"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {/* Dekorasi Background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= HEADER DASHBOARD ================= */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
      >
        <h1 className="text-2xl font-bold text-gray-800">
          Ahlan wa Sahlan, <span className="text-[#0e673b]">{profile.nama_lengkap}</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Nomor Registrasi: <strong className="text-gray-700">{profile.nomor_pendaftaran}</strong>
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* ================= KOLOM KIRI ================= */}
        <div className="md:col-span-1 space-y-6">
          
          {/* Card Status Dinamis */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className={`${statusData.bg} text-white p-6 rounded-2xl shadow-md relative overflow-hidden transition-colors duration-500`}
          >
            {/* Ikon Latar Belakang */}
            <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
               <svg className="w-32 h-32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 {statusData.icon}
               </svg>
            </div>
            
            <h3 className={`${statusData.titleColor} font-semibold mb-1 text-sm relative z-10 uppercase tracking-wider`}>
              Status Pendaftaran
            </h3>
            <p className="text-2xl font-bold relative z-10 drop-shadow-sm">{status}</p>
            <p className="text-sm mt-3 relative z-10 text-white/90 leading-relaxed">
              {statusData.desc}
            </p>
          </motion.div>

          {/* Menu Aksi Cepat */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100 font-semibold text-gray-700">Aksi Cepat</div>
            <div className="flex flex-col">
              <Link to="/siswa/biodata" className="p-4 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-800 border-b transition flex justify-between items-center group">
                Periksa Biodata <span className="text-gray-400 group-hover:text-teal-600 transition-transform group-hover:translate-x-1">→</span>
              </Link>
              
              {/* PENERAPAN GEMBOK DIGITAL UNTUK DOKUMEN & CETAK */}
              {isLunas ? (
                <>
                  <Link to="/siswa/dokumen" className="p-4 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-800 border-b transition flex justify-between items-center group">
                    Unggah Dokumen <span className="text-gray-400 group-hover:text-teal-600 transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                  <Link to="/siswa/cetak" className="p-4 text-sm text-[#0e673b] font-bold hover:bg-gray-50 transition flex justify-between items-center group">
                    Cetak Kartu Ujian <span className="transition-transform group-hover:scale-110">🖨️</span>
                  </Link>
                </>
              ) : (
                <>
                  <button onClick={handleLockedMenuClick} className="w-full text-left p-4 text-sm text-slate-400 bg-slate-50 border-b border-slate-100 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition flex justify-between items-center group">
                    Unggah Dokumen
                    <svg className="w-4 h-4 text-slate-300 group-hover:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </button>
                  <button onClick={handleLockedMenuClick} className="w-full text-left p-4 text-sm text-slate-400 font-bold bg-slate-50 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition flex justify-between items-center group">
                    Cetak Kartu Ujian
                    <svg className="w-4 h-4 text-slate-300 group-hover:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* ================= KOLOM KANAN (RINGKASAN) ================= */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 h-fit">
          <h2 className="text-lg font-bold text-gray-800 mb-6 border-b pb-3 border-gray-100 flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
            Ringkasan Biodata Santri
          </h2>
          
          <div className="grid sm:grid-cols-2 gap-y-6 gap-x-8">
            <div>
              <p className="text-xs text-gray-500 mb-1 font-medium">Nama Lengkap</p>
              <p className="font-semibold text-gray-800">{profile.nama_lengkap}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1 font-medium">NISN / NIK</p>
              <p className="font-semibold text-gray-800">{profile.nisn} / {profile.nik}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1 font-medium">Tempat, Tanggal Lahir</p>
              <p className="font-semibold text-gray-800">{profile.tempat_lahir}, {profile.tanggal_lahir}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1 font-medium">Jenis Kelamin</p>
              <p className="font-semibold text-gray-800">{profile.jenis_kelamin}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1 font-medium">Asal Sekolah</p>
              <p className="font-semibold text-gray-800">{profile.asal_sekolah}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-gray-500 mb-1 font-medium">Alamat Lengkap</p>
              <p className="font-semibold text-gray-800 leading-relaxed">{profile.alamat_lengkap}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
