import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import { AmplitudeProvider } from "@/lib/amplitude";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Team Performance Management",
  description: "Personal team performance management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/@react-grab/cursor/dist/client.global.js"
            strategy="lazyOnload"
          />
        )}
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AmplitudeProvider />
        {children}
      </body>
    </html>
  );
}
