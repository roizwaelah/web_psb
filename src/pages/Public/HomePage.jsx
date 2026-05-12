import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useParams } from "react-router-dom";
import api from "@/services/api";

export default function HomePage() {
  const { kode_lembaga } = useParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setIsLoading(true);
        setErrorMsg(null);

        const res = await api.get(`/public/home?lembaga=${kode_lembaga}`);

        // Pastikan format dari server benar ada 'data'-nya
        if (res.data && res.data.data) {
          setData(res.data.data);
        } else {
          setErrorMsg("Format data dari server tidak sesuai.");
        }
      } catch (error) {
        console.error("Error API:", error);
        setErrorMsg(
          error.response?.data?.message ||
            "Gagal terhubung ke server Backend. Pastikan XAMPP/Laragon menyala.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeData();
  }, [kode_lembaga]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <svg
            className="animate-spin h-10 w-10 text-[#0e673b]"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-gray-500 font-medium animate-pulse">
            Memuat halaman...
          </p>
        </div>
      </div>
    );
  }

  // Jika Error (Bukan lagi loading abadi)
  if (errorMsg || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Gagal Memuat Data
          </h2>
          <p className="text-slate-600 text-sm mb-6">
            {errorMsg || "Data tidak ditemukan."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg font-bold"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* ================= HERO SECTION ================= */}
      <section
        className="relative h-screen flex items-center justify-center text-white text-center"
        style={{
          backgroundImage: `url(${data.hero_background})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10 px-6 max-w-4xl">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl font-bold uppercase leading-snug"
          >
            {data.hero_title}
          </motion.h1>
          <p className="mt-4 text-lg text-gray-200">{data.hero_subtitle}</p>
          <div className="mt-10 flex justify-center gap-4 flex-wrap">
            {/* PERUBAHAN: Link Daftar menjadi dinamis */}
            <Link
              to={`/${kode_lembaga}/daftar`}
              className="bg-[#f4c430] hover:bg-yellow-500 text-black font-bold px-8 py-3 rounded-full shadow-lg transition transform hover:-translate-y-1"
            >
              Daftar Sekarang
            </Link>
            {/* PERUBAHAN: Link Login menjadi dinamis */}
            <Link
              to={`/${kode_lembaga}/siswa/login`}
              className="bg-white/10 backdrop-blur-sm border-2 border-white hover:bg-white hover:text-[#0e673b] px-8 py-3 rounded-full font-bold transition transform hover:-translate-y-1"
            >
              Login Calon Santri
            </Link>
          </div>
        </div>
      </section>

      {/* ================= ALUR SECTION ================= */}
      <section className="bg-white py-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#0e673b]">
              {data.section_titles?.alur || "Alur Pendaftaran"}
            </h2>
            <div className="w-24 h-1 bg-[#f4c430] mx-auto mt-4 rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {data.steps?.map((step, i) => (
              <motion.div
                key={step.id}
                whileHover={{ y: -8 }}
                className="bg-gray-50 p-8 rounded-2xl border border-gray-100 shadow-sm text-center flex flex-col h-full"
              >
                <div className="w-14 h-14 bg-[#0e673b] text-white flex items-center justify-center rounded-full mx-auto mb-4 font-bold text-xl shadow-md shrink-0">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-gray-800 flex-1 flex items-center justify-center">
                  {step.title}
                </h3>
              </motion.div>
            ))}
          </div>

          {/* TAMBAHAN: Tombol Baca Panduan Selengkapnya */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="mt-12 text-center"
          >
            <Link
              to={`/${kode_lembaga}/alur`}
              className="inline-flex items-center gap-2 text-[#0e673b] font-bold text-lg hover:text-teal-700 transition group bg-teal-50 px-6 py-3 rounded-full border border-teal-100"
            >
              Baca Panduan Selengkapnya
              <svg
                className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ================= PERSYARATAN SECTION ================= */}
      <section className="py-20 bg-[#0e673b] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white">
              {data.section_titles?.persyaratan || "Syarat Pendaftaran"}
            </h2>
            <div className="w-24 h-1 bg-[#f4c430] mx-auto mt-4 rounded-full"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-10">
            {/* Dokumen */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border-l-[6px] border-[#0e673b]">
              <h3 className="font-bold text-xl mb-6 text-[#0e673b] flex items-center gap-2">
                <span>📄</span> Syarat Unggah Dokumen
              </h3>
              <ul className="space-y-4">
                {data.requirements
                  ?.filter((item) => item.type === "dokumen")
                  .map((item) => (
                    <li key={item.id} className="flex gap-3 text-gray-700">
                      <span className="text-green-600 font-bold">✓</span>{" "}
                      {item.content}
                    </li>
                  ))}
              </ul>
            </div>
            {/* Ketentuan */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border-l-[6px] border-[#f4c430]">
              <h3 className="font-bold text-xl mb-6 text-yellow-600 flex items-center gap-2">
                <span>📌</span> Ketentuan Umum
              </h3>
              <ul className="space-y-4">
                {data.requirements
                  ?.filter((item) => item.type === "ketentuan")
                  .map((item) => (
                    <li key={item.id} className="flex gap-3 text-gray-700">
                      <span className="text-[#f4c430] font-bold">✓</span>{" "}
                      {item.content}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ================= INFORMASI SECTION (Bg Putih) ================= */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#0e673b]">
              Pembiayaan & Lain-lain
            </h2>
            <div className="w-24 h-1 bg-[#f4c430] mx-auto mt-4 rounded-full"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {data.informations?.map((info) => {
              // Memecah teks deskripsi menjadi array poin (baris), mengabaikan baris yang kosong
              const descLines = info.description 
                ? String(info.description).split('\n').filter(line => line.trim() !== '') 
                : [];

              return (
                <div
                  key={info.id}
                  className="bg-slate-50 p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col"
                >
                  {/* Bagian Ikon & Judul diletakkan di tengah pada mobile, rata kiri di desktop */}
                  <div className="text-center md:text-left mb-6">
                    <div className="text-3xl sm:text-4xl mb-4 bg-white w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-2xl shadow-sm mx-auto md:mx-0 border border-slate-100">
                      {info.icon}
                    </div>
                    <h3 className="font-bold text-base sm:text-lg text-gray-800">
                      {info.title}
                    </h3>
                  </div>
                  
                  {/* Bagian Poin Deskripsi (Selalu rata kiri agar mudah dibaca) */}
                  <ul className="space-y-3 mt-auto flex-1">
                    {descLines.map((line, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        {/* Bullet point khusus menggunakan warna hijau khas */}
                        <div className="w-5 h-5 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0e673b]"></div>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed flex-1">
                          {line}
                        </p>
                      </li>
                    ))}
                  </ul>
                  
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
