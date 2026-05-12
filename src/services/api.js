import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

// ==========================================
// 2. RESPONSE INTERCEPTOR (Validasi Keamanan & Lisensi)
// ==========================================
api.interceptors.response.use(
  (response) => {
    // Kompatibilitas format payload endpoint publik /public/home
    // Beberapa environment bisa mengirim:
    // 1) { message, data: {...} } (format utama)
    // 2) { ...homeData } (tanpa wrapper data)
    if (response?.config?.url?.includes("/public/home")) {
      let payload = response.data;

      if (typeof payload === "string") {
        try {
          payload = JSON.parse(payload);
        } catch (e) {
          payload = response.data;
        }
      }

      const hasWrappedData =
        payload && typeof payload === "object" && payload.data;
      const looksLikeHomeData =
        payload &&
        typeof payload === "object" &&
        (payload.lembaga || payload.navbar || payload.hero_title || payload.section_titles);

      if (!hasWrappedData && looksLikeHomeData) {
        response.data = {
          message: "Data beranda berhasil ditarik",
          data: payload,
        };
      } else if (hasWrappedData) {
        response.data = payload;
      }
    }

    return response;
  },
  (error) => {
    // -----------------------------------------------------------------
    // A. PENGECEKAN LISENSI APLIKASI TERKUNCI (403 Forbidden)
    // -----------------------------------------------------------------
    if (
      error.response &&
      error.response.status === 403 &&
      error.response.data?.kode_error === "LISENSI_TIDAK_VALID"
    ) {
      localStorage.removeItem("admin_data");
      localStorage.removeItem("siswa_data");

      if (window.location.pathname !== "/license-error") {
        window.location.href = "/license-error";
      }
      return Promise.reject(error);
    }

    // -----------------------------------------------------------------
    // B. PENGECEKAN SESI KEDALUWARSA (401 Unauthorized)
    // -----------------------------------------------------------------
    if (error.response && error.response.status === 401) {
      const isApiAdmin = error.config.url.startsWith("/admin");
      const isApiSiswa = error.config.url.startsWith("/siswa");

      if (isApiAdmin) {
        localStorage.removeItem("admin_data");
        window.location.href = "/admin/login?session=expired";
      } else if (isApiSiswa) {
        // PERBAIKAN: Tangkap kode lembaga sebelum data dihapus
        const siswaDataStr = localStorage.getItem("siswa_data");
        let kodeLembaga = "";
        if (siswaDataStr) {
          try {
            const data = JSON.parse(siswaDataStr);
            kodeLembaga = data.kode_lembaga;
          } catch (e) {}
        }

        localStorage.removeItem("siswa_data");

        // Arahkan ke URL dinamis yang benar, atau ke portal utama jika gagal
        if (kodeLembaga) {
          window.location.href = `/${kodeLembaga}/siswa/login?session=expired`;
        } else {
          window.location.href = "/"; 
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
