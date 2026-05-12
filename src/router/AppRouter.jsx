import { BrowserRouter, Routes, Route } from "react-router-dom";

import PortalPage from "../pages/PortalPage"; // <--- TAMBAHAN BARU

import MainLayout from "../layouts/MainLayout";
import LicenseError from "../pages/LicenseError";

import HomePage from "../pages/Public/HomePage";
import RegistrationPage from "../pages/Public/RegistrationPage";
import AlurPendaftaranPage from "../pages/Public/AlurPendaftaranPage";

import StudentLayout from "../pages/Student/StudentLayout";
import StudentLoginPage from "../pages/Student/StudentLoginPage";
import StudentDashboardPage from "../pages/Student/StudentDashboardPage";
import StudentBiodataPage from "../pages/Student/StudentBiodataPage";
import StudentDocumentsPage from "../pages/Student/StudentDocumentsPage";
import StudentPrintPage from "../pages/Student/StudentPrintPage";
import StudentPembayaranPage from "../pages/Student/StudentPembayaranPage";

import AdminLoginPage from "../pages/Admin/AdminLoginPage";
import AdminLayout from "../pages/Admin/AdminLayout";
import AdminDashboardPage from "../pages/Admin/AdminDashboardPage";
import AdminValidasiPage from "../pages/Admin/AdminValidasiPage";
import AdminDokumenPage from "../pages/Admin/AdminDokumenPage";
import AdminPendaftarPage from "../pages/Admin/AdminPendaftarPage";
import AdminPengumumanPage from "../pages/Admin/AdminPengumumanPage";
import AdminUsersPage from "../pages/Admin/AdminUsersPage";
import AdminSettingsPage from "../pages/Admin/AdminSettingsPage";
import AdminPembayaranPage from "../pages/Admin/AdminPembayaranPage";

export default function AppRouter() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        {/* PORTAL YAYASAN UTAMA */}
        <Route path="/" element={<PortalPage />} />

        {/* PUBLIC (DINAMIS PER LEMBAGA) */}
        {/* URL akan menjadi: /mts , /ponpes/daftar , /ma */}
        <Route path="/:kode_lembaga" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="daftar" element={<RegistrationPage />} />
          <Route path="alur" element={<AlurPendaftaranPage />} />
        </Route>

        {/* STUDENT LOGIN (DINAMIS PER LEMBAGA) */}
        {/* URL akan menjadi: /mts/siswa/login */}
        <Route
          path="/:kode_lembaga/siswa/login"
          element={<StudentLoginPage />}
        />

        {/* STUDENT DASHBOARD (Area Privat, identitas lembaga didapat dari Token JWT) */}
        <Route path="/siswa" element={<StudentLayout />}>
          <Route path="dashboard" element={<StudentDashboardPage />} />
          <Route path="biodata" element={<StudentBiodataPage />} />
          <Route path="dokumen" element={<StudentDocumentsPage />} />
          <Route path="cetak" element={<StudentPrintPage />} />
          <Route path="pembayaran" element={<StudentPembayaranPage />} />
        </Route>

        {/* ADMIN (Area Privat) */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="validasi" element={<AdminValidasiPage />} />
          <Route path="dokumen" element={<AdminDokumenPage />} />
          <Route path="pendaftar" element={<AdminPendaftarPage />} />
          <Route path="pengumuman" element={<AdminPengumumanPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="pengaturan" element={<AdminSettingsPage />} />
          <Route path="pembayaran" element={<AdminPembayaranPage />} />
        </Route>

        {/* ERROR PAGES */}
        <Route path="/license-error" element={<LicenseError />} />
      </Routes>
    </BrowserRouter>
  );
}
