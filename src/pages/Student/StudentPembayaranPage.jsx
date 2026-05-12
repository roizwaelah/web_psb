import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "@/services/api";

// ======================================================================
// FUNGSI PINTAR: DETEKSI LOGO BANK OTOMATIS BERDASARKAN TEKS ADMIN
// ======================================================================
const getBankLogo = (bankName) => {
  if (!bankName) return null;
  const name = String(bankName).toLowerCase();
  
  if (name.includes("bsi") || name.includes("syariah indonesia")) 
    return "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Bank_Syariah_Indonesia.svg/1024px-Bank_Syariah_Indonesia.svg.png";
  if (name.includes("bri") || name.includes("rakyat indonesia")) 
    return "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/BRI_2020.svg/1024px-BRI_2020.svg.png";
  if (name.includes("bca") || name.includes("central asia")) 
    return "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Bank_Central_Asia.svg/1024px-Bank_Central_Asia.svg.png";
  if (name.includes("bni") || name.includes("negara indonesia")) 
    return "https://upload.wikimedia.org/wikipedia/id/thumb/5/55/BNI_logo.svg/1024px-BNI_logo.svg.png";
  if (name.includes("mandiri")) 
    return "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Logo_Bank_Mandiri_Baru.svg/1024px-Logo_Bank_Mandiri_Baru.svg.png";
  if (name.includes("muamalat")) 
    return "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Bank_Muamalat_logo.svg/1024px-Bank_Muamalat_logo.svg.png";
  if (name.includes("jateng")) 
    return "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Bank_Jateng_logo.svg/1024px-Bank_Jateng_logo.svg.png";
  if (name.includes("cimb") || name.includes("niaga")) 
    return "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Logo_CIMB_Niaga.svg/1024px-Logo_CIMB_Niaga.svg.png";
  
  // Jika nama bank tidak dikenali, kembalikan null (akan otomatis pakai teks tulisan)
  return null; 
};

