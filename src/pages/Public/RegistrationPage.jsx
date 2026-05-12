import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom"; // <-- TAMBAHKAN useParams
import { useToast } from "@/context/ToastContext";
import api from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";

/* =====================================================
   STYLES
===================================================== */
const labelClass =
  "text-[13px] font-semibold text-slate-700 mb-1.5 block ml-1 uppercase tracking-tight";
const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all duration-200 text-sm placeholder:text-slate-400";
const radioClass =
  "flex items-center gap-2 cursor-pointer bg-white px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-sm font-medium";
const errorClass = "text-[11px] text-red-500 mt-1 ml-1 font-medium";

/* =====================================================
   SCHEMA
===================================================== */

const nikSchema = z.string().regex(/^[0-9]{16}$/, "NIK harus 16 digit angka");

const waSchema = z
  .string()
  .regex(/^[0-9]{10,15}$/, "Nomor WA tidak valid")
  .optional()
  .or(z.literal(""));

const registrationSchema = z
  .object({
    /* EXTRA: PILIHAN SEKOLAH */
    pilihan_sekolah_formal: z.string().optional(),

    /* SANTRI */
    nama_lengkap: z.string().min(1, "Nama wajib diisi"),
    nisn: z.string().min(1, "NISN wajib diisi"),
    tempat_lahir: z.string().min(1, "Tempat lahir wajib diisi"),
    tanggal_lahir: z.string().min(1, "Tanggal lahir wajib diisi"),
    jenis_kelamin: z.string().min(1, "Jenis kelamin wajib dipilih"),
    nik: nikSchema,
    agama: z.string().min(1, "Agama wajib dipilih"),
    pendidikan_terakhir: z.string().min(1, "Pendidikan wajib dipilih"),
    asal_sekolah: z.string().min(1, "Asal sekolah wajib diisi"),
    alamat_lengkap: z.string().min(1, "Alamat wajib diisi"),

    /* AYAH */
    status_ayah: z.string().min(1, "Pilih status ayah"),
    nama_ayah: z.string().optional(),
    nik_ayah: z.string().optional(),
    tempat_lahir_ayah: z.string().optional(),
    tanggal_lahir_ayah: z.string().optional(),
    pendidikan_ayah: z.string().optional(),
    pekerjaan_ayah: z.string().optional(),
    domisili_ayah: z.string().optional(),
    wa_ayah: waSchema,
    penghasilan_ayah: z.string().optional(),
    status_rumah_ayah: z.string().optional(),
    alamat_ayah: z.string().optional(),

    /* IBU */
    status_ibu: z.string().min(1, "Pilih status ibu"),
    nama_ibu: z.string().optional(),
    nik_ibu: z.string().optional(),
    tempat_lahir_ibu: z.string().optional(),
    tanggal_lahir_ibu: z.string().optional(),
    pendidikan_ibu: z.string().optional(),
    pekerjaan_ibu: z.string().optional(),
    domisili_ibu: z.string().optional(),
    wa_ibu: waSchema,
    penghasilan_ibu: z.string().optional(),
    status_rumah_ibu: z.string().optional(),
    alamat_ibu: z.string().optional(),

    /* WALI */
    status_wali: z.string().optional(),
    nama_wali: z.string().optional(),
    nik_wali: z.string().optional(),
    tempat_lahir_wali: z.string().optional(),
    tanggal_lahir_wali: z.string().optional(),
    pendidikan_wali: z.string().optional(),
    pekerjaan_wali: z.string().optional(),
    domisili_wali: z.string().optional(),
    wa_wali: waSchema,
    penghasilan_wali: z.string().optional(),
    status_rumah_wali: z.string().optional(),
    alamat_wali: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status_ayah === "Masih Hidup") {
      if (!data.nama_ayah)
        ctx.addIssue({
          path: ["nama_ayah"],
          code: "custom",
          message: "Nama ayah wajib diisi",
        });
      if (!data.nik_ayah || !/^[0-9]{16}$/.test(data.nik_ayah))
        ctx.addIssue({
          path: ["nik_ayah"],
          code: "custom",
          message: "NIK ayah wajib 16 digit",
        });
    }

    if (data.status_ibu === "Masih Hidup") {
      if (!data.nama_ibu)
        ctx.addIssue({
          path: ["nama_ibu"],
          code: "custom",
          message: "Nama ibu wajib diisi",
        });
      if (!data.nik_ibu || !/^[0-9]{16}$/.test(data.nik_ibu))
        ctx.addIssue({
          path: ["nik_ibu"],
          code: "custom",
          message: "NIK ibu wajib 16 digit",
        });
    }

    if (data.status_ayah === "Meninggal" && data.status_ibu === "Meninggal") {
      if (!data.nama_wali)
        ctx.addIssue({
          path: ["nama_wali"],
          code: "custom",
          message: "Nama wali wajib diisi",
        });
      if (!data.nik_wali || !/^[0-9]{16}$/.test(data.nik_wali))
        ctx.addIssue({
          path: ["nik_wali"],
          code: "custom",
          message: "NIK wali wajib 16 digit",
        });
    }
  });

