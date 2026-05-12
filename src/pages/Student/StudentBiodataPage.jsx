import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "@/services/api";
import { useToast } from "@/context/ToastContext";

// Helper Component untuk View Mode
const InfoRow = ({ label, value }) => (
  <div className="py-3 border-b border-gray-100 last:border-0">
    <dt className="text-xs font-medium text-gray-500 mb-1">{label}</dt>
    <dd className="text-sm font-semibold text-gray-800">{value || "-"}</dd>
  </div>
);

// Helper Component untuk Edit Mode
const EditRow = ({ label, name, value, onChange, type = "text", disabled = false, options = [] }) => (
  <div className="py-2 border-b border-gray-100 last:border-0">
    <label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label>
    {type === "select" ? (
      <select name={name} value={value || ""} onChange={onChange} disabled={disabled} className="w-full p-2 text-sm border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0e673b]/20 outline-none">
        <option value="">-- Pilih --</option>
        {options.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
      </select>
    ) : type === "textarea" ? (
      <textarea name={name} value={value || ""} onChange={onChange} disabled={disabled} rows="2" className="w-full p-2 text-sm border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0e673b]/20 outline-none resize-none" />
    ) : (
      <input type={type} name={name} value={value || ""} onChange={onChange} disabled={disabled} className="w-full p-2 text-sm border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0e673b]/20 outline-none disabled:bg-gray-200 disabled:cursor-not-allowed" />
    )}
  </div>
);

export default function StudentBiodataPage() {
  const [profile, setProfile] = useState(null);
  const [editData, setEditData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const fetchBiodata = async () => {
    try {
      const response = await api.get("/siswa/profile");
      setProfile(response.data.data);
      setEditData(response.data.data); 
    } catch (error) {
      if (error.response?.status !== 401) {
        showToast({ type: "error", title: "Gagal", description: "Tidak dapat memuat data biodata." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBiodata();
  }, []);

  // Handler untuk Form Input (Santri)
  const handleSantriChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  // Handler untuk Form Input (Orang Tua / Wali)
  const handleOrtuChange = (tipe, e) => {
    setEditData({
      ...editData,
      orang_tua: {
        ...editData.orang_tua,
        [tipe]: {
          ...editData.orang_tua[tipe],
          [e.target.name]: e.target.value
        }
      }
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put("/siswa/profile", editData);
      showToast({ type: "success", title: "Berhasil", description: "Biodata telah diperbarui." });
      setProfile(editData); 
      setIsEditing(false); 
    } catch (error) {
      showToast({ type: "error", title: "Gagal Menyimpan", description: error.response?.data?.message || "Terjadi kesalahan server." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(profile); 
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <svg className="animate-spin h-10 w-10 text-[#0e673b]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <p className="text-gray-500 font-medium animate-pulse">Memuat Biodata Lengkap...</p>
      </div>
    );
  }

  if (!profile) return null;

  const ayah = isEditing ? editData.orang_tua?.ayah : profile.orang_tua?.ayah;
  const ibu = isEditing ? editData.orang_tua?.ibu : profile.orang_tua?.ibu;
  const wali = isEditing ? editData.orang_tua?.wali : profile.orang_tua?.wali;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 py-10">
      
      {/* Header & Tombol Aksi */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0e673b] border-l-[6px] border-[#f4c430] pl-4">
            Biodata Lengkap Santri
          </h1>
          <p className="text-gray-500 text-sm mt-2 ml-5">
            {isEditing ? "Silakan ubah data pada kolom di bawah ini." : "Pastikan seluruh data di bawah ini sudah sesuai."}
          </p>
        </div>
        
        <div>
          {isEditing ? (
            <div className="flex gap-3">
              <button onClick={handleCancel} disabled={isSaving} className="px-5 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition disabled:opacity-50">
                Batal
              </button>
              <button onClick={handleSave} disabled={isSaving} className="px-5 py-2 text-sm font-semibold text-white bg-[#0e673b] hover:bg-[#0a4d2c] rounded-xl transition flex items-center gap-2 shadow-lg disabled:opacity-70">
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          ) : (
            <button onClick={() => setIsEditing(true)} className="px-5 py-2 text-sm font-semibold text-white bg-yellow-500 hover:bg-yellow-600 rounded-xl transition flex items-center gap-2 shadow-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              Edit Biodata
            </button>
          )}
        </div>
      </motion.div>

      {/* ================= DATA PRIBADI SANTRI ================= */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-teal-50 border-b border-gray-100 px-6 py-4">
          <h2 className="font-bold text-teal-800">A. Data Pribadi Calon Santri</h2>
        </div>
        <div className="p-6 grid md:grid-cols-2 gap-x-12 gap-y-2">
          {isEditing ? (
            <>
              <EditRow label="Nomor Pendaftaran (Read-Only)" name="nomor_pendaftaran" value={editData.nomor_pendaftaran} disabled />
              <EditRow label="Nama Lengkap" name="nama_lengkap" value={editData.nama_lengkap} onChange={handleSantriChange} />
              <EditRow label="NISN (Read-Only)" name="nisn" value={editData.nisn} disabled />
              <EditRow label="NIK (Nomor Induk Kependudukan)" name="nik" value={editData.nik} onChange={handleSantriChange} />
              <EditRow label="Tempat Lahir" name="tempat_lahir" value={editData.tempat_lahir} onChange={handleSantriChange} />
              <EditRow label="Tanggal Lahir (Read-Only)" type="date" name="tanggal_lahir" value={editData.tanggal_lahir} disabled />
              <EditRow label="Jenis Kelamin" type="select" name="jenis_kelamin" value={editData.jenis_kelamin} onChange={handleSantriChange} options={["Laki-laki", "Perempuan"]} />
              <EditRow label="Agama" type="select" name="agama" value={editData.agama} onChange={handleSantriChange} options={["Islam", "Kristen", "Katolik", "Hindu", "Budha"]} />
              <EditRow label="Pendidikan Terakhir" type="select" name="pendidikan_terakhir" value={editData.pendidikan_terakhir} onChange={handleSantriChange} options={["SD/MI", "SMP/MTs", "SMA/MA"]} />
              <EditRow label="Asal Sekolah" name="asal_sekolah" value={editData.asal_sekolah} onChange={handleSantriChange} />
              <div className="md:col-span-2"><EditRow label="Alamat Lengkap" type="textarea" name="alamat_lengkap" value={editData.alamat_lengkap} onChange={handleSantriChange} /></div>
            </>
          ) : (
            <>
              <InfoRow label="Nomor Pendaftaran" value={profile.nomor_pendaftaran} />
              <InfoRow label="Nama Lengkap" value={profile.nama_lengkap} />
              <InfoRow label="NISN" value={profile.nisn} />
              <InfoRow label="NIK (Nomor Induk Kependudukan)" value={profile.nik} />
              <InfoRow label="Tempat, Tanggal Lahir" value={`${profile.tempat_lahir}, ${profile.tanggal_lahir}`} />
              <InfoRow label="Jenis Kelamin" value={profile.jenis_kelamin} />
              <InfoRow label="Agama" value={profile.agama} />
              <InfoRow label="Pendidikan Terakhir" value={profile.pendidikan_terakhir} />
              <InfoRow label="Asal Sekolah" value={profile.asal_sekolah} />
              <div className="md:col-span-2"><InfoRow label="Alamat Lengkap" value={profile.alamat_lengkap} /></div>
            </>
          )}
        </div>
      </section>

      {/* ================= DATA ORANG TUA ================= */}
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* AYAH */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-amber-50 border-b border-gray-100 px-6 py-4">
            <h2 className="font-bold text-amber-800">B. Data Ayah Kandung</h2>
          </div>
          <div className="p-6">
            {isEditing ? (
              <div className="space-y-1">
                <EditRow label="Status Hidup" type="select" name="status_hidup" value={ayah?.status_hidup} onChange={(e) => handleOrtuChange("ayah", e)} options={["Masih Hidup", "Meninggal"]} />
                {ayah?.status_hidup === "Masih Hidup" && (
                  <>
                    <InfoRow label="Nama Lengkap Ayah" value={ayah?.nama} onChange={(e) => handleOrtuChange("ayah", e)} />
                    <InfoRow label="NIK Ayah" value={ayah?.nik} onChange={(e) => handleOrtuChange("ayah", e)} />
                    <InfoRow label="Tempat, Tanggal Lahir" value={`${ayah?.tempat_lahir}, ${ayah?.tanggal_lahir}`} onChange={(e) => handleOrtuChange("ayah", e)} />
                    <InfoRow label="Pendidikan" value={ayah?.pendidikan} onChange={(e) => handleOrtuChange("ayah", e)} />
                    <InfoRow label="Pekerjaan" value={ayah?.pekerjaan} onChange={(e) => handleOrtuChange("ayah", e)} />
                    <InfoRow label="Penghasilan / Bulan" value={ayah?.penghasilan} onChange={(e) => handleOrtuChange("ayah", e)} />
                    <InfoRow label="Nomor WhatsApp" value={ayah?.wa} onChange={(e) => handleOrtuChange("ayah", e)} />
                    <InfoRow label="Domisili" value={ayah?.domisili} onChange={(e) => handleOrtuChange("ayah", e)} />
                    <InfoRow label="Status Kepemilikan Rumah" value={ayah?.status_rumah} onChange={(e) => handleOrtuChange("ayah", e)} />
                    <InfoRow label="Alamat Ayah" value={ayah?.alamat} onChange={(e) => handleOrtuChange("ayah", e)} />
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="mb-4 inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-700">Status: {ayah?.status_hidup || "Tidak Ada Data"}</div>
                {ayah?.status_hidup === "Masih Hidup" && (
                  <div className="space-y-1">
                    <InfoRow label="Nama Lengkap Ayah" value={ayah.nama} />
                    <InfoRow label="NIK Ayah" value={ayah.nik} />
                    <InfoRow label="Tempat, Tanggal Lahir" value={`${ayah.tempat_lahir}, ${ayah.tanggal_lahir}`} />
                    <InfoRow label="Pendidikan" value={ayah.pendidikan} />
                    <InfoRow label="Pekerjaan" value={ayah.pekerjaan} />
                    <InfoRow label="Penghasilan / Bulan" value={ayah.penghasilan} />
                    <InfoRow label="Nomor WhatsApp" value={ayah.wa} />
                    <InfoRow label="Domisili" value={ayah.domisili} />
                    <InfoRow label="Status Kepemilikan Rumah" value={ayah.status_rumah} />
                    <InfoRow label="Alamat Ayah" value={ayah.alamat} />
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* IBU */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-pink-50 border-b border-gray-100 px-6 py-4">
            <h2 className="font-bold text-pink-800">C. Data Ibu Kandung</h2>
          </div>
          <div className="p-6">
            {isEditing ? (
              <div className="space-y-1">
                <EditRow label="Status Hidup" type="select" name="status_hidup" value={ibu?.status_hidup} onChange={(e) => handleOrtuChange("ibu", e)} options={["Masih Hidup", "Meninggal"]} />
                {ibu?.status_hidup === "Masih Hidup" && (
                  <>
                    <EditRow label="Nama Lengkap Ibu" value={ibu?.nama} onChange={(e) => handleOrtuChange("ibu", e)} />
                    <EditRow label="NIK Ibu" value={ibu?.nik} onChange={(e) => handleOrtuChange("ibu", e)} />
                    <EditRow label="Tempat, Tanggal Lahir" value={`${ibu?.tempat_lahir}, ${ibu?.tanggal_lahir}`} onChange={(e) => handleOrtuChange("ibu", e)} />
                    <EditRow label="Pendidikan" value={ibu?.pendidikan} onChange={(e) => handleOrtuChange("ibu", e)} />
                    <EditRow label="Pekerjaan" value={ibu?.pekerjaan} onChange={(e) => handleOrtuChange("ibu", e)} />
                    <EditRow label="Penghasilan / Bulan" value={ibu?.penghasilan} onChange={(e) => handleOrtuChange("ibu", e)} />
                    <EditRow label="Nomor WhatsApp" value={ibu?.wa} onChange={(e) => handleOrtuChange("ibu", e)} />
                    <EditRow label="Domisili" value={ibu?.domisili} onChange={(e) => handleOrtuChange("ibu", e)} />
                    <EditRow label="Status Kepemilikan Rumah" value={ibu?.status_rumah} onChange={(e) => handleOrtuChange("ibu", e)} />
                    <EditRow label="Alamat Ibu" value={ibu?.alamat} onChange={(e) => handleOrtuChange("ibu", e)} />
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="mb-4 inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-700">Status: {ibu?.status_hidup || "Tidak Ada Data"}</div>
                {ibu?.status_hidup === "Masih Hidup" && (
                  <div className="space-y-1">
                    <InfoRow label="Nama Lengkap Ibu" value={ibu.nama} />
                    <InfoRow label="NIK Ibu" value={ibu.nik} />
                    <InfoRow label="Tempat, Tanggal Lahir" value={`${ibu.tempat_lahir}, ${ibu.tanggal_lahir}`} />
                    <InfoRow label="Pendidikan" value={ibu.pendidikan} />
                    <InfoRow label="Pekerjaan" value={ibu.pekerjaan} />
                    <InfoRow label="Penghasilan / Bulan" value={ibu.penghasilan} />
                    <InfoRow label="Nomor WhatsApp" value={ibu.wa} />
                    <InfoRow label="Domisili" value={ibu.domisili} />
                    <InfoRow label="Status Kepemilikan Rumah" value={ibu.status_rumah} />
                    <InfoRow label="Alamat Ibu" value={ibu.alamat} />
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      {/* ================= DATA WALI ================= */}
      {/* Tampilkan jika sedang edit, ATAU jika tidak edit tapi data wali sudah ada */}
      {(isEditing || (wali && wali.nama)) && (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-emerald-50 border-b border-gray-100 px-6 py-4">
            <h2 className="font-bold text-emerald-800">D. Data Wali (Opsional)</h2>
          </div>
          <div className="p-6 grid md:grid-cols-2 gap-x-12 gap-y-2">
            {isEditing ? (
              <>
                <EditRow label="Nama Lengkap Wali" value={wali?.nama} onChange={(e) => handleOrtuChange("wali", e)} />
                <EditRow label="NIK Wali" value={wali?.nik} onChange={(e) => handleOrtuChange("wali", e)} />
                <EditRow label="Tempat, Tanggal Lahir" value={`${wali?.tempat_lahir}, ${wali?.tanggal_lahir}`} onChange={(e) => handleOrtuChange("wali", e)} />
                <EditRow label="Pendidikan" value={wali?.pendidikan} onChange={(e) => handleOrtuChange("wali", e)} />
                <EditRow label="Pekerjaan" value={wali?.pekerjaan} onChange={(e) => handleOrtuChange("wali", e)} />
                <EditRow label="Penghasilan / Bulan" value={wali?.penghasilan} onChange={(e) => handleOrtuChange("wali", e)} />
                <EditRow label="Nomor WhatsApp" value={wali?.wa} onChange={(e) => handleOrtuChange("wali", e)} />
                <EditRow label="Domisili" value={wali?.domisili} onChange={(e) => handleOrtuChange("wali", e)} />
                <EditRow label="Status Kepemilikan Rumah" value={wali?.status_rumah} onChange={(e) => handleOrtuChange("wali", e)} />
                <div className="md:col-span-2">
                  <EditRow label="Alamat Wali" type="textarea" name="alamat" value={wali?.alamat} onChange={(e) => handleOrtuChange("wali", e)} />
                </div>
              </>
            ) : (
              <>
                <InfoRow label="Nama Lengkap Wali" value={wali?.nama} />
                <InfoRow label="NIK Wali" value={wali?.nik} />
                <InfoRow label="Tempat, Tanggal Lahir" value={`${wali?.tempat_lahir}, ${wali?.tanggal_lahir}`} />
                <InfoRow label="Pendidikan" value={wali?.pendidikan} />
                <InfoRow label="Pekerjaan" value={wali?.pekerjaan} />
                <InfoRow label="Penghasilan / Bulan" value={wali?.penghasilan} />
                <InfoRow label="Nomor WhatsApp" value={wali?.wa} />
                <InfoRow label="Domisili" value={wali?.domisili} />
                <InfoRow label="Status Kepemilikan Rumah" value={wali?.status_rumah} />
                <div className="md:col-span-2">
                  <InfoRow label="Alamat Wali" value={wali?.alamat} />
                </div>
              </>
            )}
          </div>
        </section>
      )}

    </div>
  );
}