import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "RV Adventure Australia — Admin",
  description:
    "Admin panel for RV Adventure Australia caravan and camping accessories store",
  icons: {
    icon: "/fev_icon.png",
    shortcut: "/fev_icon.png",
    apple: "/fev_icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const apiBase = process.env.API_BASE ?? process.env.NEXT_PUBLIC_API_BASE ?? "https://dev-backend.rvadventureaustralia.com.au/api";
  const imgBase = process.env.IMG_BASE ?? process.env.NEXT_PUBLIC_IMG_BASE ?? "https://dev-backend.rvadventureaustralia.com.au";
  const runtimeConfig = `window.__RV_CONFIG__=${JSON.stringify({ apiBase, imgBase })};`;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: runtimeConfig }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
