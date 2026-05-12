import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/services/api";
import { useToast } from "@/context/ToastContext";
import { useModal } from "@/context/ModalContext";

export default function AdminDokumenPage() {
  const [dokumen, setDokumen] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // State untuk navigasi File Explorer
  // Jika null = Tampilan Root (Folder), Jika ada data = Tampilan Isi Folder
  const [currentFolder, setCurrentFolder] = useState(null);

  const { showToast } = useToast();
  const { openModal } = useModal();

  const fetchDokumen = async () => {
    try {
      const response = await api.get("/admin/dokumen");
      setDokumen(response.data.data);
      
      // Jika sedang membuka sebuah folder, perbarui juga isi folder tersebut secara reaktif
      if (currentFolder) {
        const updatedFolderDocs = response.data.data.filter(d => d.santri_id === currentFolder.santri_id);
        // Jika semua file di dalam folder dihapus, otomatis kembali ke root
        if (updatedFolderDocs.length === 0) {
          setCurrentFolder(null);
        } else {
          setCurrentFolder({ ...currentFolder, dokumen: updatedFolderDocs });
        }
      }
    } catch (error) {
      showToast({ type: "error", title: "Error", description: "Gagal memuat data dokumen." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDokumen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =====================================================================
  // LOGIKA PENGELOMPOKKAN FOLDER
  // =====================================================================
  // Mengubah array flat menjadi array of object (Folders) berdasarkan santri_id
  const getFolders = () => {
    const grouped = dokumen.reduce((acc, doc) => {
      if (!acc[doc.santri_id]) {
        acc[doc.santri_id] = {
          santri_id: doc.santri_id,
          nama_lengkap: doc.nama_lengkap,
          nomor_pendaftaran: doc.nomor_pendaftaran,
          dokumen: []
        };
      }
      acc[doc.santri_id].dokumen.push(doc);
      return acc;
    }, {});

    let foldersArr = Object.values(grouped);

    // Filter pencarian folder berdasarkan nama/nomor pendaftaran
    if (searchQuery && !currentFolder) {
      const q = searchQuery.toLowerCase();
      foldersArr = foldersArr.filter(f => 
        f.nama_lengkap.toLowerCase().includes(q) || 
        f.nomor_pendaftaran.toLowerCase().includes(q)
      );
    }

    return foldersArr;
  };

  const folders = getFolders();

  // =====================================================================
  // LOGIKA HAPUS DOKUMEN
  // =====================================================================
  const handleDelete = (doc_id, jenis, nama_santri) => {
    openModal({
      title: "Hapus File Permanen?",
      content: `Anda yakin ingin menghapus file "${jenis.toUpperCase()}" milik "${nama_santri}"? File fisik di server akan terhapus selamanya.`,
      confirmText: "Ya, Hapus File",
      isDanger: true,
      onConfirm: async () => {
        try {
          await api.delete(`/admin/dokumen/${doc_id}`);
          showToast({ type: "success", title: "Terhapus", description: "Dokumen berhasil dihapus dari server." });
          fetchDokumen(); // Refresh data otomatis
        } catch (error) {
          showToast({ type: "error", title: "Gagal", description: "Terjadi kesalahan saat menghapus dokumen." });
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <svg className="animate-spin h-8 w-8 text-teal-500 mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <p className="text-sm text-slate-500 font-medium">Memuat File Explorer...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      
      {/* HEADER & PENCARIAN */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-1.5 sm:gap-2">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
            File Explorer
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5 sm:mt-1">Penyimpanan Dokumen Berkas Santri</p>
        </motion.div>

        {/* Search Bar (Hanya tampil di tampilan Root Folder) */}
        {!currentFolder && (
          <div className="relative w-full md:w-64">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Cari folder santri..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 outline-none text-xs sm:text-sm transition"
            />
          </div>
        )}
      </div>

      {/* BREADCRUMB NAVIGATION */}
      <div className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 text-xs sm:text-sm font-bold text-slate-500">
        <button 
          onClick={() => setCurrentFolder(null)} 
          className={`hover:text-teal-600 transition flex items-center gap-1 ${!currentFolder ? 'text-teal-600' : ''}`}
        >
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          Root (Semua Folder)
        </button>
        
        {currentFolder && (
          <>
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            <span className="text-slate-800 flex items-center gap-1 truncate max-w-[150px] sm:max-w-none">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
              <span className="truncate">{currentFolder.nama_lengkap}</span>
            </span>
          </>
        )}
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 min-h-[45vh]">
        <AnimatePresence mode="wait">
          
          {/* ================= TAMPILAN ROOT (DAFTAR FOLDER) ================= */}
          {!currentFolder ? (
            <motion.div 
              key="root-view"
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}
            >
              {folders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-slate-400">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /></svg>
                  <p className="text-xs sm:text-sm">Tidak ada folder dokumen yang ditemukan.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                  {folders.map(folder => (
                    <div 
                      key={folder.santri_id} 
                      onClick={() => setCurrentFolder(folder)}
                      className="group cursor-pointer flex flex-col items-center p-3 sm:p-4 rounded-xl sm:rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-center"
                    >
                      {/* Ikon Folder SVG */}
                      <div className="relative mb-2 sm:mb-3">
                        <svg className="w-14 h-14 sm:w-16 sm:h-16 text-teal-500/90 group-hover:text-teal-500 transition-colors drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                        {/* Badge jumlah file */}
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] sm:text-[10px] font-bold w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                          {folder.dokumen.length}
                        </div>
                      </div>
                      <span className="text-[11px] sm:text-[13px] font-bold text-slate-700 line-clamp-1 group-hover:text-teal-700 w-full" title={folder.nama_lengkap}>
                        {folder.nama_lengkap}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono mt-0.5">
                        {folder.nomor_pendaftaran}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) 
          
          : 

          /* ================= TAMPILAN DALAM FOLDER (DAFTAR FILE) ================= */
          (
            <motion.div 
              key="folder-view"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5 pb-3 sm:pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800 line-clamp-1">Isi Folder: {currentFolder.nama_lengkap}</h2>
                  <p className="text-[10px] sm:text-xs text-slate-500">Terdapat {currentFolder.dokumen.length} file di dalam direktori ini.</p>
                </div>
                <button 
                  onClick={() => setCurrentFolder(null)}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1.5 w-full sm:w-auto"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Tutup Folder
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {currentFolder.dokumen.map(file => {
                  const isImage = file.file_type.includes("image");
                  const label = file.jenis_dokumen.replace('_', ' ').toUpperCase();

                  return (
                    <div key={file.doc_id} className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl overflow-hidden group shadow-sm hover:shadow-md transition-all flex flex-col">
                      
                      {/* Area Preview File */}
                      <div className="h-24 sm:h-28 bg-slate-100 relative flex items-center justify-center overflow-hidden">
                        {isImage ? (
                          <img src={file.file_url} alt={label} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition duration-300 group-hover:scale-105" />
                        ) : (
                          <div className="flex flex-col items-center text-red-500/80 group-hover:text-red-500 transition">
                            <svg className="w-8 h-8 sm:w-10 sm:h-10 mb-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path></svg>
                            <span className="text-[10px] sm:text-xs font-bold tracking-widest">PDF DOC</span>
                          </div>
                        )}
                        {/* Overlay Tanggal */}
                        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-black/60 backdrop-blur-sm text-white text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded shadow-sm opacity-0 group-hover:opacity-100 transition">
                          {new Date(file.uploaded_at).toLocaleDateString("id-ID", {day: 'numeric', month: 'short'})}
                        </div>
                      </div>

                      {/* Area Informasi & Aksi */}
                      <div className="p-3 sm:p-4 flex flex-col flex-1 bg-white">
                        <p className="text-[11px] sm:text-xs font-bold text-teal-600 mb-0.5 sm:mb-1">{label}</p>
                        <p className="text-[9px] sm:text-[10px] text-slate-400 font-mono truncate mb-3 sm:mb-4" title={file.file_path}>
                          {file.file_path.split('/').pop()}
                        </p>
                        
                        <div className="mt-auto flex gap-1.5 sm:gap-2">
                          <a 
                            href={file.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-1 px-2 py-1.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold transition text-center flex items-center justify-center gap-1"
                          >
                            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            Buka
                          </a>
                          <button 
                            onClick={() => handleDelete(file.doc_id, file.jenis_dokumen, file.nama_lengkap)}
                            className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white rounded-md sm:rounded-lg transition"
                            title="Hapus File"
                          >
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}