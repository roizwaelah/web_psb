import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/services/api";
import { useToast } from "@/context/ToastContext";
import { useModal } from "@/context/ModalContext";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Data admin yang sedang login
  const [currentAdmin, setCurrentAdmin] = useState(null);

  // State Modal Form (Ditambahkan state lembaga_id)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, nama_lengkap: "", username: "", password: "", role: "validator", lembaga_id: "" });

  const { showToast } = useToast();
  const { openModal } = useModal();

  useEffect(() => {
    // Tarik data admin yang login dari localStorage
    const adminData = localStorage.getItem("admin_data");
    if (adminData) {
      setCurrentAdmin(JSON.parse(adminData));
    }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data.data);
    } catch (error) {
      showToast({ type: "error", title: "Error", description: "Gagal memuat data pengguna." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({ id: null, nama_lengkap: "", username: "", password: "", role: "validator", lembaga_id: "" });
    setIsFormOpen(true);
  };

  const handleEdit = (user) => {
    // API lama mungkin belum mengembalikan lembaga_id ke tabel, jadi kita fallback ke string kosong
    setFormData({ id: user.id, nama_lengkap: user.nama_lengkap, username: user.username, password: "", role: user.role, lembaga_id: "" });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    // Filter payload agar jika lembaga_id kosong, dikirim sebagai null
    const payload = {
      ...formData,
      lembaga_id: formData.lembaga_id === "" ? null : formData.lembaga_id
    };

    try {
      if (formData.id) {
        await api.put(`/admin/users/${formData.id}`, payload);
        showToast({ type: "success", title: "Diperbarui", description: "Data pengguna berhasil diupdate." });
      } else {
        await api.post("/admin/users", payload);
        showToast({ type: "success", title: "Ditambahkan", description: "Pengguna baru berhasil dibuat." });
      }
      setIsFormOpen(false);
      fetchUsers();
    } catch (error) {
      showToast({ type: "error", title: "Gagal", description: error.response?.data?.message || "Terjadi kesalahan." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id, nama) => {
    openModal({
      title: "Hapus Pengguna?",
      content: `Anda yakin ingin mencabut akses dan menghapus akun "${nama}" secara permanen?`,
      confirmText: "Ya, Hapus Akses",
      isDanger: true,
      onConfirm: async () => {
        try {
          await api.delete(`/admin/users/${id}`);
          showToast({ type: "success", title: "Terhapus", description: "Pengguna berhasil dihapus." });
          fetchUsers();
        } catch (error) {
          showToast({ type: "error", title: "Gagal", description: error.response?.data?.message || "Gagal menghapus pengguna." });
        }
      }
    });
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 border-l-4 sm:border-l-[5px] border-teal-500 pl-3">
            Manajemen Pengguna
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 sm:mt-1.5 ml-4">
            Kelola akses Admin Utama dan Verifikator sistem.
          </p>
        </motion.div>
        <button onClick={handleAdd} className="w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-teal-500/30">
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Tambah Pengguna
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] sm:text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="p-3 sm:p-4 font-semibold w-10 sm:w-12 text-center whitespace-nowrap">No</th>
                <th className="p-3 sm:p-4 font-semibold whitespace-nowrap">Nama Lengkap</th>
                <th className="p-3 sm:p-4 font-semibold whitespace-nowrap">Username</th>
                <th className="p-3 sm:p-4 font-semibold whitespace-nowrap">Role Akses</th>
                <th className="p-3 sm:p-4 font-semibold text-center whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-[13px]">
              {isLoading ? (
                <tr><td colSpan="5" className="p-6 sm:p-8 text-center text-slate-500">Memuat data...</td></tr>
              ) : users.map((u, idx) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-3 sm:p-4 text-center text-slate-500">{idx + 1}</td>
                  <td className="p-3 sm:p-4 font-bold text-slate-800 whitespace-nowrap">{u.nama_lengkap}</td>
                  <td className="p-3 sm:p-4 font-mono text-slate-600 whitespace-nowrap">@{u.username}</td>
                  <td className="p-3 sm:p-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-bold uppercase rounded-full border ${u.role === 'admin' ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                      <button onClick={() => handleEdit(u)} className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-800 hover:text-white rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold transition">Edit</button>
                      <button onClick={() => handleDelete(u.id, u.nama_lengkap)} className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold transition">Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFormOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white w-full max-w-sm sm:max-w-md rounded-2xl shadow-2xl z-10 overflow-hidden relative">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-sm sm:text-base text-slate-800">{formData.id ? "Edit Pengguna" : "Tambah Pengguna Baru"}</h3>
                <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-red-500 transition p-1"><svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Nama Lengkap</label>
                  <input type="text" value={formData.nama_lengkap} onChange={(e) => setFormData({...formData, nama_lengkap: e.target.value})} required className="w-full p-2 sm:p-2.5 border rounded-lg sm:rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none text-xs sm:text-sm transition" />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Username (Untuk Login)</label>
                  <input type="text" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} required className="w-full p-2 sm:p-2.5 border rounded-lg sm:rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none text-xs sm:text-[13px] font-mono transition" />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                    Password {formData.id && <span className="text-slate-400 font-normal lowercase tracking-normal">(Kosongkan jika tak diubah)</span>}
                  </label>
                  <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required={!formData.id} placeholder="••••••••" className="w-full p-2 sm:p-2.5 border rounded-lg sm:rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none text-xs sm:text-sm transition" />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Hak Akses (Role)</label>
                    <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full p-2 sm:p-2.5 border rounded-lg sm:rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none text-xs sm:text-sm transition cursor-pointer">
                      <option value="validator">Validator</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  
                  {/* DROPDOWN LEMBAGA (HANYA MUNCUL JIKA SUPERADMIN) */}
                  {currentAdmin && currentAdmin.lembaga_id === null && (
                    <div>
                      <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Unit (Lembaga)</label>
                      <select value={formData.lembaga_id} onChange={(e) => setFormData({...formData, lembaga_id: e.target.value})} className="w-full p-2 sm:p-2.5 border border-amber-300 rounded-lg sm:rounded-xl bg-amber-50 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none text-xs sm:text-sm transition cursor-pointer font-semibold text-amber-900">
                        <option value="">Yayasan (Pusat)</option>
                        <option value="1">Pondok Pesantren</option>
                        <option value="2">MTs Darussalam</option>
                        <option value="3">MA Darussalam</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="pt-3 sm:pt-4 flex gap-2 sm:gap-3">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg sm:rounded-xl transition text-[11px] sm:text-sm">Batal</button>
                  <button type="submit" disabled={isSaving} className="flex-1 py-2 sm:py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg sm:rounded-xl transition text-[11px] sm:text-sm shadow-md disabled:opacity-50">
                    {isSaving ? "Menyimpan..." : "Simpan Data"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}