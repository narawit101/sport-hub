/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["res.cloudinary.com"],
  },
  eslint: {
    // ปิดการแจ้งเตือน ESLint ตอน Build บน Vercel
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
