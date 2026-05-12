import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "@/services/api";
import { useToast } from "@/context/ToastContext";
import { useModal } from "@/context/ModalContext";

// Komponen Badge Khusus Pembayaran
const PaymentBadge = ({ status }) => {
  const isLunas = status === "Lunas";
  return (
    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border inline-flex items-center gap-1.5 uppercase tracking-wider ${
      isLunas ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isLunas ? "bg-green-500" : "bg-red-500"}`}></span>
      {isLunas ? "LUNAS" : "BELUM LUNAS"}
    </span>
  );
};

export default function AdminPembayaranPage() {
  const [pendaftar, setPendaftar] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");

  const { showToast } = useToast();
  const { openModal } = useModal();

  const adminData = JSON.parse(localStorage.getItem("admin_data") || "{}");
  const isSuperadmin = adminData?.lembaga_id === null;

  const fetchList = async () => {
    try {
      // Kita membonceng endpoint validasi list karena isinya data santri lengkap
      const response = await api.get("/admin/validasi/list");
      setPendaftar(response.data.data);
      setFilteredData(response.data.data);
    } catch (error) {
      showToast({ type: "error", title: "Error", description: "Gagal memuat data pembayaran." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  // Logika Pencarian & Filter
  useEffect(() => {
    let result = pendaftar;
    if (statusFilter !== "Semua") {
      // Jika statusnya null atau kosong dari database, anggap "Belum Bayar"
      result = result.filter(item => {
        const currentStatus = item.status_pembayaran || "Belum Bayar";
        return currentStatus === statusFilter;
      });
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.nama_lengkap.toLowerCase().includes(q) || 
        item.nomor_pendaftaran.toLowerCase().includes(q)
      );
    }
    setFilteredData(result);
  }, [searchQuery, statusFilter, pendaftar]);

  const toggleStatus = (id, currentStatus, nama) => {
    const isLunas = currentStatus === "Lunas";
    const newStatus = isLunas ? "Belum Bayar" : "Lunas";
    const actionText = isLunas ? "Membatalkan lunas" : "Mengonfirmasi lunas";

    openModal({
      title: "Konfirmasi Pembayaran",
      content: `Anda akan mengubah status pembayaran ${nama} menjadi "${newStatus}". Apakah Anda sudah mengecek bukti transfer di WhatsApp?`,
      confirmText: isLunas ? "Ya, Batalkan" : "Ya, Konfirmasi Lunas",
      isDanger: isLunas,
      onConfirm: async () => {
        try {
          await api.put(`/admin/pembayaran/${id}/status`, { status_pembayaran: newStatus });
          showToast({ type: "success", title: "Berhasil", description: `Status pembayaran diubah menjadi ${newStatus}.` });
          fetchList(); 
        } catch (error) {
          showToast({ type: "error", title: "Gagal", description: "Terjadi kesalahan saat menyimpan status." });
        }
      }
    });
  };

  return (
    <div className="space-y-5 pb-10">
      
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-bold text-slate-800 border-l-[5px] border-green-500 pl-3">
            Validasi Pembayaran
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 ml-4">
            Konfirmasi pembayaran pendaftaran untuk membuka akses panel santri.
          </p>
        </motion.div>
      </div>

      {/* FILTER & PENCARIAN */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <svg className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            placeholder="Cari nama atau no registrasi..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-green-500/20 outline-none text-sm transition"
          />
        </div>
        <div className="shrink-0 w-full sm:w-48">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-green-500/20 outline-none text-sm transition font-medium text-slate-700 cursor-pointer"
          >
            <option value="Semua">Semua Status</option>
            <option value="Lunas">Hanya Lunas</option>
            <option value="Belum Bayar">Belum Bayar</option>
          </select>
        </div>
      </motion.div>

      {/* TABEL DATA */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="p-4 font-semibold w-12 text-center">No</th>
                {isSuperadmin && <th className="p-4 font-semibold">Unit</th>}
                <th className="p-4 font-semibold">No. Pendaftaran</th>
                <th className="p-4 font-semibold">Nama Lengkap</th>
                <th className="p-4 font-semibold text-center">Status Bayar</th>
                <th className="p-4 font-semibold text-center">Aksi Kasir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {isLoading ? (
                <tr><td colSpan={isSuperadmin ? "6" : "5"} className="p-8 text-center text-slate-500">Memuat data pembayaran...</td></tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((item, idx) => {
                  const status = item.status_pembayaran || "Belum Bayar";
                  const isLunas = status === "Lunas";
                  
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 text-center text-slate-500">{idx + 1}</td>
                      {isSuperadmin && (
                        <td className="p-4">
                          <span className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md text-[10px] font-bold uppercase">
                            {item.kode_lembaga || 'PONPES'}
                          </span>
                        </td>
                      )}
                      <td className="p-4 font-mono font-medium text-slate-600">{item.nomor_pendaftaran}</td>
                      <td className="p-4 font-bold text-slate-800">{item.nama_lengkap}</td>
                      <td className="p-4 text-center"><PaymentBadge status={status} /></td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => toggleStatus(item.id, status, item.nama_lengkap)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 mx-auto shadow-sm ${
                            isLunas 
                              ? "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100" 
                              : "bg-green-600 text-white hover:bg-green-700"
                          }`}
                        >
                          {isLunas ? (
                            <>Batalkan</>
                          ) : (
                            <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> Konfirmasi</>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isSuperadmin ? "6" : "5"} className="p-8 text-center text-slate-400">
                    Tidak ada data pendaftar yang cocok.
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