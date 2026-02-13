import type { Metadata } from "next";
import { Geist } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "./components/Header";
import { AuthProvider } from "./auth/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const soledago = localFont({
  src: [
    {
      path: "../public/fonts/Soledago.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-soledago",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Социальный вишлист",
  description: "Создавай списки желаний, делись с друзьями, собирай подарки без повторов.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`light-mode ${geistSans.variable} ${soledago.variable}`}>
      <body className={`${geistSans.className} antialiased bg-gradient-to-b from-[#fff7f2] via-white to-[#f4fbf8] text-zinc-900`}>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <div className="flex-1">{children}</div>
            <footer className="border-t border-pink-200/50 bg-white/70 py-6 text-xs text-gray-600 backdrop-blur-sm">
  <div className="mx-auto flex max-w-6xl items-center justify-between px-4">
    
    {/* Левая часть - логотип и название */}
    <div className="flex items-center gap-2">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-pink-200 to-pink-300 text-sm font-semibold text-pink-800 shadow-sm">
        WL
      </span>
      <span className="bg-gradient-to-r from-pink-500 to-pink-400 bg-clip-text text-sm font-semibold text-transparent">
        wishlist
      </span>
    </div>
    
    {/* Правая часть - слоган */}
    <p className="text-[10px] text-gray-500">
      Покупай друзьям то, что они <span className="text-pink-500">действительно</span> хотят
    </p>
    
  </div>
</footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}