import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "@/services/api";
import { useToast } from "@/context/ToastContext";
import { useModal } from "@/context/ModalContext";

// Import Library Export
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminPendaftarPage() {
  const [pendaftar, setPendaftar] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [viewMode, setViewMode] = useState("list");
  const [editData, setEditData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Deteksi Superadmin
  const adminData = JSON.parse(localStorage.getItem("admin_data") || "{}");
  const isSuperadmin = adminData?.lembaga_id === null;

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

  // Filter Search
  useEffect(() => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const filtered = pendaftar.filter(item => 
        item.nama_lengkap?.toLowerCase().includes(q) || 
        item.nisn?.toLowerCase().includes(q) || 
        item.nomor_pendaftaran?.toLowerCase().includes(q)
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(pendaftar);
    }
  }, [searchQuery, pendaftar]);

  // DELETE Santri
  const handleDelete = (id, nama) => {
    openModal({
      title: "Hapus Pendaftar?",
      content: `Apakah Anda yakin ingin menghapus seluruh data "${nama}"? Semua dokumen dan biodata terkait akan ikut terhapus permanen.`,
      confirmText: "Ya, Hapus Permanen",
      isDanger: true,
      onConfirm: async () => {
        try {
          await api.delete(`/admin/pendaftar/${id}`);
          showToast({ type: "success", title: "Terhapus", description: "Data pendaftar berhasil dihapus." });
          fetchList();
        } catch (error) {
          showToast({ type: "error", title: "Gagal", description: "Terjadi kesalahan saat menghapus data." });
        }
      }
    });
  };

  // =====================================================================
  // LOGIKA EDIT (Dipertahankan penuh seperti aslinya)
  // =====================================================================
  const openEdit = async (id) => {
    try {
      const res = await api.get(`/admin/validasi/${id}`);
      setEditData(res.data.data);
      setViewMode("edit");
    } catch (error) {
      showToast({ type: "error", title: "Error", description: "Gagal menarik detail data santri." });
    }
  };

  const handleInputChange = (e, section, parentSection = null) => {
    const { name, value } = e.target;
    if (parentSection === 'orang_tua') {
      setEditData(prev => ({
        ...prev,
        orang_tua: {
          ...prev.orang_tua,
          [section]: { ...(prev.orang_tua?.[section] || {}), [name]: value }
        }
      }));
    } else {
      setEditData(prev => ({ ...prev, [name]: value }));
    }
  };

  const saveEdit = async () => {
    setIsSaving(true);
    try {
      await api.put(`/admin/pendaftar/${editData.id}`, editData);
      showToast({ type: "success", title: "Berhasil", description: "Data pendaftar berhasil diperbarui." });
      setViewMode("list");
      fetchList();
    } catch (error) {
      showToast({ type: "error", title: "Gagal", description: "Terjadi kesalahan saat menyimpan data." });
    } finally {
      setIsSaving(false);
    }
  };

  // =====================================================================
  // FUNGSI EXPORT (Kode Baru)
  // =====================================================================
  const handleExportExcel = () => {
    setIsExporting(true);
    setTimeout(() => {
      const exportData = filteredData.map((item, index) => ({
        "No": index + 1,
        "No. Registrasi": item.nomor_pendaftaran,
        ...(isSuperadmin && { "Unit Lembaga": item.kode_lembaga || 'PONPES' }),
        "Nama Lengkap": item.nama_lengkap,
        "NISN": item.nisn,
        "Asal Sekolah": item.asal_sekolah,
        "Status": item.status_penerimaan || "Menunggu"
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Pendaftar");
      XLSX.writeFile(workbook, `Data_Pendaftar_PSB_${new Date().getFullYear()}.xlsx`);
      
      setIsExporting(false);
      showToast({ type: "success", title: "Export Selesai", description: "File Excel berhasil diunduh." });
    }, 500);
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      const doc = new jsPDF("landscape");
      
      doc.setFontSize(14);
      doc.text("DATA CALON SANTRI BARU", 14, 15);
      doc.setFontSize(10);
      doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')}`, 14, 22);

      // Siapkan kolom tabel
      const tableColumn = ["No", "No. Reg"];
      if (isSuperadmin) tableColumn.push("Unit");
      tableColumn.push("Nama Lengkap", "NISN", "Asal Sekolah", "Status");

      const tableRows = [];

      filteredData.forEach((item, index) => {
        const rowData = [
          index + 1,
          item.nomor_pendaftaran
        ];
        
        if (isSuperadmin) rowData.push(item.kode_lembaga || 'PONPES');

        rowData.push(
          item.nama_lengkap,
          item.nisn,
          item.asal_sekolah,
          item.status_penerimaan || "Menunggu"
        );
        tableRows.push(rowData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 28,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [14, 103, 59] } // Warna Hijau Teal Yayasan
      });

      doc.save(`Data_Pendaftar_PSB_${new Date().getFullYear()}.pdf`);
      setIsExporting(false);
      showToast({ type: "success", title: "Export Selesai", description: "File PDF berhasil diunduh." });
    }, 500);
  };

  // =====================================================================
  // RENDER TAMPILAN: EDIT MODE (Dipertahankan penuh)
  // =====================================================================
  if (viewMode === "edit" && editData) {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 sm:space-y-5 pb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 gap-3 sm:gap-4 sticky top-14 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setViewMode("list")} className="p-2 sm:p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg sm:rounded-xl transition flex items-center gap-1.5 sm:gap-2 font-semibold text-xs sm:text-sm">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> Kembali
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-800 flex items-center flex-wrap">
                Edit Data: {editData.nama_lengkap}
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 font-mono mt-0.5">
                No. Pendaftaran: {editData.nomor_pendaftaran}
                {isSuperadmin && (
                  <span className="ml-2 text-indigo-600 font-bold uppercase">
                    ({editData.kode_lembaga || 'PONPES'})
                  </span>
                )}
              </p>
            </div>
          </div>
          <button onClick={saveEdit} disabled={isSaving} className="px-4 py-2 sm:px-5 sm:py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm rounded-lg sm:rounded-xl transition shadow-md disabled:opacity-50 w-full sm:w-auto">
            {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>

        {/* Form Biodata */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="font-bold text-slate-800 mb-3 sm:mb-4 border-b pb-2 text-sm sm:text-base">A. Data Pribadi Santri</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-[11px] sm:text-xs">
            <div><label className="block mb-1 text-slate-500 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">Nama Lengkap</label><input type="text" name="nama_lengkap" value={editData.nama_lengkap || ""} onChange={(e) => handleInputChange(e)} className="w-full p-2 sm:p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition" /></div>
            <div><label className="block mb-1 text-slate-500 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">NISN</label><input type="text" name="nisn" value={editData.nisn || ""} onChange={(e) => handleInputChange(e)} className="w-full p-2 sm:p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition" /></div>
            <div><label className="block mb-1 text-slate-500 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">NIK</label><input type="text" name="nik" value={editData.nik || ""} onChange={(e) => handleInputChange(e)} className="w-full p-2 sm:p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition" /></div>
            <div><label className="block mb-1 text-slate-500 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">Tempat Lahir</label><input type="text" name="tempat_lahir" value={editData.tempat_lahir || ""} onChange={(e) => handleInputChange(e)} className="w-full p-2 sm:p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition" /></div>
            <div><label className="block mb-1 text-slate-500 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">Tanggal Lahir</label><input type="date" name="tanggal_lahir" value={editData.tanggal_lahir || ""} onChange={(e) => handleInputChange(e)} className="w-full p-2 sm:p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition" /></div>
            <div><label className="block mb-1 text-slate-500 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">Jenis Kelamin</label>
              <select name="jenis_kelamin" value={editData.jenis_kelamin || ""} onChange={(e) => handleInputChange(e)} className="w-full p-2 sm:p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition cursor-pointer">
                <option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option>
              </select>
            </div>
            <div><label className="block mb-1 text-slate-500 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">Asal Sekolah</label><input type="text" name="asal_sekolah" value={editData.asal_sekolah || ""} onChange={(e) => handleInputChange(e)} className="w-full p-2 sm:p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition" /></div>
            <div className="sm:col-span-2"><label className="block mb-1 text-slate-500 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">Alamat Lengkap</label><textarea name="alamat_lengkap" rows="2" value={editData.alamat_lengkap || ""} onChange={(e) => handleInputChange(e)} className="w-full p-2 sm:p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition resize-none" /></div>
          </div>
        </div>

        {/* Form Ortu */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
          {['ayah', 'ibu', 'wali'].map(ortu => (
            <div key={ortu} className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="font-bold text-slate-800 mb-3 sm:mb-4 border-b pb-2 uppercase tracking-wide text-[11px] sm:text-xs">{ortu === 'wali' ? 'C. Data Wali' : `B. Data ${ortu}`}</h2>
              <div className="space-y-2 sm:space-y-3 text-[11px] sm:text-xs">
                {ortu !== 'wali' && (
                  <div>
                    <label className="block mb-1 text-slate-500 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">Status</label>
                    <select name="status_hidup" value={editData.orang_tua?.[ortu]?.status_hidup || ""} onChange={(e) => handleInputChange(e, ortu, 'orang_tua')} className="w-full p-1.5 sm:p-2 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition cursor-pointer">
                      <option value="">-- Pilih --</option><option value="Masih Hidup">Masih Hidup</option><option value="Meninggal">Meninggal</option>
                    </select>
                  </div>
                )}
                <div><label className="block mb-1 text-slate-500 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">Nama Lengkap</label><input type="text" name="nama" value={editData.orang_tua?.[ortu]?.nama || ""} onChange={(e) => handleInputChange(e, ortu, 'orang_tua')} className="w-full p-1.5 sm:p-2 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition" /></div>
                <div><label className="block mb-1 text-slate-500 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">NIK</label><input type="text" name="nik" value={editData.orang_tua?.[ortu]?.nik || ""} onChange={(e) => handleInputChange(e, ortu, 'orang_tua')} className="w-full p-1.5 sm:p-2 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition" /></div>
                <div><label className="block mb-1 text-slate-500 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">Nomor WhatsApp</label><input type="text" name="wa" value={editData.orang_tua?.[ortu]?.wa || ""} onChange={(e) => handleInputChange(e, ortu, 'orang_tua')} className="w-full p-1.5 sm:p-2 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition" /></div>
                <div><label className="block mb-1 text-slate-500 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">Pekerjaan</label><input type="text" name="pekerjaan" value={editData.orang_tua?.[ortu]?.pekerjaan || ""} onChange={(e) => handleInputChange(e, ortu, 'orang_tua')} className="w-full p-1.5 sm:p-2 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition" /></div>
                <div><label className="block mb-1 text-slate-500 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">Penghasilan / Bulan</label><input type="text" name="penghasilan" value={editData.orang_tua?.[ortu]?.penghasilan || ""} onChange={(e) => handleInputChange(e, ortu, 'orang_tua')} className="w-full p-1.5 sm:p-2 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition" /></div>
                <div><label className="block mb-1 text-slate-500 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">Alamat</label><textarea name="alamat" rows="2" value={editData.orang_tua?.[ortu]?.alamat || ""} onChange={(e) => handleInputChange(e, ortu, 'orang_tua')} className="w-full p-1.5 sm:p-2 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition resize-none" /></div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // =====================================================================
  // RENDER TAMPILAN: LIST DATA (Kode Baru)
  // =====================================================================
  return (
    <div className="space-y-4 sm:space-y-5 pb-10">
      
      {/* Header & Tools */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4 sm:mb-5">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 border-l-4 sm:border-l-[5px] border-teal-500 pl-3">
            Database Pendaftar
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 sm:mt-1.5 ml-4">
            Kelola, edit, dan unduh rekapitulasi data calon santri.
          </p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full lg:w-auto">
          {/* Pencarian */}
          <div className="relative w-full sm:w-64 shrink-0">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Cari nama atau NISN..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 sm:py-2.5 text-xs sm:text-sm border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white shadow-sm"
            />
          </div>

          {/* Tombol Export */}
          <div className="flex gap-2">
            <button 
              onClick={handleExportExcel}
              disabled={isExporting || filteredData.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition shadow-sm disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Excel
            </button>
            <button 
              onClick={handleExportPDF}
              disabled={isExporting || filteredData.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition shadow-sm disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4-4m0 0l-4-4m4 4H3" /></svg>
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Tabel */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] sm:text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="p-3 sm:p-4 font-semibold w-10 sm:w-12 text-center">No</th>
                {isSuperadmin && <th className="p-3 sm:p-4 font-semibold">Unit</th>}
                <th className="p-3 sm:p-4 font-semibold">No. Reg / NISN</th>
                <th className="p-3 sm:p-4 font-semibold">Nama Lengkap</th>
                <th className="p-3 sm:p-4 font-semibold">Tempat, Tgl Lahir</th>
                <th className="p-3 sm:p-4 font-semibold text-center">Aksi (Edit Detail)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-[13px]">
              {isLoading ? (
                <tr>
                  <td colSpan={isSuperadmin ? "6" : "5"} className="p-6 sm:p-8 text-center text-slate-500">Memuat database...</td>
                </tr>
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
                    <td className="p-3 sm:p-4 font-mono font-medium text-slate-600">
                      <div>{item.nomor_pendaftaran}</div>
                      <div className="text-[10px] sm:text-[11px] text-slate-400">NISN: {item.nisn}</div>
                    </td>
                    <td className="p-3 sm:p-4 font-bold text-slate-800 whitespace-nowrap">{item.nama_lengkap}</td>
                    <td className="p-3 sm:p-4 text-slate-600 whitespace-nowrap">{item.tempat_lahir}, {item.tanggal_lahir}</td>
                    <td className="p-3 sm:p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                        {/* Diubah agar memanggil API detail sebelum pindah viewMode */}
                        <button onClick={() => openEdit(item.id)} className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold transition flex items-center gap-1">
                          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg> Edit
                        </button>
                        <button onClick={() => handleDelete(item.id, item.nama_lengkap)} className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold transition flex items-center gap-1">
                          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isSuperadmin ? "6" : "5"} className="p-6 sm:p-8 text-center text-xs sm:text-sm text-slate-400">Tidak ada data pendaftar.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}