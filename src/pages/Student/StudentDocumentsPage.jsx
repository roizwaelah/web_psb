import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "@/services/api";
import { useToast } from "@/context/ToastContext";

// Daftar dokumen yang wajib diunggah
const documentRequirements = [
  { id: "pas_foto", title: "Pas Foto 3x4", desc: "Berwarna. Format JPG/PNG." },
  { id: "kartu_keluarga", title: "Kartu Keluarga (KK)", desc: "Scan dokumen asli. Format JPG/PNG/PDF." },
  { id: "akta_kelahiran", title: "Akta Kelahiran", desc: "Scan dokumen asli. Format JPG/PNG/PDF." },
  { id: "ijazah", title: "Ijazah / SKL", desc: "Scan dokumen asli. Format JPG/PNG/PDF." },
];

export default function StudentDocumentsPage() {
  const [documents, setDocuments] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await api.get("/siswa/dokumen");
      // Jadikan object agar mudah dipanggil { 'pas_foto': { ... }, 'ijazah': { ... } }
      const docMap = {};
      response.data.data.forEach((doc) => {
        docMap[doc.jenis_dokumen] = doc;
      });
      setDocuments(docMap);
    } catch (error) {
      if (error.response?.status !== 401) {
        showToast({ type: "error", title: "Gagal", description: "Tidak dapat memuat data dokumen." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e, jenis_dokumen) => {
    const file = e.target.files[0];
    if (!file) return;

    // Filter ukuran maksimal (2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast({ type: "error", title: "Ukuran Terlalu Besar", description: "Maksimal ukuran file adalah 2MB." });
      return;
    }

    const formData = new FormData();
    formData.append("jenis_dokumen", jenis_dokumen);
    formData.append("file", file);

    setUploadingDoc(jenis_dokumen);

    try {
      const response = await api.post("/siswa/dokumen", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      showToast({ type: "success", title: "Berhasil", description: response.data.message });
      
      // Update state untuk menampilkan file baru tanpa reload
      setDocuments((prev) => ({
        ...prev,
        [jenis_dokumen]: response.data.data,
      }));
    } catch (error) {
      showToast({ type: "error", title: "Gagal Mengunggah", description: error.response?.data?.message || "Kesalahan server." });
    } finally {
      setUploadingDoc(null);
      e.target.value = ""; // Reset input file
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <svg className="animate-spin h-10 w-10 text-[#0e673b]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <p className="text-gray-500 font-medium">Memuat data dokumen...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 py-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-[#0e673b] border-l-[6px] border-[#f4c430] pl-4">
          Unggah Dokumen Pendukung
        </h1>
        <p className="text-gray-500 text-sm mt-2 ml-5">
          Scan/foto dokumen harus terlihat jelas. Maksimal 2MB per file. 
          Mengunggah file baru akan menimpa file lama Anda.
        </p>
      </motion.div>

      <div className="grid gap-5">
        {documentRequirements.map((req, idx) => {
          const currentDoc = documents[req.id];
          const isUploaded = !!currentDoc;
          const isUploading = uploadingDoc === req.id;
          const isImage = currentDoc?.file_type?.includes("image");

          return (
            <motion.div 
              key={req.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`bg-white p-5 rounded-2xl border flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between shadow-sm transition-all ${
                isUploaded ? "border-green-200" : "border-gray-200"
              }`}
            >
              <div className="flex gap-4 items-center w-full sm:w-auto">
                
                {/* PREVIEW KECIL (FOTO/PDF/KOSONG) */}
                <div className="shrink-0 w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden relative group">
                  {isUploaded ? (
                    isImage ? (
                      <img src={currentDoc.file_url} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-red-500 flex flex-col items-center">
                        {/* Ikon PDF */}
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path></svg>
                        <span className="text-[9px] font-bold mt-0.5">PDF</span>
                      </div>
                    )
                  ) : (
                    <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  )}
                  
                  {/* Overlay klik untuk melihat ukuran besar */}
                  {isUploaded && (
                    <a href={currentDoc.file_url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </a>
                  )}
                </div>

                {/* INFO */}
                <div>
                  <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                    {req.title}
                    {isUploaded && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">Sudah Ada</span>}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-1">{req.desc}</p>
                </div>
              </div>

              {/* AKSI UPLOAD (Timpa / Pilih) */}
              <div className="w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                <label className={`relative flex items-center justify-center gap-2 px-5 py-2 rounded-xl font-semibold text-xs cursor-pointer transition-all shadow-sm w-full sm:w-auto ${
                  isUploading ? "bg-gray-100 text-gray-500 pointer-events-none" : "bg-gray-800 text-white hover:bg-gray-900"
                }`}>
                  {isUploading ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Loading...
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      {isUploaded ? "Update Dokumen" : "Pilih File"}
                    </>
                  )}
                  <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={(e) => handleFileChange(e, req.id)} disabled={isUploading} />
                </label>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}