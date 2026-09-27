import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { QueryProvider } from "@/components/providers/query-provider";
import { SnackbarProvider } from "@/components/providers/snackbar-provider";

import "./globals.css";

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
    default: "Blivap Admin",
    template: "%s · Blivap Admin",
  },
  description: "Operations dashboard for Blivap live blood donor matching",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <SnackbarProvider>{children}</SnackbarProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