/* =====================================================
   COMPONENT
===================================================== */

export default function RegistrationPage() {
  const { kode_lembaga } = useParams(); // <-- Tangkap lembaga dari URL
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registrationSchema),
    mode: "onBlur",
    defaultValues: {
      pilihan_sekolah_formal: "",
    },
  });

  const statusAyah = watch("status_ayah");
  const statusIbu = watch("status_ibu");
  const isBothParentsPassed =
    statusAyah === "Meninggal" && statusIbu === "Meninggal";

  /* AUTO CLEAR FIELDS */
  useEffect(() => {
    if (statusAyah !== "Masih Hidup") {
      ["nama_ayah", "nik_ayah", "wa_ayah"].forEach((field) =>
        setValue(field, ""),
      );
    }
  }, [statusAyah, setValue]);

  useEffect(() => {
    if (statusIbu !== "Masih Hidup") {
      ["nama_ibu", "nik_ibu", "wa_ibu"].forEach((field) => setValue(field, ""));
    }
  }, [statusIbu, setValue]);

  // Tambahkan pilihan_sekolah_formal ke dalam pengecekan step 0 jika diperlukan
  const stepFields = [
    [
      "nama_lengkap",
      "nisn",
      "tempat_lahir",
      "tanggal_lahir",
      "jenis_kelamin",
      "nik",
      "agama",
      "pendidikan_terakhir",
      "asal_sekolah",
      "alamat_lengkap",
      "pilihan_sekolah_formal",
    ],
    [
      "status_ayah",
      "nama_ayah",
      "nik_ayah",
      "status_ibu",
      "nama_ibu",
      "nik_ibu",
    ],
    ["status_wali", "nama_wali", "nik_wali"],
  ];

  const handleNext = async () => {
    const fieldsToValidate = stepFields[step];
    const valid = await trigger(fieldsToValidate);
    if (valid) setStep((prev) => prev + 1);
  };

  const handleBack = () => setStep((prev) => prev - 1);

  const onSubmit = async (data) => {
    try {
      const payload = {
        santri: {
          kode_lembaga: kode_lembaga,
          pilihan_sekolah_formal: data.pilihan_sekolah_formal,
          nama_lengkap: data.nama_lengkap,
          nisn: data.nisn,
          tempat_lahir: data.tempat_lahir,
          tanggal_lahir: data.tanggal_lahir,
          jenis_kelamin: data.jenis_kelamin,
          nik: data.nik,
          agama: data.agama,
          pendidikan_terakhir: data.pendidikan_terakhir,
          asal_sekolah: data.asal_sekolah,
          alamat_lengkap: data.alamat_lengkap,
        },
        ayah: {
          status: data.status_ayah,
          ...(data.status_ayah === "Masih Hidup" && {
            nama: data.nama_ayah,
            nik: data.nik_ayah,
            tempat_lahir: data.tempat_lahir_ayah,
            tanggal_lahir: data.tanggal_lahir_ayah,
            pendidikan: data.pendidikan_ayah,
            pekerjaan: data.pekerjaan_ayah,
            domisili: data.domisili_ayah,
            wa: data.wa_ayah,
            penghasilan: data.penghasilan_ayah,
            status_rumah: data.status_rumah_ayah,
            alamat: data.alamat_ayah,
          }),
        },
        ibu: {
          status: data.status_ibu,
          ...(data.status_ibu === "Masih Hidup" && {
            nama: data.nama_ibu,
            nik: data.nik_ibu,
            tempat_lahir: data.tempat_lahir_ibu,
            tanggal_lahir: data.tanggal_lahir_ibu,
            pendidikan: data.pendidikan_ibu,
            pekerjaan: data.pekerjaan_ibu,
            domisili: data.domisili_ibu,
            wa: data.wa_ibu,
            penghasilan: data.penghasilan_ibu,
            status_rumah: data.status_rumah_ibu,
            alamat: data.alamat_ibu,
          }),
        },
        wali: isBothParentsPassed
          ? {
              status: data.status_wali,
              nama: data.nama_wali,
              nik: data.nik_wali,
              tempat_lahir: data.tempat_lahir_wali,
              tanggal_lahir: data.tanggal_lahir_wali,
              pendidikan: data.pendidikan_wali,
              pekerjaan: data.pekerjaan_wali,
              domisili: data.domisili_wali,
              wa: data.wa_wali,
              penghasilan: data.penghasilan_wali,
              status_rumah: data.status_rumah_wali,
              alamat: data.alamat_wali,
            }
          : null,
      };

      const response = await api.post("/pendaftaran", payload);
      showToast({
        type: "success",
        title: "Berhasil",
        description: `No Pendaftaran: ${response.data.nomor_pendaftaran}`,
      });

      // Arahkan ke halaman login lembaga terkait
      navigate(`/${kode_lembaga}/siswa/login`);
    } catch (error) {
      showToast({
        type: "error",
        title: "Gagal",
        description:
          error.response?.data?.message ||
          "Kesalahan server saat menyimpan data.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 px-4 sm:px-6">
      {/* Container Ramping: max-w-3xl (~15% lebih kecil dari 4xl) */}
      <div className="max-w-3xl mx-auto">
        {/* Header - Minimalist */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">
            Formulir Pendaftaran
          </h1>
          <p className="text-[13px] text-slate-500 mt-1.5 font-medium">
            JALUR:{" "}
            <span className="text-teal-600 font-bold px-2 py-0.5 bg-teal-50 rounded-md">
              {kode_lembaga}
            </span>
          </p>
        </div>

        {/* Stepper - Slim & Elegant */}
        <div className="flex items-center justify-between relative mb-10 max-w-md mx-auto px-2">
          <div className="absolute left-0 top-[18px] w-full h-0.5 bg-slate-100 -z-10"></div>
          {["Santri", "Orang Tua", "Wali"].map((label, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ring-4 ${
                  step >= i
                    ? "bg-slate-900 text-white ring-teal-50"
                    : "bg-white text-slate-300 border border-slate-200 ring-transparent"
                }`}
              >
                {step > i ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-widest ${step >= i ? "text-slate-800" : "text-slate-300"}`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8">
            <AnimatePresence mode="wait">
              {/* ================= STEP 0: DATA SANTRI ================= */}
              {step === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-5"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-6 bg-teal-500 rounded-full"></div>
                    <h2 className="text-lg font-bold text-slate-800">
                      Biodata Calon Santri
                    </h2>
                  </div>

                  {kode_lembaga === "ponpes" && (
                    <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100 mb-6 group transition-all">
                      <label className={labelClass + " text-teal-800!"}>
                        Pilihan Pendidikan Formal
                      </label>
                      <select
                        {...register("pilihan_sekolah_formal")}
                        className={`${inputClass} bg-white! border-teal-200`}
                      >
                        <option value="">
                          -- Hanya Mukim (Pondok Saja) --
                        </option>
                        <option value="mts">
                          Sekaligus Mendaftar MTs Darussalam
                        </option>
                        <option value="ma">
                          Sekaligus Mendaftar MA Darussalam
                        </option>
                      </select>
                      <p className="text-[11px] text-teal-600 mt-2 font-medium italic">
                        *Data otomatis terintegrasi dengan sekolah formal
                        pilihan.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className={labelClass}>Nama Lengkap</label>
                      <input
                        {...register("nama_lengkap")}
                        className={inputClass}
                        placeholder="Sesuai Akta"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>NISN</label>
                      <input
                        {...register("nisn")}
                        className={inputClass}
                        placeholder="10 Digit"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>NIK Santri</label>
                      <input
                        {...register("nik")}
                        className={inputClass}
                        placeholder="16 Digit"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Tempat Lahir</label>
                      <input
                        {...register("tempat_lahir")}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Tanggal Lahir</label>
                      <input
                        type="date"
                        {...register("tanggal_lahir")}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Jenis Kelamin</label>
                      <select
                        {...register("jenis_kelamin")}
                        className={inputClass}
                      >
                        <option value="">Pilih</option>
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Agama</label>
                      <select {...register("agama")} className={inputClass}>
                        <option value="">Pilih</option>
                        <option value="Islam">Islam</option>
                        <option value="Kristen">Kristen</option>
                        <option value="Katholik">Katholik</option>
                        <option value="Hindu">Hindu</option>
                        <option value="Budha">Budha</option>
                        <option value="Khonghucu">Khonghucu</option>
                      </select>
                      {errors.agama && (
                        <p className={errorClass}>{errors.agama.message}</p>
                      )}
                    </div>
                    <div>
                      <label className={labelClass}>Pendidikan Terakhir</label>
                      <select
                        {...register("pendidikan_terakhir")}
                        className={inputClass}
                      >
                        <option value="">Pilih</option>
                        <option value="SD/MI">SD/MI</option>
                        <option value="SMP/MTs">SMP/MTs</option>
                        <option value="SMP/MTs">SMA/MA</option>
                        <option value="SMP/MTs">Lainnya</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Asal Sekolah</label>
                      <input
                        {...register("asal_sekolah")}
                        className={inputClass}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Alamat Lengkap</label>
                      <textarea
                        {...register("alamat_lengkap")}
                        rows="2"
                        className={`${inputClass} resize-none`}
                      ></textarea>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ================= STEP 1: DATA ORANG TUA ================= */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-8"
                >
                  {/* AYAH */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      Ayah Kandung{" "}
                      <span className="h-px flex-1 bg-slate-100"></span>
                    </h3>
                    <div className="flex gap-4 mb-4">
                      {["Masih Hidup", "Meninggal"].map((s) => (
                        <label key={s} className={radioClass}>
                          <input
                            type="radio"
                            value={s}
                            {...register("status_ayah")}
                            className="accent-teal-600 w-4 h-4"
                          />{" "}
                          {s}
                        </label>
                      ))}
                    </div>
                    {statusAyah === "Masih Hidup" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 transition-all">
                        <div>
                          <label className={labelClass}>Nama Ayah</label>
                          <input
                            {...register("nama_ayah")}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>NIK Ayah</label>
                          <input
                            {...register("nik_ayah")}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Tempat Lahir</label>
                          <input
                            className={inputClass}
                            {...register("tempat_lahir_ayah")}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Tanggal Lahir</label>
                          <input
                            type="date"
                            className={inputClass}
                            {...register("tanggal_lahir_ayah")}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Pendidikan</label>
                          <select
                            className={inputClass}
                            {...register("pendidikan_ayah")}
                          >
                            <option value="">Pilih</option>
                            <option>SD/MI</option>
                            <option>SMP/MTs</option>
                            <option>SMA/MA</option>
                            <option>S1</option>
                            <option>S2</option>
                            <option>S3</option>
                            <option>Tidak Sekolah</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Pekerjaan</label>
                          <input
                            className={inputClass}
                            {...register("pekerjaan_ayah")}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Domisili</label>
                          <select
                            className={inputClass}
                            {...register("domisili_ayah")}
                          >
                            <option value="">Domisili</option>
                            <option>Dalam Negeri</option>
                            <option>Luar Negeri</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>No. WA</label>
                          <input
                            className={inputClass}
                            {...register("wa_ayah")}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>
                            Penghasilan /Bulan
                          </label>
                          <select
                            select
                            className={inputClass}
                            {...register("penghasilan_ayah")}
                          >
                            <option value="">Pilih</option>
                            <option>{"< 1 Juta"}</option>
                            <option>1 - 3 Juta</option>
                            <option>{"> 3 Juta"}</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Status Rumah</label>
                          <select
                            className={inputClass}
                            {...register("status_rumah_ayah")}
                          >
                            <option value="">Pilih</option>
                            <option>Milik Sendiri</option>
                            <option>Sewa/Kontrak</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelClass}>Alamat Lengkap</label>
                          <textarea
                            placeholder="Alamat Ayah"
                            rows={2}
                            className={`${inputClass} resize-none`}
                            {...register("alamat_ayah")}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* IBU */}
                  <div className="space-y-4 pt-4">
                    <h3 className="text-lg font-bold text-slate-800">
                      Ibu Kandung{" "}
                      <span className="h-px flex-1 bg-slate-100"></span>
                    </h3>
                    <div className="flex gap-4 mb-4">
                      {["Masih Hidup", "Meninggal"].map((s) => (
                        <label key={s} className={radioClass}>
                          <input
                            type="radio"
                            value={s}
                            {...register("status_ibu")}
                            className="accent-teal-600 w-4 h-4"
                          />{" "}
                          {s}
                        </label>
                      ))}
                    </div>
                    {statusIbu === "Masih Hidup" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Nama Ibu</label>
                          <input
                            {...register("nama_ibu")}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>NIK Ibu</label>
                          <input
                            {...register("nik_ibu")}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Tempat Lahir</label>
                          <input
                            className={inputClass}
                            {...register("tempat_lahir_ibu")}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Tanggal Lahir</label>
                          <input
                            type="date"
                            className={inputClass}
                            {...register("tanggal_lahir_ibu")}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Pendidikan</label>
                          <select
                            className={inputClass}
                            {...register("pendidikan_ibu")}
                          >
                            <option value="">Pilih</option>{" "}
                            <option>SD/MI</option>
                            <option>SMP/MTs</option>
                            <option>SMA/MA</option>
                            <option>S1</option>
                            <option>S2</option>
                            <option>S3</option>
                            <option>Tidak Sekolah</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Pekerjaan</label>
                          <input
                            className={inputClass}
                            {...register("pekerjaan_ibu")}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Domisili</label>
                          <select
                            className={inputClass}
                            {...register("domisili_ibu")}
                          >
                            <option value="">Domisili</option>
                            <option>Dalam Negeri</option>
                            <option>Luar Negeri</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>No. WA</label>
                          <input
                            className={inputClass}
                            {...register("wa_ibu")}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>
                            Penghasilan /Bulan
                          </label>
                          <select
                            select
                            className={inputClass}
                            {...register("penghasilan_ibu")}
                          >
                            <option value="">Pilih</option>
                            <option>{"< 1 Juta"}</option>
                            <option>1 - 3 Juta</option>
                            <option>{"> 3 Juta"}</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Status Rumah</label>
                          <select
                            className={inputClass}
                            {...register("status_rumah_ibu")}
                          >
                            <option value="">Pilih</option>
                            <option>Milik Sendiri</option>
                            <option>Sewa/Kontrak</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelClass}>Alamat Lengkap</label>
                          <textarea
                            placeholder="Alamat Ibu"
                            rows={2}
                            className={`${inputClass} resize-none`}
                            {...register("alamat_ibu")}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ================= STEP 2: DATA WALI ================= */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-5"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-6 bg-amber-500 rounded-full"></div>
                    <h2 className="text-lg font-bold text-slate-800">
                      Data Wali
                    </h2>
                  </div>

                  {isBothParentsPassed && (
                    <p className="p-3 bg-red-50 text-red-600 text-[11px] font-bold rounded-lg border border-red-100 uppercase tracking-tighter">
                      Wajib diisi karena kedua orang tua telah meninggal dunia.
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Nama Wali</label>
                      <input
                        {...register("nama_wali")}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>NIK Wali</label>
                      <input {...register("nik_wali")} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Tempat Lahir</label>
                      <input
                        className={inputClass}
                        {...register("tempat_lahir_wali")}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Tanggal Lahir</label>
                      <input
                        type="date"
                        className={inputClass}
                        {...register("tanggal_lahir_wali")}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Pendidikan</label>
                      <select
                        className={inputClass}
                        {...register("pendidikan_wali")}
                      >
                        <option value="">Pilih</option> <option>SD/MI</option>
                        <option>SMP/MTs</option>
                        <option>SMA/MA</option>
                        <option>S1</option>
                        <option>S2</option>
                        <option>S3</option>
                        <option>Tidak Sekolah</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Pekerjaan</label>
                      <input
                        className={inputClass}
                        {...register("pekerjaan_wali")}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Domisili</label>
                      <select
                        className={inputClass}
                        {...register("domisili_wali")}
                      >
                        <option value="">Domisili</option>
                        <option>Dalam Negeri</option>
                        <option>Luar Negeri</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>No. WA</label>
                      <input className={inputClass} {...register("wa_wali")} />
                    </div>
                    <div>
                      <label className={labelClass}>Penghasilan /Bulan</label>
                      <select
                        select
                        className={inputClass}
                        {...register("penghasilan_wali")}
                      >
                        <option value="">Pilih</option>
                        <option>{"< 1 Juta"}</option>
                        <option>1 - 3 Juta</option>
                        <option>{"> 3 Juta"}</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Status Rumah</label>
                      <select
                        className={inputClass}
                        {...register("status_rumah_wali")}
                      >
                        <option value="">Pilih</option>
                        <option>Milik Sendiri</option>
                        <option>Sewa/Kontrak</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Alamat Lengkap</label>
                      <textarea
                        placeholder="Alamat Wali"
                        rows={2}
                        className={`${inputClass} resize-none`}
                        {...register("alamat_wali")}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between mt-10 pt-6 border-t border-slate-100">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-5 py-2 text-[12px] font-bold text-slate-400 hover:text-slate-800 transition-all uppercase tracking-widest"
                >
                  ← Kembali
                </button>
              ) : (
                <div />
              )}

              <button
                type={step < 2 ? "button" : "submit"}
                onClick={step < 2 ? handleNext : undefined}
                className={`px-8 py-2.5 rounded-xl text-[12px] font-bold tracking-widest transition-all shadow-sm ${
                  step < 2
                    ? "bg-slate-900 text-white hover:bg-slate-800"
                    : "bg-teal-600 text-white hover:bg-teal-700 shadow-teal-100"
                }`}
              >
                {isSubmitting
                  ? "PROSES..."
                  : step < 2
                    ? "LANJUT →"
                    : "SIMPAN DATA"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
