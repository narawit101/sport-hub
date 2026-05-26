const API_URL = process.env.NEXT_PUBLIC_API_URL;

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

    const localToken = tokenStorage.get();

    const { skipRedirect, ...fetchOptions } = options;

    const config = {
      ...fetchOptions,
      credentials: "include",
      headers: {
        ...fetchOptions.headers,
        ...(localToken ? { Authorization: `Bearer ${localToken}` } : {}),
      },
    };

    if (fetchOptions.body) {
      if (fetchOptions.body instanceof FormData) {
        config.body = fetchOptions.body;
      } else {
        config.headers["Content-Type"] = "application/json";
        config.body = typeof fetchOptions.body === "string" ? fetchOptions.body : JSON.stringify(fetchOptions.body);
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

      if (response.status === 401 && !skipRedirect && typeof window !== "undefined") {
        const isPublicPath = ["/profile/"].some((p) => window.location.pathname.startsWith(p));
        if (!isPublicPath) {
          const redirect = encodeURIComponent(window.location.pathname + window.location.search);
          sessionStorage.setItem("login_message", "กรุณาเข้าสู่ระบบก่อนใช้งาน");
          window.location.href = `/login?redirect=${redirect}`;
          await new Promise(() => {});
        }
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
