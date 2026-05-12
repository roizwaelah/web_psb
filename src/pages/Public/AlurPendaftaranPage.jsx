import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/services/api";
import DOMPurify from "dompurify";

export default function AlurPendaftaranPage() {
  const { kode_lembaga } = useParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0); 
    const fetchData = async () => {
      try {
        const res = await api.get(`/public/home?lembaga=${kode_lembaga}`);
        setData(res.data.data);
      } catch (error) {
        console.error("Gagal memuat data alur:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [kode_lembaga]);

  if (isLoading || !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-[#0e673b]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      </div>
    );
  }

  // =========================================================================
  // PROSES SANITASI HTML (Mencegah XSS Attack)
  // DOMPurify akan membuang semua tag <script>, event (onclick, onload), dll.
  // =========================================================================
  const cleanHTML = DOMPurify.sanitize(data.alur_artikel || "");

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-4xl mx-auto w-full">
        
        {/* Tombol Kembali */}
        <Link 
          to={`/${kode_lembaga}`}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-[#0e673b] font-semibold mb-8 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Kembali ke Beranda
        </Link>

        {/* Kotak Artikel Utama */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 sm:p-12 rounded-3xl shadow-lg border border-slate-100 overflow-hidden relative w-full">
          
          {/* Aksen Warna */}
          <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-[#0e673b] to-[#f4c430]"></div>

          <div className="text-center mb-10 border-b border-slate-100 pb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 mb-4">
              Panduan & Alur Pendaftaran
            </h1>
            <p className="text-slate-500 font-medium">
              Lembaga: <span className="text-[#0e673b] font-bold uppercase">{data.lembaga?.nama || "Yayasan Darussalam"}</span>
            </p>
          </div>

          {/* RENDER HTML YANG SUDAH DISANITASI */}
          <div 
            className="editor-content text-slate-900 leading-relaxed w-full"
            dangerouslySetInnerHTML={{ __html: cleanHTML }}
          />
          
        </motion.div>

        {/* CTA Daftar */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="mt-12 text-center">
          <p className="text-slate-600 mb-6 font-medium">Sudah memahami alur pendaftarannya?</p>
          <Link 
            to={`/${kode_lembaga}/daftar`} 
            className="inline-flex items-center gap-2 bg-[#f4c430] hover:bg-yellow-500 text-black px-8 py-3.5 rounded-xl font-bold text-lg transition shadow-xl transform hover:-translate-y-1"
          >
            Mulai Pendaftaran
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </motion.div>

      </div>

      {/* CSS KUSTOM UNTUK MERAPIKAN HASIL RENDER TEXT EDITOR */}
      <style>{`
        /* RESET TOTAL UNTUK PARAGRAF NORMAL (PENCEGAH HURUF TERPOTONG) */
        .editor-content, .editor-content p, .editor-content li { 
           word-break: normal !important; 
           overflow-wrap: break-word !important; 
           white-space: normal !important;
        }

        .editor-content { max-width: 100%; }
        .editor-content .ql-align-center { text-align: center; }
        .editor-content .ql-align-right { text-align: right; }
        .editor-content .ql-align-justify { text-align: justify; }

        .editor-content .ql-font-serif { font-family: serif; }
        .editor-content .ql-font-monospace { font-family: monospace; }
        .editor-content .ql-direction-rtl { direction: rtl; text-align: inherit; }

        .editor-content h1 { font-size: 2.25rem; font-weight: 800; margin-top: 1.5rem; margin-bottom: 1rem; color: #1e293b; }
        .editor-content h2 { font-size: 1.875rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #0e673b; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.5rem; }
        .editor-content h3 { font-size: 1.5rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.5rem; color: #334155; }
        .editor-content p { margin-bottom: 1rem; font-size: 1rem; line-height: 1.8; }
        .editor-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.5rem; }
        .editor-content ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1.5rem; }
        .editor-content li { margin-bottom: 0.5rem; padding-left: 0.25rem; }
        
        .editor-content a { color: #0ea5e9; text-decoration: underline; word-break: break-all; }
        .editor-content a:hover { color: #0284c7; }
        
        .editor-content blockquote { border-left: 4px solid #cbd5e1; padding-left: 1rem; font-style: italic; color: #64748b; margin-top: 1rem; margin-bottom: 1rem; }
        .editor-content img { max-width: 100%; height: auto; border-radius: 0.75rem; margin: 1.5rem auto; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
      `}</style>
    </div>
  );
}