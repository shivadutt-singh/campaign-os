import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// FIX 1: Professional Metadata for Hackathon & Deployment
export const metadata: Metadata = {
  title: "CampaignOS | NetElixir AIgnition",
  description: "Next-Gen B2B Digital Marketing Suite powered by Offline AI and Probabilistic Math.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-screen overflow-hidden bg-[#0a0a0a] text-neutral-200 antialiased">
        <Sidebar />
        <main className="flex-1 h-full overflow-y-auto print:overflow-visible relative print:block">{children}</main>
      </body>
    </html>
  );
}