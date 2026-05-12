import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "@/services/api";

// Menerima props kode_lembaga
export default function Navbar({ kode_lembaga }) {
  const [navData, setNavData] = useState({
    text: "Pendaftaran Online",
    logo: "/logo.png"
  });

  useEffect(() => {
    const fetchNavData = async () => {
      try {
        const res = await api.get(`/public/home?lembaga=${kode_lembaga}`);
        if (res.data?.data?.navbar) {
          setNavData({
            text: res.data.data.navbar.text || `PSB ${kode_lembaga?.toUpperCase()}`,
            logo: res.data.data.navbar.logo || "/logo.png"
          });
        }
      } catch (error) {
        console.error("Gagal memuat Navbar:", error);
      }
    };

    if (kode_lembaga) {
      fetchNavData();
    }
  }, [kode_lembaga]);

  return (
    <nav className="fixed w-full z-50 backdrop-blur-md bg-[#145A32]/90 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

        {/* Jika diklik, kembali ke beranda lembaga tersebut (misal: /mts), bukan ke Portal Yayasan (/) */}
        <Link to={`/${kode_lembaga}`} className="flex items-center gap-3">
          <img src={navData.logo} alt="Logo" className="w-10 h-10 object-contain bg-white/10 rounded-full p-0.5" />
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">{navData.text}</h1>
            <p className="text-xs text-green-200">YAPIDA Cilongok</p>
          </div>
        </Link>

        {/* Tombol ke Portal Pusat Yayasan */}
        <div className="flex gap-4 items-center">
          <Link to="/" className="text-white text-xs font-semibold hover:text-emerald-400 hidden sm:block">
            ← Kembali ke Home
          </Link>
          <Link to="/admin/login" className="bg-yellow-400 hover:bg-yellow-500 text-black px-5 py-2 rounded-lg text-sm font-semibold transition shadow">
            Admin Panel
          </Link>
        </div>
      </div>
    </nav>
  );
}