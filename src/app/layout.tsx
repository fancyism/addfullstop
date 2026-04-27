import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AddFullStop — Fix ChatGPT Trailing Spaces Instantly",
    template: "%s | AddFullStop",
  },
  description:
    "Free online tool to fix ChatGPT-generated text. Automatically adds periods to lines with trailing whitespace. Paste, upload, or use the CLI.",
  keywords: [
    "ChatGPT text fixer",
    "add full stop",
    "trailing whitespace remover",
    "AI text formatter",
    "ChatGPT formatter",
    "text processing tool",
  ],
  authors: [{ name: "AddFullStop" }],
  creator: "AddFullStop",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "AddFullStop",
    title: "AddFullStop — Fix ChatGPT Trailing Spaces Instantly",
    description:
      "Free tool to fix ChatGPT text. Adds periods to lines with trailing whitespace automatically.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AddFullStop — Fix ChatGPT Trailing Spaces",
    description:
      "Free tool to fix ChatGPT text. Adds periods to lines with trailing whitespace.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Google AdSense — replace ca-pub-XXXXXXX with your publisher ID when ready */}
        {/* <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXX" crossOrigin="anonymous" /> */}
      </head>
      <body className="flex min-h-screen flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
