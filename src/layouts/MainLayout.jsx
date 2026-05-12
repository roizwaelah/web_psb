import { useEffect, useState } from "react";
import { Outlet, useLocation, Link, useParams } from "react-router-dom"; // <-- Tambahkan useParams
import Navbar from "../components/Navbar";
import FloatingWA from "../components/FloatingWA.jsx";
import api from "@/services/api";

export default function MainLayout() {
  const location = useLocation();
  const { kode_lembaga } = useParams(); // <-- Tangkap lembaga
  
  // Deteksi rute pendaftaran secara dinamis
  const isPendaftaran = location.pathname === `/${kode_lembaga}/daftar`;

  const [footerData, setFooterData] = useState({
    about: "Sistem Penerimaan Santri Baru berbasis digital yang modern, transparan dan profesional.",
    contact: {
      address: "Cilongok, Banyumas",
      phone: "0812-3456-7890",
      email: "info@darussalam.sch.id"
    },
    copyright: `© ${new Date().getFullYear()} Yayasan Darussalam`
  });

  useEffect(() => {
    // Tarik data footer sesuai lembaga
    api.get(`/public/home?lembaga=${kode_lembaga}`)
      .then((res) => {
        const fetchedData = res.data?.data; // Ambil object data utama
        if (fetchedData) {
          setFooterData({
            about: fetchedData.footer?.about || footerData.about,
            contact: {
              address: fetchedData.kontak?.alamat || footerData.contact.address,
              phone: fetchedData.kontak?.telepon || footerData.contact.phone,
              email: fetchedData.kontak?.email || footerData.contact.email
            },
            copyright: fetchedData.footer?.copyright || footerData.copyright
          });
        }
      })
      .catch((err) => console.error("Gagal memuat data footer:", err));
  }, [kode_lembaga]);

  return (
    <div className="relative font-sans bg-gray-50 text-gray-800 flex flex-col min-h-screen overflow-x-hidden">
      <div className="absolute inset-0 opacity-5 bg-[url('/pattern.png')] bg-repeat pointer-events-none"></div>

      {/* Teruskan kode_lembaga ke Navbar */}
      <Navbar kode_lembaga={kode_lembaga} />

      <main className="grow pt-20 relative z-10 flex flex-col">
        <Outlet />
      </main>

      <FloatingWA />

      {!isPendaftaran && (
        <footer className="bg-[#0f3f26] text-white mt-auto relative z-20">
          <div className="max-w-7xl mx-auto px-6 py-14 grid md:grid-cols-3 gap-10">
            <div>
              <h2 className="text-xl font-bold mb-3 text-[#f4c430]">{kode_lembaga?.toUpperCase()} Darussalam</h2>
              <p className="text-sm text-green-100/80 leading-relaxed">{footerData.about}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">Informasi Kontak</h3>
              <ul className="space-y-3 text-sm text-green-100/80">
                <li className="flex items-start gap-3"><span className="text-[#f4c430]">🏪</span> <span>{footerData.contact.alamat || footerData.contact.address}</span></li>
                <li className="flex items-center gap-3"><span className="text-[#f4c430]">📞</span> <span>{footerData.contact.telepon || footerData.contact.phone}</span></li>
                <li className="flex items-center gap-3"><span className="text-[#f4c430]">✉️</span> <span>{footerData.contact.email}</span></li>
              </ul>
            </div>
            <div className="flex flex-col justify-center items-start md:items-end">
              {/* Tombol daftar di footer dinamis sesuai lembaga */}
              <Link to={`/${kode_lembaga}/daftar`} className="inline-block bg-[#f4c430] text-[#0f3f26] px-8 py-3.5 rounded-xl text-sm font-bold hover:bg-yellow-500 transition shadow transform hover:-translate-y-1">
                Daftar Sekarang
              </Link>
            </div>
          </div>
          <div className="border-t border-green-800/50 text-center py-5 text-xs text-green-300/60 font-medium tracking-wide">
            {footerData.copyright}
          </div>
        </footer>
      )}
    </div>
  );
}