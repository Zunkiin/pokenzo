import { Analytics } from '@vercel/analytics/next'
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from '@/components/navbar'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Pokenzo",
  description: "Price comparison for Pokémon TCG in Scandinavia, Pokemon Go and TCG Hub",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="no"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-[#14151F] text-[#EDEAE3] min-h-screen">
        <Navbar />
        {children}
        <Analytics />
    </body>
    </html>
  );
}