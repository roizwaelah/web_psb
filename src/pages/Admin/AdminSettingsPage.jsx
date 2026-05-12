import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/services/api";
import { useToast } from "@/context/ToastContext";
import { useModal } from "@/context/ModalContext";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

// Fungsi untuk membuat ID unik agar penghapusan array di React tidak bocor/tertukar
const generateUid = () => Math.random().toString(36).substr(2, 9);

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const { openModal } = useModal();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(null);

  const quillRef = useRef(null);
  const adminData = JSON.parse(localStorage.getItem("admin_data") || "{}");
  const [selectedKode, setSelectedKode] = useState(adminData?.kode_lembaga || "ponpes");
  const [selectedLembagaId, setSelectedLembagaId] = useState(adminData?.lembaga_id || 1);

  useEffect(() => {
    if (!["admin", "superadmin"].includes(adminData?.role)) {
      showToast({ type: "error", title: "Akses Ditolak", description: "Menu pengaturan hanya untuk Administrator." });
      navigate("/admin/dashboard", { replace: true });
    }
  }, [adminData?.role, navigate, showToast]);

  const [settings, setSettings] = useState({
    navbar_text: "", navbar_logo: "",
    hero_title: "", hero_subtitle: "", hero_background: "",
    title_alur: "", title_persyaratan: "",
    footer_about: "", footer_copyright: "",
    contact_address: "", contact_phone: "", contact_email: "", contact_wa: "",
    alur_artikel: "",
    payment_bank1: "", payment_rek1: "", payment_an1: "",
    payment_bank2: "", payment_rek2: "", payment_an2: "",
    payment_qris: ""
  });

  const [alur, setAlur] = useState([]);
  const [persyaratan, setPersyaratan] = useState([]);
  const [informasi, setInformasi] = useState([]);

  const cleanRichText = (htmlText) => {
    if (!htmlText) return "";
    return htmlText
      .replace(/&nbsp;/g, " ")           // Ubah &nbsp; menjadi spasi biasa
      .replace(/<p><br><\/p>/g, "")      // Hapus baris kosong yang berlebihan
      .replace(/<br>/g, "\n")            // (Opsional) Ubah <br> jadi enter asli jika perlu
      .trim();
  };

  useEffect(() => {
    const fetchHomeData = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/public/home?lembaga=${selectedKode}`);
        const data = res.data?.data || {};
        
        setSettings({
          navbar_text: data.navbar?.text || "",
          navbar_logo: data.navbar?.logo || "",
          hero_title: data.hero_title || "",
          hero_subtitle: data.hero_subtitle || "",
          hero_background: data.hero_background || "",
          title_alur: data.section_titles?.alur || "",
          title_persyaratan: data.section_titles?.persyaratan || "",
          footer_about: data.footer?.about || "",
          footer_copyright: data.footer?.copyright || "",
          contact_address: data.kontak?.alamat || "",
          contact_phone: data.kontak?.telepon || "",
          contact_email: data.kontak?.email || "",
          contact_wa: data.kontak?.whatsapp || data.kontak?.telepon || "", 
          alur_artikel: data.alur_artikel || "",
          payment_bank1: data.pembayaran?.bank1 || "",
          payment_rek1: data.pembayaran?.rek1 || "",
          payment_an1: data.pembayaran?.an1 || "",
          payment_bank2: data.pembayaran?.bank2 || "",
          payment_rek2: data.pembayaran?.rek2 || "",
          payment_an2: data.pembayaran?.an2 || "",
          payment_qris: data.pembayaran?.qris || ""
        });

        // Tambahkan _uid agar fungsi Hapus di React tidak tertukar wujudnya
        setAlur((data.steps || []).map(item => ({ ...item, _uid: generateUid() })));
        setPersyaratan((data.requirements || []).map(item => ({ ...item, _uid: generateUid() })));
        setInformasi((data.informations || []).map(item => ({ ...item, _uid: generateUid() })));
        
      } catch (error) {
        showToast({ type: "error", title: "Error", description: "Gagal memuat pengaturan web." });
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeData();
  }, [selectedKode, showToast]);

  const handleSettingChange = (e) => setSettings({ ...settings, [e.target.name]: e.target.value });
  
  // FUNGSI ARRAY YANG SUDAH DIPERBAIKI
  const handleArrayChange = (setter, index, field, value) => {
    setter(prev => { 
      const newArray = [...prev]; 
      newArray[index] = { ...newArray[index], [field]: value }; 
      return newArray; 
    });
  };
  const removeArrayItem = (setter, index) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };
  const addArrayItem = (setter, emptyItem) => {
    setter(prev => [...prev, { ...emptyItem, _uid: generateUid() }]);
  };

  const handleImageUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return showToast({ type: "error", title: "Ukuran Terlalu Besar", description: "Maksimal 2MB." });
    setUploadingImage(fieldName);
    const formData = new FormData(); formData.append("image", file);
    try {
      const res = await api.post("/admin/upload-image", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setSettings(prev => ({ ...prev, [fieldName]: res.data.url }));
      showToast({ type: "success", title: "Berhasil", description: "Gambar diunggah." });
    } catch (error) { showToast({ type: "error", title: "Gagal", description: "Gagal mengunggah." }); } 
    finally { setUploadingImage(null); e.target.value = ""; }
  };

  const imageHandler = () => {
    const input = document.createElement('input'); input.setAttribute('type', 'file'); input.setAttribute('accept', 'image/*'); input.click();
    input.onchange = async () => {
      const file = input.files[0]; if (!file) return;
      showToast({ type: "info", title: "Mengunggah", description: "Sedang mengunggah gambar..." });
      const formData = new FormData(); formData.append("image", file);
      try {
        const res = await api.post("/admin/upload-image", formData, { headers: { "Content-Type": "multipart/form-data" } });
        const quill = quillRef.current.getEditor(); const range = quill.getSelection(true);
        quill.insertEmbed(range.index, 'image', res.data.url); quill.setSelection(range.index + 1);
        showToast({ type: "success", title: "Berhasil", description: "Gambar disisipkan." });
      } catch (error) { showToast({ type: "error", title: "Gagal", description: "Gagal menyisipkan gambar." }); }
    };
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'font': [] }, { 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }, { 'direction': 'rtl' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image'], 
        ['clean']
      ],
      handlers: { image: imageHandler }
    }
  }), []);

  const handleSave = () => {
    openModal({
      title: "Konfirmasi Simpan",
      content: `Apakah Anda yakin ingin memperbarui tampilan halaman depan untuk web ${selectedKode.toUpperCase()}?`,
      confirmText: "Ya, Terapkan",
      onConfirm: async () => {
        setIsSaving(true);
        
        // ========================================================
        // PROSES PENCUCIAN TEKS SEBELUM DISIMPAN KE DATABASE
        // ========================================================
        const cleanedSettings = {
          ...settings,
          alur_artikel: cleanRichText(settings.alur_artikel)
        };

        try {
          // Kirim cleanedSettings, BUKAN settings bawaan
          await api.put("/admin/settings", { 
            lembaga_id: selectedLembagaId, 
            settings: cleanedSettings, 
            alur, 
            persyaratan, 
            informasi 
          });
          
          showToast({ type: "success", title: "Berhasil", description: "Pengaturan halaman depan diterapkan." });
        } catch (error) { 
          showToast({ type: "error", title: "Gagal", description: "Terjadi kesalahan." }); 
        } 
        finally { 
          setIsSaving(false); 
        }
      }
    });
  };

  if (isLoading) return <div className="flex justify-center items-center h-[50vh]"><span className="text-slate-500 font-medium">Memuat pengaturan...</span></div>;

  return (
    <div className="space-y-6 pb-16">
      
      {/* HEADER PAGE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 border-l-4 sm:border-l-[5px] border-teal-500 pl-3">Pengaturan Website</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 sm:mt-1.5 ml-4">Sesuaikan visual, teks, dan informasi pada halaman publik.</p>
        </motion.div>
        <button type="button" onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition shadow-lg">{isSaving ? "Menyimpan..." : "Simpan Perubahan"}</button>
      </div>

      {adminData?.lembaga_id === null && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 shadow-sm">
          <label className="text-amber-900 font-bold text-sm">Pilih Halaman Web yang Diedit:</label>
          <select value={selectedKode} onChange={(e) => { const val = e.target.value; setSelectedKode(val); setSelectedLembagaId(val === 'ponpes' ? 1 : val === 'mts' ? 2 : 3); }} className="w-full sm:w-64 p-2.5 border border-amber-300 rounded-xl font-bold text-sm bg-white focus:ring-2 focus:ring-amber-500 cursor-pointer">
            <option value="ponpes">Web Pondok Pesantren</option><option value="mts">Web MTs Darussalam</option><option value="ma">Web MA Darussalam</option>
          </select>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
              
        {/* BAGIAN 1: NAVBAR & HERO */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-5">
          <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="font-bold text-sm sm:text-base text-slate-800 mb-4 border-b pb-2">Navigasi & Hero Section</h2>
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Identitas Navbar</p>
                <div><label className="text-[10px] font-bold text-slate-500 block uppercase">Teks Brand</label><input type="text" name="navbar_text" value={settings.navbar_text} onChange={handleSettingChange} className="w-full p-2.5 border rounded-lg" /></div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block uppercase">Logo Brand</label>
                  <div className="flex gap-2 items-center">
                    {settings.navbar_logo && (<div className="w-10 h-10 border rounded-lg bg-white shrink-0"><img src={settings.navbar_logo} className="w-full h-full object-contain" /></div>)}
                    <input type="text" name="navbar_logo" value={settings.navbar_logo} onChange={handleSettingChange} className="w-full p-2.5 border rounded-lg text-xs" />
                    <label className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer">Upload<input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'navbar_logo')} /></label>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Hero Section</p>
                <div><label className="text-[10px] font-bold text-slate-500 block uppercase">Judul Utama</label><input type="text" name="hero_title" value={settings.hero_title} onChange={handleSettingChange} className="w-full p-2.5 border rounded-lg" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 block uppercase">Sub-Judul</label><textarea name="hero_subtitle" rows="2" value={settings.hero_subtitle} onChange={handleSettingChange} className="w-full p-2.5 border rounded-lg resize-none" /></div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block uppercase">Background</label>
                  <div className="flex gap-2 items-center">
                    {settings.hero_background && (<div className="w-14 h-9 border rounded-lg bg-slate-200 shrink-0 overflow-hidden"><img src={settings.hero_background} className="w-full h-full object-cover" /></div>)}
                    <input type="text" name="hero_background" value={settings.hero_background} onChange={handleSettingChange} className="w-full p-2.5 border rounded-lg text-xs" />
                    <label className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer">Upload<input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'hero_background')} /></label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* BAGIAN 2: FOOTER */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4 sm:space-y-6">
          <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="font-bold text-sm sm:text-base text-slate-800 mb-4 border-b pb-2">Kontak & Footer</h2>
            <div className="space-y-3">
              <div><label className="text-[10px] font-bold text-slate-500 block uppercase">Nomor WhatsApp</label><input type="text" name="contact_wa" value={settings.contact_wa} onChange={handleSettingChange} className="w-full p-2.5 border rounded-lg" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-bold text-slate-500 block uppercase">Email</label><input type="text" name="contact_email" value={settings.contact_email} onChange={handleSettingChange} className="w-full p-2.5 border rounded-lg" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 block uppercase">Telepon</label><input type="text" name="contact_phone" value={settings.contact_phone} onChange={handleSettingChange} className="w-full p-2.5 border rounded-lg" /></div>
              </div>
              <div><label className="text-[10px] font-bold text-slate-500 block uppercase">Alamat</label><input type="text" name="contact_address" value={settings.contact_address} onChange={handleSettingChange} className="w-full p-2.5 border rounded-lg" /></div>
              <div><label className="text-[10px] font-bold text-slate-500 block uppercase">Tentang</label><textarea name="footer_about" rows="2" value={settings.footer_about} onChange={handleSettingChange} className="w-full p-2.5 border rounded-lg" /></div>
              <div><label className="text-[10px] font-bold text-slate-500 block uppercase">Hak Cipta</label><input type="text" name="footer_copyright" value={settings.footer_copyright} onChange={handleSettingChange} className="w-full p-2.5 border rounded-lg" /></div>
            </div>
          </div>
        </motion.div>

        {/* BAGIAN 3: ARTIKEL ALUR (QUILL) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="font-bold text-sm sm:text-base text-slate-800 mb-4 border-b pb-2">Artikel Detail Alur Pendaftaran</h2>
          <div className="space-y-4">
            <p className="text-[10px] sm:text-xs text-slate-500">Tuliskan panduan lengkap cara mendaftar. Anda bisa menyisipkan gambar dan tautan di sini.</p>
            <div className="bg-white rounded-xl overflow-hidden border border-slate-300">
              <ReactQuill ref={quillRef} theme="snow" value={settings.alur_artikel} onChange={(content) => setSettings({ ...settings, alur_artikel: content })} className="h-72 sm:h-96 pb-12 sm:pb-10" modules={modules} />
            </div>
          </div>
        </motion.div>

        {/* BAGIAN 4: TAHAPAN ALUR SINGKAT & PERSYARATAN */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          
          {/* Box Alur Singkat */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <div>
                <h2 className="font-bold text-sm sm:text-base text-slate-800">Alur Beranda Singkat</h2>
                <input type="text" name="title_alur" value={settings.title_alur} onChange={handleSettingChange} placeholder="Judul Bagian Alur..." className="w-full mt-1 text-xs border-b border-dashed border-slate-300 outline-none focus:border-teal-500 py-1 text-slate-500" />
              </div>
              <button type="button" onClick={() => addArrayItem(setAlur, { title: "" })} className="text-[10px] sm:text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1.5 rounded-lg hover:bg-teal-100 transition">+ Tambah</button>
            </div>
            <div className="space-y-3">
              {alur.map((item, idx) => (
                <div key={item._uid} className="flex items-center gap-2.5 bg-slate-50 p-2 sm:p-2.5 rounded-xl border border-slate-100">
                  <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#0e673b] text-white flex justify-center items-center text-[10px] sm:text-xs font-bold shrink-0">{idx + 1}</span>
                  <input type="text" value={item.title} onChange={(e) => handleArrayChange(setAlur, idx, "title", e.target.value)} className="w-full text-xs sm:text-sm p-1.5 bg-transparent border-b border-slate-300 outline-none focus:border-teal-500" placeholder="Keterangan tahapan..." />
                  <button type="button" onClick={() => removeArrayItem(setAlur, idx)} className="text-red-400 hover:text-red-600 font-bold p-1.5 shrink-0 bg-red-50 rounded-md">X</button>
                </div>
              ))}
            </div>
          </div>

          {/* Box Persyaratan */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <div>
                <h2 className="font-bold text-sm sm:text-base text-slate-800">Syarat Pendaftaran</h2>
                <input type="text" name="title_persyaratan" value={settings.title_persyaratan} onChange={handleSettingChange} placeholder="Judul Bagian Syarat..." className="w-full mt-1 text-xs border-b border-dashed border-slate-300 outline-none focus:border-teal-500 py-1 text-slate-500" />
              </div>
              <button type="button" onClick={() => addArrayItem(setPersyaratan, { type: "dokumen", content: "" })} className="text-[10px] sm:text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1.5 rounded-lg hover:bg-teal-100 transition">+ Tambah</button>
            </div>
            <div className="space-y-3">
              {persyaratan.map((item, idx) => (
                <div key={item._uid} className="flex flex-col sm:flex-row gap-2 bg-slate-50 p-2 sm:p-2.5 rounded-xl border border-slate-100">
                  <select value={item.type} onChange={(e) => handleArrayChange(setPersyaratan, idx, "type", e.target.value)} className="text-[10px] sm:text-xs border p-1.5 rounded-md bg-white outline-none w-full sm:w-28">
                    <option value="dokumen">Dokumen</option>
                    <option value="ketentuan">Ketentuan</option>
                  </select>
                  <div className="flex gap-2 w-full">
                    <input type="text" value={item.content} onChange={(e) => handleArrayChange(setPersyaratan, idx, "content", e.target.value)} className="w-full text-xs sm:text-sm p-1.5 bg-white border rounded-md outline-none" placeholder="Isi Syarat..." />
                    <button type="button" onClick={() => removeArrayItem(setPersyaratan, idx)} className="text-red-400 hover:text-red-600 font-bold p-1.5 shrink-0 bg-red-50 rounded-md">X</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* BAGIAN 5: INFORMASI TAMBAHAN */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4 border-b pb-3">
            <h2 className="font-bold text-sm sm:text-base text-slate-800">Informasi Tambahan (Beranda)</h2>
            <button type="button" onClick={() => addArrayItem(setInformasi, { icon: "📌", title: "", description: "" })} className="text-[10px] sm:text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition shadow-sm">+ Tambah Info Utama</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
            {informasi.map((item, idx) => {
              // Memecah teks deskripsi menjadi array (baris)
              const descLines = item.description !== null && item.description !== undefined ? String(item.description).split('\n') : [""];
              
              return (
              <div key={item._uid || idx} className="flex flex-col gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 relative group transition-all hover:shadow-md hover:border-teal-200">
                
                {/* Tombol Hapus Info Utama (Dibuat melayang di pojok kanan atas) */}
                <button 
                  type="button" 
                  onClick={() => removeArrayItem(setInformasi, idx)} 
                  className="absolute -top-2.5 -right-2.5 w-7 h-7 bg-red-100 hover:bg-red-500 text-red-500 hover:text-white rounded-full flex justify-center items-center text-xs font-bold transition shadow-sm opacity-0 group-hover:opacity-100 z-10" 
                  title="Hapus Kotak Informasi ini"
                >
                  X
                </button>

                <div className="flex gap-3 items-start w-full">
                  <input type="text" value={item.icon} onChange={(e) => handleArrayChange(setInformasi, idx, "icon", e.target.value)} className="w-12 h-12 text-center border bg-white rounded-xl text-2xl outline-none shrink-0 shadow-sm focus:border-teal-500 transition" placeholder="Icon" />
                  <div className="w-full">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Judul Informasi</label>
                    <input type="text" value={item.title} onChange={(e) => handleArrayChange(setInformasi, idx, "title", e.target.value)} className="w-full text-xs sm:text-sm font-bold p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-teal-500 shadow-sm transition" placeholder="Contoh: Fasilitas Asrama" />
                  </div>
                </div>
                
                {/* LIST DESKRIPSI DINAMIS */}
                <div className="w-full bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-2.5 border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daftar Deskripsi (Poin)</span>
                    <button 
                      type="button" 
                      onClick={() => {
                        const newLines = [...descLines, ""];
                        handleArrayChange(setInformasi, idx, "description", newLines.join('\n'));
                      }} 
                      className="text-[10px] font-bold text-teal-600 hover:text-teal-800 bg-teal-50 px-2 py-1 rounded transition"
                    >
                      + Tambah Baris
                    </button>
                  </div>

                  <div className="space-y-2">
                    {descLines.map((line, lineIdx) => (
                      <div key={lineIdx} className="flex gap-2 items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0"></span>
                        <input 
                          type="text" 
                          value={line} 
                          onChange={(e) => {
                            const newLines = [...descLines];
                            newLines[lineIdx] = e.target.value;
                            handleArrayChange(setInformasi, idx, "description", newLines.join('\n'));
                          }} 
                          className="w-full text-[11px] sm:text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-md outline-none focus:bg-white focus:border-teal-500 transition" 
                          placeholder="Ketik poin penjelasan di sini..." 
                        />
                        <button 
                          type="button" 
                          onClick={() => {
                            const newLines = [...descLines];
                            newLines.splice(lineIdx, 1);
                            handleArrayChange(setInformasi, idx, "description", newLines.join('\n'));
                          }} 
                          className="text-red-400 hover:text-red-600 font-bold px-2 py-1 bg-red-50 hover:bg-red-100 rounded-md shrink-0 text-[10px] transition"
                          title="Hapus baris deskripsi ini"
                        >
                          X
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )})}
          </div>
        </motion.div>
        
        {/* BAGIAN 6: METODE PEMBAYARAN */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="lg:col-span-2 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="font-bold text-sm sm:text-base text-slate-800 mb-4 border-b pb-2">Metode Pembayaran (Transfer & QRIS)</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Bank Utama */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Rekening 1</p>
                <div><label className="text-[10px] font-bold text-slate-500 block uppercase mb-1">Nama Bank</label><input type="text" name="payment_bank1" value={settings.payment_bank1} onChange={handleSettingChange} placeholder="Contoh: BSI" className="w-full p-2.5 border rounded-lg text-xs sm:text-sm outline-none focus:border-teal-500" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 block uppercase mb-1">No. Rekening</label><input type="text" name="payment_rek1" value={settings.payment_rek1} onChange={handleSettingChange} className="w-full p-2.5 border rounded-lg text-xs sm:text-sm outline-none focus:border-teal-500 font-mono" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 block uppercase mb-1">Atas Nama</label><input type="text" name="payment_an1" value={settings.payment_an1} onChange={handleSettingChange} className="w-full p-2.5 border rounded-lg text-xs sm:text-sm outline-none focus:border-teal-500" /></div>
            </div>

            {/* Bank Alternatif */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Rekening 2</p>
                <div><label className="text-[10px] font-bold text-slate-500 block uppercase mb-1">Nama Bank</label><input type="text" name="payment_bank2" value={settings.payment_bank2} onChange={handleSettingChange} placeholder="Contoh: BRI" className="w-full p-2.5 border rounded-lg text-xs sm:text-sm outline-none focus:border-teal-500" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 block uppercase mb-1">No. Rekening</label><input type="text" name="payment_rek2" value={settings.payment_rek2} onChange={handleSettingChange} className="w-full p-2.5 border rounded-lg text-xs sm:text-sm outline-none focus:border-teal-500 font-mono" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 block uppercase mb-1">Atas Nama</label><input type="text" name="payment_an2" value={settings.payment_an2} onChange={handleSettingChange} className="w-full p-2.5 border rounded-lg text-xs sm:text-sm outline-none focus:border-teal-500" /></div>
            </div>

            {/* QRIS Upload */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Barcode QRIS (Opsional)</p>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block uppercase mb-1">Gambar QRIS</label>
                  <div className="flex flex-col gap-3">
                    {settings.payment_qris && (
                      <div className="w-full h-32 border rounded-xl bg-white overflow-hidden p-2 flex items-center justify-center shadow-sm">
                        <img src={settings.payment_qris} className="max-w-full max-h-full object-contain" alt="QRIS" />
                      </div>
                    )}
                    <label className="w-full text-center py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-sm">
                      {uploadingImage === 'payment_qris' ? 'Mengunggah...' : 'Upload Gambar QRIS'}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'payment_qris')} disabled={!!uploadingImage} />
                    </label>
                    <input type="text" name="payment_qris" value={settings.payment_qris} onChange={handleSettingChange} placeholder="Atau paste URL QRIS di sini" className="w-full p-2 border rounded-lg text-[10px] outline-none focus:border-teal-500 text-slate-400 bg-transparent" />
                  </div>
                </div>
            </div>
            
          </div>
        </motion.div>
      </div>
    </div>
  );
}
