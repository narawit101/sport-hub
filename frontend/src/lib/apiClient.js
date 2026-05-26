const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Key ที่ใช้เก็บ token ใน localStorage
const TOKEN_KEY = "auth_token";

export const tokenStorage = {
  get: () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  set: (token) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, token);
  },
  remove: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
  },
};

const apiClient = {
  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;

    // อ่าน token จาก localStorage เพื่อส่งเป็น Authorization header
    // (fallback สำหรับ mobile ที่บล็อค 3rd-party cookie)
    const localToken = tokenStorage.get();

    const config = {
      ...options,
      credentials: "include",
      headers: {
        ...options.headers,
        ...(localToken ? { Authorization: `Bearer ${localToken}` } : {}),
      },
    };

    if (options.body) {
      if (options.body instanceof FormData) {
        config.body = options.body;
        // Browser will set multipart/form-data with boundary
      } else {
        config.headers["Content-Type"] = "application/json";
        config.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
      }
    }

    try {
      const response = await fetch(url, config);
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
          data = await response.json();
      } else {
          data = await response.text();
      }

      if (!response.ok || data?.error) {
        const errorMessage = data?.error || data?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ API";
        const error = new Error(errorMessage);
        error.status = response.status;
        throw error;
      }
      return data;
    } catch (error) {
      throw error;
    }
  },
  get(endpoint, options) { return this.request(endpoint, { ...options, method: "GET" }); },
  post(endpoint, body, options) { return this.request(endpoint, { ...options, method: "POST", body }); },
  postForm(endpoint, body, options) { 
    let finalBody = body;
    if (!(body instanceof FormData) && typeof body === "object" && body !== null) {
      finalBody = new FormData();
      for (const key in body) {
        finalBody.append(key, body[key]);
      }
    }
    return this.request(endpoint, { ...options, method: "POST", body: finalBody }); 
  },
  put(endpoint, body, options) { return this.request(endpoint, { ...options, method: "PUT", body }); },
  putForm(endpoint, body, options) { 
    let finalBody = body;
    if (!(body instanceof FormData) && typeof body === "object" && body !== null) {
      finalBody = new FormData();
      for (const key in body) {
        finalBody.append(key, body[key]);
      }
    }
    return this.request(endpoint, { ...options, method: "PUT", body: finalBody }); 
  },
  patch(endpoint, body, options) { return this.request(endpoint, { ...options, method: "PATCH", body }); },
  patchForm(endpoint, body, options) { 
    let finalBody = body;
    if (!(body instanceof FormData) && typeof body === "object" && body !== null) {
      finalBody = new FormData();
      for (const key in body) {
        finalBody.append(key, body[key]);
      }
    }
    return this.request(endpoint, { ...options, method: "PATCH", body: finalBody }); 
  },
  delete(endpoint, body, options) { return this.request(endpoint, { ...options, method: "DELETE", body }); },
};
export default apiClient;
