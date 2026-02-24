import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://stock-intelligence-seven.vercel.app",
  ),
  title: {
    default: "Stock Intelligence",
    template: "%s | Stock Intelligence",
  },
  description: "거시경제 + 지정학 기반 AI 투자 가이드 플랫폼",
  keywords: [
    "투자 가이드",
    "거시경제",
    "지정학 리스크",
    "주식 분석",
    "AI 투자",
    "ETF",
    "공포탐욕지수",
  ],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "Stock Intelligence",
    title: "Stock Intelligence",
    description: "거시경제 + 지정학 기반 AI 투자 가이드 플랫폼",
    images: [
      { url: "/og-image.png", width: 1200, height: 630, alt: "Stock Intelligence" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stock Intelligence",
    description: "거시경제 + 지정학 기반 AI 투자 가이드 플랫폼",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "StockAI",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/apple-touch-icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Stock Intelligence",
              description: "거시경제 + 지정학 기반 AI 투자 가이드 플랫폼",
              applicationCategory: "FinanceApplication",
              operatingSystem: "Web",
              offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
              inLanguage: "ko",
            }),
          }}
        />
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
