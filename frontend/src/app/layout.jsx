import { Kanit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/app/contexts/AuthContext";
import { NotificationProvider } from "@/app/contexts/NotificationContext";
import { SocketProvider } from "@/app/contexts/SocketContext";

const kanitFont = Kanit({
  variable: "--font-kanit",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "600"],
});

export const metadata = {
  title: "แพลตฟอร์มจองสนามกีฬาออนไลน์",
  description: "แพลตฟอร์มจองสนามกีฬาออนไลน์",
  icons: {
    icon: "https://res.cloudinary.com/dlwfuul9o/image/upload/v1750926494/logo2_jxtkqq.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body className={`${kanitFont.variable} antialiased`}>
        <SocketProvider>
          <AuthProvider>
            <NotificationProvider>
              <div className="navbar">
                <Navbar></Navbar>
              </div>
              <div className="body">{children}</div>
              <footer>
                <Footer></Footer>
              </footer>
            </NotificationProvider>
          </AuthProvider>
        </SocketProvider>
      </body>
    </html>
  );
}
