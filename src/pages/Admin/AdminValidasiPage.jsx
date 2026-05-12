import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "@/services/api";
import { useToast } from "@/context/ToastContext";
import { useModal } from "@/context/ModalContext";

// Komponen Badge Status
const StatusBadge = ({ status }) => {
  const colors = {
    "Diterima": "bg-green-100 text-green-700 border-green-200",
    "Ditolak": "bg-red-100 text-red-700 border-red-200",
    "Proses Seleksi": "bg-blue-100 text-blue-700 border-blue-200",
    "Menunggu": "bg-amber-100 text-amber-700 border-amber-200"
  };
  const colorClass = colors[status] || colors["Menunggu"];
  return (
    <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-bold rounded-full border ${colorClass} uppercase tracking-wider inline-flex items-center gap-1 sm:gap-1.5`}>
      <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${colorClass.replace('bg-', 'bg-').replace('100', '500')}`}></span>
      {status}
    </span>
  );
};

export default function AdminValidasiPage() {
  const [pendaftar, setPendaftar] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Deteksi Superadmin
  const adminData = JSON.parse(localStorage.getItem("admin_data") || "{}");
  const isSuperadmin = adminData?.lembaga_id === null;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");

  const [viewMode, setViewMode] = useState("list"); 
  const [selectedId, setSelectedId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  const { showToast } = useToast();
  const { openModal } = useModal();

  const fetchList = async () => {
    try {
      const response = await api.get("/admin/validasi/list");
      setPendaftar(response.data.data);
      setFilteredData(response.data.data);
    } catch (error) {
      showToast({ type: "error", title: "Gagal memuat", description: "Tidak dapat menarik daftar pendaftar." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  useEffect(() => {
    let result = pendaftar;
    if (statusFilter !== "Semua") {
      result = result.filter(item => item.status_penerimaan === statusFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.nama_lengkap.toLowerCase().includes(q) || 
        item.nomor_pendaftaran.toLowerCase().includes(q) ||
        item.asal_sekolah.toLowerCase().includes(q)
      );
    }
    setFilteredData(result);
  }, [searchQuery, statusFilter, pendaftar]);

  const openDetail = async (id) => {
    setSelectedId(id);
    setViewMode("detail");
    setIsDetailLoading(true);
    try {
      const res = await api.get(`/admin/validasi/${id}`);
      setDetailData(res.data.data);
      // PERBAIKAN: Langsung tembak ke status_penerimaan (tanpa .santri)
      setNewStatus(res.data.data?.status_penerimaan || "Menunggu");
    } catch (error) {
      showToast({ type: "error", title: "Error", description: "Gagal menarik detail santri." });
      setViewMode("list");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setViewMode("list");
    setSelectedId(null);
    setDetailData(null);
  };

  const handleUpdateStatus = () => {
    openModal({
      title: "Konfirmasi Perubahan Status",
      content: `Anda akan mengubah status pendaftaran menjadi "${newStatus}". Apakah Anda yakin?`,
      confirmText: "Ya, Simpan",
      onConfirm: async () => {
        try {
          await api.put(`/admin/validasi/${selectedId}/status`, { status: newStatus });
          showToast({ type: "success", title: "Berhasil", description: "Status penerimaan diperbarui." });
          fetchList(); 
          // PERBAIKAN: Langsung update status_penerimaan di akar object
          setDetailData(prev => ({ 
            ...prev, 
            status_penerimaan: newStatus 
          }));
        } catch (error) {
          showToast({ type: "error", title: "Gagal", description: "Terjadi kesalahan saat menyimpan." });
        }
      }
    });
  };

  // =====================================================================
  // RENDER: TAMPILAN DETAIL SANTRI (FULL PAGE)
  // =====================================================================
  if (viewMode === "detail") {
    // PERBAIKAN: santri langsung mengambil dari detailData (bukan detailData.santri)
    const santri = detailData || {};
    const ortu = detailData?.orang_tua || {};
    const dokumenObj = detailData?.dokumen || {}; 

    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 sm:space-y-5">
        
        <div className="flex items-center justify-between bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <button onClick={closeDetail} className="p-2 sm:p-2.5 bg-slate-200 hover:bg-yellow-200 text-slate-600 rounded-lg sm:rounded-xl transition flex items-center gap-1.5 sm:gap-2 font-semibold text-xs sm:text-sm">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> Kembali
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-800">Detail Validasi Santri</h1>
              {detailData && (
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-mono mt-0.5">
                  No. Pendaftaran: {santri.nomor_pendaftaran} 
                  {isSuperadmin && <span className="ml-2 text-indigo-600 font-bold uppercase">({santri.kode_lembaga || 'PONPES'})</span>}
                </p>
              )}
            </div>
          </div>
        </div>

        {isDetailLoading || !detailData ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 bg-white rounded-2xl border border-slate-200">
            <svg className="animate-spin h-8 w-8 sm:h-10 sm:w-10 mb-3 sm:mb-4 text-teal-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <span className="text-xs sm:text-sm text-slate-500 font-medium">Menarik detail data santri...</span>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
            
            <div className="lg:col-span-2 space-y-4 sm:space-y-5">
              
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                <div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-bold tracking-wider uppercase mb-1 sm:mb-1.5">Status Saat Ini</p>
                  <StatusBadge status={santri.status_penerimaan} />
                </div>
                <div className="sm:text-right">
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-bold uppercase mb-1">No. Pendaftaran</p>
                  <p className="font-mono text-base sm:text-lg font-bold text-slate-800 bg-slate-100 px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg inline-block border border-slate-200">
                    {santri.nomor_pendaftaran}
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-sm sm:text-base text-slate-800 mb-4 sm:mb-5 flex items-center gap-1.5 sm:gap-2 border-b border-slate-100 pb-2.5 sm:pb-3">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> Informasi Biodata Diri
                </h3>
                <div className="grid sm:grid-cols-2 gap-y-3 sm:gap-y-4 gap-x-5 sm:gap-x-6 text-[11px] sm:text-xs">
                  <div><p className="text-[10px] text-slate-400 mb-0.5 font-semibold uppercase tracking-wide">Nama Lengkap</p><p className="font-bold text-slate-800 text-[13px] sm:text-sm">{santri.nama_lengkap}</p></div>
                  <div><p className="text-[10px] text-slate-400 mb-0.5 font-semibold uppercase tracking-wide">NISN / NIK</p><p className="font-semibold text-slate-800">{santri.nisn} / {santri.nik}</p></div>
                  <div><p className="text-[10px] text-slate-400 mb-0.5 font-semibold uppercase tracking-wide">Tempat, Tanggal Lahir</p><p className="font-semibold text-slate-800">{santri.tempat_lahir}, {santri.tanggal_lahir}</p></div>
                  <div><p className="text-[10px] text-slate-400 mb-0.5 font-semibold uppercase tracking-wide">Jenis Kelamin</p><p className="font-semibold text-slate-800">{santri.jenis_kelamin}</p></div>
                  <div><p className="text-[10px] text-slate-400 mb-0.5 font-semibold uppercase tracking-wide">Asal Sekolah</p><p className="font-semibold text-slate-800">{santri.asal_sekolah}</p></div>
                  <div className="sm:col-span-2"><p className="text-[10px] text-slate-400 mb-0.5 font-semibold uppercase tracking-wide">Alamat Lengkap</p><p className="font-semibold text-slate-800 bg-slate-50 p-2 sm:p-2.5 rounded-lg border border-slate-100">{santri.alamat_lengkap}</p></div>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-sm sm:text-base text-slate-800 mb-4 sm:mb-5 flex items-center gap-1.5 sm:gap-2 border-b border-slate-100 pb-2.5 sm:pb-3">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> Data Orang Tua / Wali
                </h3>
                <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 text-[11px] sm:text-xs">
                  <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200">
                    <p className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 mb-2 sm:mb-2.5 uppercase tracking-wider">Ayah Kandung</p>
                    <p className="font-bold text-slate-800 mb-1">{ortu.ayah?.nama || "-"}</p>
                    <p className="text-[10px] sm:text-[11px] text-slate-600 font-medium">Status: {ortu.ayah?.status_hidup || "-"}</p>
                    <p className="text-[10px] sm:text-[11px] text-slate-600 font-medium mt-0.5">WA: {ortu.ayah?.wa || "-"}</p>
                  </div>
                  <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200">
                    <p className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 mb-2 sm:mb-2.5 uppercase tracking-wider">Ibu Kandung</p>
                    <p className="font-bold text-slate-800 mb-1">{ortu.ibu?.nama || "-"}</p>
                    <p className="text-[10px] sm:text-[11px] text-slate-600 font-medium">Status: {ortu.ibu?.status_hidup || "-"}</p>
                    <p className="text-[10px] sm:text-[11px] text-slate-600 font-medium mt-0.5">WA: {ortu.ibu?.wa || "-"}</p>
                  </div>
                </div>
              </div>

            </div>

            <div className="space-y-4 sm:space-y-5">
              
              <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl shadow-lg border border-slate-800 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 sm:w-28 sm:h-28 bg-teal-500/20 blur-3xl rounded-full"></div>
                <h3 className="font-bold text-sm sm:text-base mb-1.5 sm:mb-2 relative z-10 flex items-center gap-1.5 sm:gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  Tindakan Validasi
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mb-3 sm:mb-4 relative z-10 leading-relaxed">Ubah status penerimaan santri di sini setelah berkas diperiksa.</p>
                <div className="space-y-3 relative z-10">
                  <select 
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2.5 sm:px-3 sm:py-3 rounded-xl border border-slate-700 bg-slate-800 focus:bg-slate-700 focus:ring-2 focus:ring-teal-500 outline-none text-xs sm:text-[13px] font-semibold text-white transition cursor-pointer"
                  >
                    <option value="Menunggu">⏳ Menunggu (Belum Lengkap)</option>
                    <option value="Proses Seleksi">📝 Proses Seleksi (Berkas Sesuai)</option>
                    <option value="Diterima">✅ Diterima (Lulus)</option>
                    <option value="Ditolak">❌ Ditolak (Tidak Lulus)</option>
                  </select>
                  <button 
                    onClick={handleUpdateStatus}
                    disabled={newStatus === santri.status_penerimaan}
                    className="w-full py-2.5 sm:py-3 bg-linear-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-bold text-[13px] sm:text-sm rounded-xl transition shadow-lg shadow-teal-500/30 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-sm sm:text-base text-slate-800 mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2 border-b border-slate-100 pb-2.5 sm:pb-3">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  Dokumen Lampiran
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {["pas_foto", "kartu_keluarga", "akta_kelahiran", "ijazah"].map(doc_key => {
                    const doc = dokumenObj[doc_key]; 
                    const label = doc_key.replace(/_/g, " ").toUpperCase();
                    
                    return (
                      <div key={doc_key} className="border border-slate-200 rounded-xl overflow-hidden flex flex-col group">
                        <div className="h-20 sm:h-24 bg-slate-50 flex items-center justify-center relative">
                          {doc ? (
                            doc.file_type && doc.file_type.includes("image") ? (
                              <img src={doc.file_url} alt={label} className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-red-500 flex flex-col items-center">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 mb-0.5 sm:mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="text-[10px] sm:text-xs font-bold">PDF</span>
                              </div>
                            )
                          ) : (
                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold text-center px-1">Belum Diunggah</span>
                          )}
                          
                          {doc && (
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white text-[10px] sm:text-xs font-bold gap-1 cursor-pointer">
                              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              Lihat Penuh
                            </a>
                          )}
                        </div>
                        <div className="p-1.5 sm:p-2 text-[9px] sm:text-[10px] font-bold text-center bg-white text-slate-600 truncate border-t border-slate-100">
                          {label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // =====================================================================
  // RENDER: TAMPILAN LIST (DEFAULT TABEL)
  // =====================================================================
  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 border-l-4 sm:border-l-[5px] border-teal-500 pl-3">
            Validasi Berkas & Status
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 sm:mt-1.5 ml-4">
            Periksa kelengkapan dokumen dan tentukan kelulusan santri.
          </p>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            placeholder="Cari nama, no registrasi, atau sekolah..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 outline-none text-xs sm:text-sm transition"
          />
        </div>
        <div className="shrink-0 w-full sm:w-auto">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-40 px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 outline-none text-xs sm:text-sm transition font-medium text-slate-700 cursor-pointer"
          >
            <option value="Semua">Semua Status</option>
            <option value="Menunggu">Menunggu</option>
            <option value="Proses Seleksi">Proses Seleksi</option>
            <option value="Diterima">Diterima</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] sm:text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="p-3 sm:p-4 font-semibold w-12 text-center whitespace-nowrap">No</th>
                {isSuperadmin && <th className="p-3 sm:p-4 font-semibold whitespace-nowrap">Unit</th>}
                <th className="p-3 sm:p-4 font-semibold whitespace-nowrap">No. Pendaftaran</th>
                <th className="p-3 sm:p-4 font-semibold whitespace-nowrap">Nama Lengkap</th>
                <th className="p-3 sm:p-4 font-semibold whitespace-nowrap">Asal Sekolah</th>
                <th className="p-3 sm:p-4 font-semibold text-center whitespace-nowrap">Status</th>
                <th className="p-3 sm:p-4 font-semibold text-center whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-[13px]">
              {isLoading ? (
                <tr><td colSpan={isSuperadmin ? "7" : "6"} className="p-6 text-center text-slate-500">Memuat data...</td></tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-3 sm:p-4 text-center text-slate-500">{idx + 1}</td>
                    {isSuperadmin && (
                      <td className="p-3 sm:p-4">
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md text-[10px] font-bold uppercase">
                          {item.kode_lembaga || 'PONPES'}
                        </span>
                      </td>
                    )}
                    <td className="p-3 sm:p-4 font-mono font-medium text-slate-600 whitespace-nowrap">{item.nomor_pendaftaran}</td>
                    <td className="p-3 sm:p-4 font-bold text-slate-800 whitespace-nowrap">{item.nama_lengkap}</td>
                    <td className="p-3 sm:p-4 text-slate-500 truncate max-w-[150px] sm:max-w-[200px]">{item.asal_sekolah}</td>
                    <td className="p-3 sm:p-4 text-center whitespace-nowrap"><StatusBadge status={item.status_penerimaan} /></td>
                    <td className="p-3 sm:p-4 text-center whitespace-nowrap">
                      <button 
                        onClick={() => openDetail(item.id)}
                        className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-slate-800 text-white hover:bg-slate-700 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold transition shadow-sm flex items-center gap-1.5 mx-auto"
                      >
                        Periksa 
                        <span className="text-teal-400">→</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isSuperadmin ? "7" : "6"} className="p-6 sm:p-8 text-center text-xs sm:text-sm text-slate-400">
                    Tidak ada data pendaftar yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

    </div>
  );
}