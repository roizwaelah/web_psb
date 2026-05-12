import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/context/ToastContext";
import { useModal } from "@/context/ModalContext";
import { motion, AnimatePresence } from "framer-motion";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import api from "@/services/api"; // <-- TAMBAHAN: Import API

const ALL_NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", roles: ["admin", "validator"], icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /> },
  { to: "/admin/validasi", label: "Validasi Berkas", roles: ["admin", "validator"], icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
  { to: "/admin/pembayaran", label: "Validasi Pembayaran", roles: ["admin", "validator"], icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
  { to: "/admin/dokumen", label: "Manajemen Dokumen", roles: ["admin", "validator"], icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /> },
  { to: "/admin/pendaftar", label: "Data Pendaftar", roles: ["admin"], icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /> },
  { to: "/admin/pengumuman", label: "Pengumuman Santri", roles: ["admin", "validator"], icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /> },
  { to: "/admin/users", label: "Manajemen Pengguna", roles: ["admin"], icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /> },
  { to: "/admin/pengaturan", label: "Pengaturan Web", roles: ["admin"], icon: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></> },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { openModal } = useModal();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null); // <-- TAMBAHAN: State untuk Logo

  useEffect(() => {
    const data = localStorage.getItem("admin_data");
    if (data) {
      const parsedAdmin = JSON.parse(data);
      setAdminData(parsedAdmin);

      // <-- TAMBAHAN: Tarik logo berdasarkan lembaga Admin yang login
      const fetchLogo = async () => {
        try {
          const kode = parsedAdmin.kode_lembaga || "ponpes"; // Superadmin diarahkan ke ponpes default
          const res = await api.get(`/public/home?lembaga=${kode}`);
          if (res.data?.data?.navbar?.logo) {
            setLogoUrl(res.data.data.navbar.logo);
          }
        } catch (err) {
          console.error("Gagal menarik logo admin", err);
        }
      };
      fetchLogo();
      
    } else {
      navigate("/admin/login");
    }
  }, [navigate]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleIdle = () => {
    localStorage.removeItem("admin_data");
    api.post("/auth/logout").catch(() => {});
    showToast({ type: "error", title: "Sesi Habis", description: "Anda dikeluarkan otomatis karena tidak ada aktivitas selama 10 menit demi keamanan." });
    navigate("/admin/login");
  };

  useIdleTimeout(handleIdle, 600000); 

  const handleLogout = () => {
    openModal({
      title: "Konfirmasi Keluar",
      content: "Apakah Anda yakin ingin keluar dari Panel Administrator?",
      confirmText: "Ya, Keluar",
      cancelText: "Batal",
      isDanger: true,
      onConfirm: () => {
        localStorage.removeItem("admin_data");
        api.post("/auth/logout").catch(() => {});
        showToast({ type: "success", title: "Berhasil Keluar", description: "Anda telah keluar dari sistem admin." });
        navigate("/admin/login");
      }
    });
  };

  if (!adminData) return null;

  const allowedNavItems = ALL_NAV_ITEMS.filter(item => item.roles.includes(adminData.role));

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      <div className="h-14 flex items-center px-4 sm:px-5 border-b border-slate-800 shrink-0 gap-2.5">
        
        {/* LOGIKA LOGO DINAMIS */}
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt="Logo Unit" 
            className="w-7 h-7 object-contain bg-white/10 rounded-md p-0.5 shrink-0" 
          />
        ) : (
          <div className="w-7 h-7 bg-linear-to-tr from-teal-500 to-blue-500 text-white rounded-md flex items-center justify-center font-bold text-base shrink-0">
            {/* Fallback cerdas: Ambil huruf pertama dari nama lembaga, jika kosong pakai 'Y' (Yayasan) */}
            {adminData.nama_lembaga ? adminData.nama_lembaga.charAt(0).toUpperCase() : 'Y'}
          </div>
        )}

        <div>
          <h1 className="text-xs sm:text-[13px] font-bold text-white tracking-wide truncate max-w-40">
            {adminData.nama_lembaga || "Yayasan Pusat"}
          </h1>
          <p className="text-[9px] text-teal-400 uppercase tracking-widest font-semibold">{adminData.role}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 custom-scrollbar">
        {allowedNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              ["flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs sm:text-[13px] font-medium transition-all duration-200",
                isActive ? "bg-slate-800 text-teal-400 shadow-inner" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"].join(" ")
            }
          >
            <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">{item.icon}</svg>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 sm:p-4 border-t border-slate-800 shrink-0">
        <div className="bg-slate-800 rounded-lg p-2.5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs shrink-0">
            {adminData.nama_lengkap.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">{adminData.nama_lengkap}</p>
            <p className="text-[10px] text-slate-400 truncate">@{adminData.username}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <aside className="hidden lg:flex w-60 flex-col fixed inset-y-0 left-0 z-20 shadow-xl"><SidebarContent /></aside>
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden" />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "tween", duration: 0.3 }} className="fixed inset-y-0 left-0 w-60 bg-slate-900 shadow-2xl z-50 lg:hidden flex flex-col">
              <button onClick={() => setIsSidebarOpen(false)} className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 lg:pl-60 transition-all">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-5 lg:px-6 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h2 className="text-sm sm:text-base font-bold text-slate-800 hidden sm:block">Control Panel</h2>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <span className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-[11px] font-bold text-emerald-700">
              📍 Unit: {adminData.nama_lembaga || 'Yayasan Pusat (Akses Penuh)'}
            </span>

            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-600">
              <span className={`w-1.5 h-1.5 rounded-full ${adminData.role === 'admin' ? 'bg-teal-500' : 'bg-blue-500'}`}></span>
              Mode: {adminData.role === 'admin' ? 'Administrator' : 'Verifikator'}
            </span>
            
            <div className="w-px h-5 bg-slate-200 hidden sm:block"></div>

            <button onClick={handleLogout} className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors">
              Keluar <svg className="w-3.5 h-3.5 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-5 lg:p-6">
          <div className="max-w-5xl mx-auto"><Outlet /></div>
        </main>
      </div>
      
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #334155; border-radius: 20px; }`}</style>
    </div>
  );
}
