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
  description: "Prissammenligning for Pokémon TCG i Norge, Sverige og Danmark",
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
      </body>
    </html>
  );
}