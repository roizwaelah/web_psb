import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/services/api";
import { useToast } from "@/context/ToastContext";
import { useModal } from "@/context/ModalContext";

export default function AdminPengumumanPage() {
  const [pengumuman, setPengumuman] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { showToast } = useToast();
  const { openModal } = useModal();
  const navigate = useNavigate();

  // Deteksi Admin yang sedang login
  const adminData = JSON.parse(localStorage.getItem("admin_data") || "{}");
  
  // State untuk memilih lembaga mana yang mau diubah pengumumannya (Khusus Superadmin)
  const [selectedKode, setSelectedKode] = useState(adminData?.kode_lembaga || "ponpes");
  const [selectedLembagaId, setSelectedLembagaId] = useState(adminData?.lembaga_id || 1);

  useEffect(() => {
    if (!["admin", "superadmin"].includes(adminData?.role)) {
      showToast({ type: "error", title: "Akses Ditolak", description: "Menu pengumuman hanya untuk Administrator." });
      navigate("/admin/dashboard", { replace: true });
    }
  }, [adminData?.role, navigate, showToast]);

  // Tarik data pengumuman dinamis berdasarkan lembaga yang dipilih
  useEffect(() => {
    const fetchPengumuman = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/public/home?lembaga=${selectedKode}`);
        // Asumsi data pengumuman disimpan di web_settings dengan key "pengumuman_santri"
        if (res.data?.data?.pengumuman_santri) {
          setPengumuman(res.data.data.pengumuman_santri);
        } else {
          setPengumuman(""); // Kosongkan jika belum ada di database
        }
      } catch (error) {
        showToast({
          type: "error",
          title: "Error",
          description: "Gagal menarik data pengumuman saat ini.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPengumuman();
  }, [selectedKode, showToast]);

  const handleSave = () => {
    openModal({
      title: `Siarkan ke ${selectedKode.toUpperCase()}?`,
      content: pengumuman
        ? `Pengumuman ini akan langsung muncul di halaman Dashboard seluruh Calon Santri jalur ${selectedKode.toUpperCase()}. Lanjutkan?`
        : `Anda mengosongkan teks. Ini akan MENGHAPUS kotak pengumuman dari Dashboard Santri jalur ${selectedKode.toUpperCase()}. Lanjutkan?`,
      confirmText: pengumuman ? "Ya, Siarkan" : "Ya, Sembunyikan",
      onConfirm: async () => {
        setIsSaving(true);
        try {
          // Kirim payload dengan format array settings seperti di AdminSettingsPage
          // Kita memanfaatkan fungsi upsert yang sama kuatnya di backend
          await api.put("/admin/pengumuman", { 
            lembaga_id: selectedLembagaId,
            settings: {
              pengumuman_santri: pengumuman
            } 
          });
          showToast({
            type: "success",
            title: "Berhasil",
            description: "Pengumuman berhasil disiarkan.",
          });
        } catch (error) {
          showToast({
            type: "error",
            title: "Gagal",
            description: "Terjadi kesalahan saat menyimpan pengumuman.",
          });
        } finally {
          setIsSaving(false);
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <svg className="animate-spin h-8 w-8 text-amber-500 mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <p className="text-sm text-slate-500 font-medium">Memuat data pengumuman...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 border-l-4 sm:border-l-[5px] border-amber-500 pl-3">
            Pengumuman Santri
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 sm:mt-1.5 ml-4">
            Kirimkan informasi penting, jadwal tes, atau peringatan massal ke dashboard santri.
          </p>
        </motion.div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2.5 sm:px-5 sm:py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm rounded-lg sm:rounded-xl transition shadow-lg shadow-amber-500/30 flex items-center gap-1.5 sm:gap-2 disabled:opacity-50 w-full sm:w-auto justify-center"
        >
          {isSaving ? "Menyimpan..." : (
            <><svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg> Siarkan</>
          )}
        </button>
      </div>

      {/* DROPDOWN PEMILIHAN WEB (HANYA MUNCUL UNTUK SUPERADMIN YAYASAN) */}
      {adminData?.lembaga_id === null && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 shadow-sm mb-4">
          <label className="text-amber-900 font-bold text-sm flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
            Tujuan Penyiaran:
          </label>
          <select 
            value={selectedKode}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedKode(val);
              setSelectedLembagaId(val === 'ponpes' ? 1 : val === 'mts' ? 2 : 3);
            }}
            className="w-full sm:w-64 p-2.5 border border-amber-300 rounded-xl outline-none font-bold text-sm bg-white text-amber-900 focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="ponpes">Pendaftar Pondok Pesantren</option>
            <option value="mts">Pendaftar MTs Darussalam</option>
            <option value="ma">Pendaftar MA Darussalam</option>
          </select>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-4 sm:p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-amber-50 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

        <div className="relative z-10">
          <label className="flex items-center gap-2 text-[11px] sm:text-xs font-bold text-slate-700 mb-2 sm:mb-3">
            Kotak Pesan Siaran
            <span className="text-[9px] sm:text-[10px] font-normal text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">Kosongkan untuk menghapus banner</span>
          </label>
          <textarea
            rows="6"
            value={pengumuman}
            onChange={(e) => setPengumuman(e.target.value)}
            placeholder="Ketik pengumuman di sini... (Contoh: Pengumuman kelulusan akan diumumkan pada tanggal 20 April 2026. Mohon melengkapi dokumen...)"
            className="w-full p-3 sm:p-4 border border-slate-300 rounded-xl sm:rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-xs sm:text-sm text-slate-700 transition resize-y leading-relaxed"
          />
        </div>

        {/* Live Preview (Simulasi UI Santri) */}
        <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-slate-100 relative z-10">
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 sm:mb-4">
            Pratinjau di Layar Santri ({selectedKode.toUpperCase()}):
          </p>
          {pengumuman ? (
            <div className="bg-linear-to-r from-amber-500 to-orange-500 p-0.5 sm:p-1 rounded-xl opacity-90 grayscale-20 pointer-events-none">
              <div className="bg-amber-50/95 p-3 sm:p-4 rounded-lg flex items-start gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0 text-amber-600">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                </div>
                <div>
                  <h3 className="text-[10px] sm:text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-0.5 sm:mb-1">
                    Informasi Penting Panitia
                  </h3>
                  <p className="text-xs sm:text-[13px] text-amber-900 font-medium whitespace-pre-wrap leading-relaxed">
                    {pengumuman}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-300 p-4 sm:p-5 rounded-xl text-center text-slate-400 text-xs sm:text-sm font-medium">
              Tidak ada pengumuman yang ditampilkan.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
