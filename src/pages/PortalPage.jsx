import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function PortalPage() {
  const lembagaList = [
    {
      id: "ponpes",
      nama: "Pondok Pesantren",
      jenjang: "Salaf & Modern",
      desc: "Pendalaman ilmu agama, tahfidz Al-Qur'an, dan pembentukan karakter akhlakul karimah.",
      accent: "teal",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 21v-4m22 4v-4M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16M9 21v-4a2 2 0 012-2h2a2 2 0 012 2v4M9 11h6M9 15h6M9 7h6" />
        </svg>
      )
    },
    {
      id: "mts",
      nama: "MTs Darussalam",
      jenjang: "Menengah Pertama",
      desc: "Pendidikan formal tingkat menengah pertama dengan perpaduan kurikulum nasional.",
      accent: "indigo",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      id: "ma",
      nama: "MA Darussalam",
      jenjang: "Menengah Atas",
      desc: "Mencetak generasi intelektual muslim yang siap menghadapi perkembangan zaman.",
      accent: "orange",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      )
    }
  ];

  const colors = {
    teal: "group-hover:border-teal-500/50 bg-teal-500",
    indigo: "group-hover:border-indigo-500/50 bg-indigo-500",
    orange: "group-hover:border-orange-500/50 bg-orange-500"
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-center py-10 px-4 relative overflow-hidden font-sans">
      
      {/* Abstract Background - More Subtle */}
      <div className="absolute top-0 inset-x-0 h-[40vh] bg-slate-900 rounded-b-[3rem] shadow-2xl overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,#2dd4bf,transparent)]"></div>
      </div>
      
      <div className="relative z-10 max-w-5xl mx-auto w-full">
        {/* Header - Reduced Scale & More Elegant */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="w-20 h-20 mx-auto p-1.5 shadow-2xl mb-2">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain brightness-110" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
            Yayasan Pendidikan Islam Darussalam Cilongok
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Portal Penerimaan Santri dan Siswa Baru Terpadu <br className="hidden sm:block"/> 
            Tahun Ajaran 2026/2027
          </p>
        </motion.div>

        {/* Pilihan Lembaga - Reduced Max Width & Gap */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {lembagaList.map((lembaga, index) => (
            <motion.div
              key={lembaga.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={`group relative flex flex-col h-full bg-white rounded-2xl border border-yellow-300 transition-all duration-500 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] ${colors[lembaga.accent]} hover:border-opacity-100 overflow-hidden`}>
                <div className="p-5 flex flex-col h-full bg-white">
                  {/* Icon & Title */}
                  <h2 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-slate-900 transition-colors">
                    {lembaga.nama}
                  </h2>
                  <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider italic">
                    {lembaga.jenjang}
                  </p>
                  
                  <p className="text-[13px] text-slate-500 leading-relaxed mb-2 flex-1">
                    {lembaga.desc}
                  </p>
                  
                  {/* Tombol Aksi Terpisah */}
                  <div className="flex items-center gap-2 mt-auto pt-1 border-t border-slate-100">
                    <Link 
                      to={`/${lembaga.id}`}
                      className="flex-1 flex justify-center items-center py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 text-[11px] sm:text-xs font-bold rounded-xl transition-colors border border-slate-200"
                    >
                      Daftar
                    </Link>
                  </div>
                  <p className="text-[13px] text-slate-700 leading-relaxed mt-2 mb-2 flex-1">
                    Sudah mendaftar? silahkan klik
                  </p>
                  <div>
                    <Link 
                      to={`/${lembaga.id}/siswa/login`}
                      className="flex-1 flex justify-center items-center gap-1.5 py-2.5 bg-[#0e673b] hover:bg-green-700 text-white text-[11px] sm:text-xs font-bold rounded-xl transition-colors shadow-sm"
                    >
                      Masuk Calon Santri
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>

                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}