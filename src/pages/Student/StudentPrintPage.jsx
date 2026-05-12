import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "@/services/api";
import { useToast } from "@/context/ToastContext";

export default function StudentPrintPage() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [printType, setPrintType] = useState(null); 
  const { showToast } = useToast();

  useEffect(() => {
    const fetchBiodata = async () => {
      try {
        const response = await api.get("/siswa/profile");
        setProfile(response.data.data);
      } catch (error) {
        if (error.response?.status !== 401) {
          showToast({ type: "error", title: "Gagal", description: "Tidak dapat memuat data." });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchBiodata();

    const handleAfterPrint = () => setPrintType(null);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, [showToast]);

  const handlePrint = (type) => {
    setPrintType(type);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 print:hidden">
        <svg className="animate-spin h-10 w-10 text-[#0e673b]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <p className="text-gray-500 font-medium">Memuat data cetak...</p>
      </div>
    );
  }

  if (!profile) return null;

  const today = new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' });
  
  // LOGIKA STATUS PENERIMAAN
  const status = profile.status_penerimaan || "Menunggu";
  const isDiterima = status === "Diterima";
  
  // NAMA LEMBAGA DINAMIS DARI DATABASE
  const namaLembaga = profile.nama_lembaga || "Yayasan Pendidikan IslamDarussalam";

  return (
    <>
      <div className={`max-w-5xl mx-auto p-6 space-y-8 py-10 ${printType ? 'hidden' : 'block'} print:hidden`}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold text-[#0e673b] border-l-[6px] border-[#f4c430] pl-4">
            Cetak Dokumen
          </h1>
          <p className="text-gray-500 text-sm mt-2 ml-5">
            Pilih dokumen yang ingin Anda cetak. Pastikan perangkat Anda terhubung dengan printer atau simpan sebagai PDF.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          
          {/* KARTU BUKTI PENDAFTARAN */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4-4m0 0l-4-4m4 4H3" /></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Kartu Bukti Pendaftaran</h3>
            <p className="text-sm text-gray-500 mb-6 px-4">Kartu ini wajib dibawa saat melakukan ujian seleksi dan wawancara di {namaLembaga}.</p>
            <button 
              onClick={() => handlePrint('kartu')}
              className="mt-auto w-full bg-[#0e673b] text-white py-3 rounded-xl font-bold hover:bg-[#0a4d2c] transition shadow-md flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Cetak Bukti Daftar
            </button>
          </motion.div>

          {/* SURAT KETERANGAN DITERIMA */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
            
            <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-4 relative z-10">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
            </div>
            
            <h3 className="text-lg font-bold text-gray-800 mb-2 relative z-10">Surat Keterangan Lulus</h3>
            
            <p className="text-sm text-gray-500 mb-6 px-4 relative z-10">
              {isDiterima 
                ? "Selamat! Anda telah dinyatakan lulus. Silakan cetak surat keterangan di bawah ini."
                : "Hanya bisa dicetak jika Anda telah dinyatakan DITERIMA pada pengumuman kelulusan."}
            </p>
            
            <button 
              onClick={() => isDiterima && handlePrint('surat')}
              disabled={!isDiterima}
              className={`mt-auto w-full py-3 rounded-xl font-bold transition shadow-md flex items-center justify-center gap-2 relative z-10 ${
                isDiterima 
                  ? "bg-yellow-500 text-white hover:bg-yellow-600 cursor-pointer" 
                  : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
              }`}
            >
              {isDiterima ? (
                 <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  Cetak SKL
                 </>
              ) : (
                 <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  Belum Tersedia
                 </>
              )}
            </button>
          </motion.div>

        </div>
      </div>

      {/* =========================================================================
          LAYOUT CETAK (HANYA TAMPIL SAAT PROSES PRINT - print:block)
          ========================================================================= */}
      
      {/* 1. LAYOUT KARTU BUKTI PENDAFTARAN */}
      {printType === 'kartu' && (
        <div className="hidden print:block w-full max-w-3xl mx-auto p-8 bg-white text-black text-sm">
          <div className="text-center border-b-4 border-double border-gray-800 pb-4 mb-6">
            <h2 className="font-bold text-2xl uppercase tracking-wider">Panitia Penerimaan Santri/Siswa Baru</h2>
            <h1 className="font-extrabold text-3xl text-[#0e673b] uppercase mt-1">{namaLembaga}</h1>
            <p className="mt-2 text-xs">Sekretariat: PP Darussalam Panusupan, Cilongok, Banyumas | Email: info@darussalam.sch.id</p>
          </div>

          <div className="text-center mb-8">
            <h3 className="font-bold text-xl underline uppercase">Kartu Bukti Pendaftaran</h3>
            <p className="mt-1 font-semibold">No. Reg: {profile.nomor_pendaftaran}</p>
          </div>

          <div className="flex justify-between items-start gap-8">
            <div className="flex-1 space-y-3">
              <div className="flex border-b border-gray-300 border-dotted pb-1">
                <span className="w-40 font-semibold">Nama Lengkap</span>
                <span className="uppercase">: {profile.nama_lengkap}</span>
              </div>
              <div className="flex border-b border-gray-300 border-dotted pb-1">
                <span className="w-40 font-semibold">NISN / NIK</span>
                <span>: {profile.nisn} / {profile.nik}</span>
              </div>
              <div className="flex border-b border-gray-300 border-dotted pb-1">
                <span className="w-40 font-semibold">TTL</span>
                <span>: {profile.tempat_lahir}, {profile.tanggal_lahir}</span>
              </div>
              <div className="flex border-b border-gray-300 border-dotted pb-1">
                <span className="w-40 font-semibold">Asal Sekolah</span>
                <span className="uppercase">: {profile.asal_sekolah}</span>
              </div>
              <div className="flex border-b border-gray-300 border-dotted pb-1">
                <span className="w-40 font-semibold">Alamat Calon Santri</span>
                <span>: {profile.alamat_lengkap}</span>
              </div>
            </div>

            <div className="w-32 h-40 border-2 border-gray-800 flex items-center justify-center shrink-0">
              <span className="text-gray-400 font-semibold text-center">Pas Foto<br/>3 x 4</span>
            </div>
          </div>

          <div className="mt-12">
            <p className="mb-4">Perhatian:</p>
            <ul className="list-disc pl-5 space-y-1 mb-12">
              <li>Kartu ini wajib dicetak dan dibawa saat ujian masuk / wawancara.</li>
              <li>Harap membawa dokumen persyaratan asli untuk ditunjukkan kepada panitia.</li>
              <li>Berpakaian rapi dan sopan (menutup aurat) saat berada di lingkungan {namaLembaga}.</li>
            </ul>

            <div className="flex justify-between text-center px-10">
              <div>
                <p>Tanda Tangan Pendaftar</p>
                <div className="h-20"></div>
                <p className="font-bold underline uppercase">{profile.nama_lengkap}</p>
              </div>
              <div>
                <p>Panitia Pendaftaran</p>
                <div className="h-20"></div>
                <p className="font-bold underline uppercase">( ........................................ )</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. LAYOUT SURAT KELULUSAN */}
      {printType === 'surat' && (
        <div className="hidden print:block w-full max-w-4xl mx-auto p-12 bg-white text-black text-base leading-relaxed">
          <div className="text-center border-b-4 border-gray-900 pb-5 mb-8">
            <h2 className="font-bold text-2xl uppercase tracking-wider">Yayasan Pendidikan Islam Darussalam</h2>
            <h1 className="font-extrabold text-3xl uppercase mt-1">{namaLembaga}</h1>
            <p className="mt-2 text-sm">Sekretariat: PP Darussalam Panusupan, Cilongok, Banyumas | Email: info@darussalam.sch.id</p>
          </div>

          <div className="text-center mb-10">
            <h3 className="font-bold text-xl underline uppercase">Surat Keterangan Diterima</h3>
            <p className="mt-1">Nomor: 0{profile.id}/SKL-PSB.PMBM/{profile.kode_lembaga?.toUpperCase() || 'YYS'}/{new Date().getFullYear()}</p>
          </div>

          <p className="mb-6">Yang bertanda tangan di bawah ini, Kepala {namaLembaga} menerangkan bahwa:</p>

          <table className="w-full mb-6 ml-8">
            <tbody>
              <tr><td className="w-48 py-2 font-semibold">Nama Lengkap</td><td>: <strong>{profile.nama_lengkap}</strong></td></tr>
              <tr><td className="py-2 font-semibold">Nomor Pendaftaran</td><td>: {profile.nomor_pendaftaran}</td></tr>
              <tr><td className="py-2 font-semibold">NISN</td><td>: {profile.nisn}</td></tr>
              <tr><td className="py-2 font-semibold">Asal Sekolah</td><td>: {profile.asal_sekolah}</td></tr>
              <tr><td className="py-2 font-semibold align-top">Nama Wali</td><td className="align-top">: {profile.orang_tua?.ayah?.nama || profile.orang_tua?.wali?.nama || "-"}</td></tr>
            </tbody>
          </table>

          <p className="mb-6 text-justify">
            Berdasarkan hasil seleksi dan keputusan dewan asatidz/guru Panitia Penerimaan Santri Baru (PSB) atau Penerimaan Murid Baru Madrasah (PMBM) Tahun Ajaran {new Date().getFullYear()}/{new Date().getFullYear() + 1}, maka pendaftar tersebut di atas dinyatakan:
          </p>

          <div className="text-center my-10 py-4 border-2 border-black">
            <h2 className="font-extrabold text-4xl tracking-widest uppercase">L u l u s / D i t e r i m a</h2>
          </div>

          <p className="mb-10 text-justify">
            Demikian surat keterangan ini dibuat agar dapat digunakan sebagaimana mestinya untuk memproses daftar ulang. Harap segera melengkapi administrasi daftar ulang sebelum batas waktu yang telah ditentukan.
          </p>

          <div className="flex justify-end text-center">
            <div>
              <p>Ditetapkan di: Banyumas</p>
              <p>Pada Tanggal: {today}</p>
              <p className="font-bold mt-2">Panitia PSB/PMBM {namaLembaga},</p>
              <div className="h-28 flex items-center justify-center">
                <span className="text-gray-300 italic text-sm">Cap & Tanda Tangan</span>
              </div>
              <p className="font-bold underline uppercase">........................................</p>
              <p>NIP/NIY. ........................................</p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          @page { margin: 0 0 0 0; size: F4; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
          header, aside, nav, footer, button { display: none !important; }
        }
      `}</style>
    </>
  );
}