export default function PembayaranPage() {
  const [santriData, setSantriData] = useState(null);
  const [adminWA, setAdminWA] = useState(""); 
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("siswa_data") || "{}");
    setSantriData(data);

    const fetchWebSettings = async () => {
      try {
        const res = await api.get(`/public/home?lembaga=${data.kode_lembaga || 'ponpes'}`);
        if (res.data?.data?.kontak?.whatsapp) {
          let wa = res.data.data.kontak.whatsapp;
          if (wa.startsWith("0")) wa = "62" + wa.substring(1);
          setAdminWA(wa);
        }
        setPaymentInfo(res.data?.data?.pembayaran);
      } catch (error) {
        console.error("Gagal menarik pengaturan web", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWebSettings();
  }, []);

  const handleKonfirmasiWA = () => {
    const pesan = `Halo Admin PSB, saya ingin mengonfirmasi pembayaran pendaftaran.\n\n*Nama:* ${santriData?.nama_lengkap}\n*No. Registrasi:* ${santriData?.nomor_pendaftaran}\n*Lembaga:* ${santriData?.kode_lembaga?.toUpperCase()}\n\nBerikut saya lampirkan foto bukti transfernya. Terima kasih.`;
    const urlWA = `https://api.whatsapp.com/send?phone=${adminWA}&text=${encodeURIComponent(pesan)}`;
    window.open(urlWA, "_blank");
  };

  if (isLoading || !santriData) {
    return <div className="flex justify-center items-center h-[60vh]"><span className="text-slate-500 font-medium">Memuat informasi pembayaran...</span></div>;
  }

  const isLunas = santriData.status_pembayaran === "Lunas";

  return (
    <div className="space-y-5 sm:space-y-6 max-w-4xl mx-auto pb-10">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 border-l-4 sm:border-l-[5px] border-amber-500 pl-3">Administrasi Pendaftaran</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 sm:mt-1.5 ml-4">Selesaikan pembayaran untuk membuka kunci pengunggahan dokumen.</p>
        </motion.div>
        
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl border flex items-center gap-2 font-bold text-xs sm:text-sm shadow-sm ${isLunas ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          <span className="relative flex h-3 w-3">
            {!isLunas && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isLunas ? 'bg-green-500' : 'bg-red-500'}`}></span>
          </span>
          {isLunas ? "PEMBAYARAN LUNAS" : "BELUM LUNAS"}
        </motion.div>
      </div>

      {isLunas ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-linear-to-br from-green-500 to-emerald-600 rounded-3xl p-8 sm:p-12 text-center text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm"><svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div>
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Alhamdulillah, Pembayaran Selesai!</h2>
          <p className="text-green-50 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">Terima kasih, pembayaran pendaftaran Anda telah berhasil dikonfirmasi. Akses dokumen dan cetak kartu pendaftaran kini sudah <strong className="text-white">TERBUKA</strong>.</p>
        </motion.div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-5 sm:gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-3 space-y-5">
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                Metode Pembayaran
              </h3>
              
              <div className="space-y-4">
                {/* RENDER BANK 1 DINAMIS DENGAN LOGO */}
                {paymentInfo?.bank1 && paymentInfo?.rek1 && (
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-amber-300 transition group">
                    <div className="w-16 h-10 sm:w-20 sm:h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center p-1.5 shrink-0 shadow-sm overflow-hidden">
                      {getBankLogo(paymentInfo.bank1) ? (
                        <img src={getBankLogo(paymentInfo.bank1)} alt={paymentInfo.bank1} className="w-full h-full object-contain" />
                      ) : (
                        <span className="font-extrabold text-slate-700 italic text-[10px] sm:text-xs truncate">{paymentInfo.bank1}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Transfer Bank Utama</p>
                      <p className="font-mono text-lg font-bold text-slate-800 tracking-wider">{paymentInfo.rek1}</p>
                      <p className="text-xs font-semibold text-slate-600 mt-1">a.n {paymentInfo.an1}</p>
                    </div>
                  </div>
                )}

                {/* RENDER BANK 2 DINAMIS DENGAN LOGO */}
                {paymentInfo?.bank2 && paymentInfo?.rek2 && (
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-amber-300 transition group">
                    <div className="w-16 h-10 sm:w-20 sm:h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center p-1.5 shrink-0 shadow-sm overflow-hidden">
                      {getBankLogo(paymentInfo.bank2) ? (
                        <img src={getBankLogo(paymentInfo.bank2)} alt={paymentInfo.bank2} className="w-full h-full object-contain" />
                      ) : (
                        <span className="font-extrabold text-slate-700 italic text-[10px] sm:text-xs truncate">{paymentInfo.bank2}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Transfer Bank Alternatif</p>
                      <p className="font-mono text-lg font-bold text-slate-800 tracking-wider">{paymentInfo.rek2}</p>
                      <p className="text-xs font-semibold text-slate-600 mt-1">a.n {paymentInfo.an2}</p>
                    </div>
                  </div>
                )}

                {/* RENDER QRIS DINAMIS */}
                {paymentInfo?.qris && (
                  <div className="mt-4 p-5 rounded-xl border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center hover:border-amber-400 transition">
                     <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Scan Barcode QRIS</p>
                     <div className="p-2 border border-slate-100 rounded-xl shadow-sm bg-white">
                        <img src={paymentInfo.qris} alt="QRIS Yayasan" className="w-40 h-40 object-contain rounded-lg" />
                     </div>
                  </div>
                )}

                {!paymentInfo?.bank1 && !paymentInfo?.qris && (
                  <div className="text-center p-6 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-sm text-slate-500">Informasi rekening pembayaran belum diatur oleh panitia.</p>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                <svg className="w-6 h-6 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-[11px] sm:text-xs text-amber-800 leading-relaxed font-medium">Pastikan Anda mentransfer sesuai nominal. Simpan struk/bukti transfer Anda karena akan dilampirkan ke WhatsApp panitia.</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2">
            <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl border border-slate-800 relative overflow-hidden h-full flex flex-col justify-center">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-500/20 rounded-full blur-3xl"></div>
              <div className="relative z-10 text-center space-y-4">
                <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/30">
                  <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.347-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg></div>
                <h3 className="text-base sm:text-lg font-bold">Kirim Bukti Transfer</h3>
                <p className="text-[11px] sm:text-xs text-slate-400 font-medium px-4 leading-relaxed">Sudah melakukan transfer? Klik tombol di bawah ini untuk mengirimkan foto struk pembayaran langsung ke WhatsApp Panitia.</p>
                <button onClick={handleKonfirmasiWA} className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-500/20 transition transform hover:-translate-y-1">Kirim ke WhatsApp</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
