import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "@/components/ui/toaster";
import { headers } from "next/headers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});

const chironGoRound = localFont({
  src: "./fonts/ChironGoRoundTC-VariableFont_wght.ttf",
  variable: "--font-chiron",
});

export const metadata: Metadata = {
  title: "Virtual power plant",
  description: "Fortune behind-meter sites management system",
  icons: "/favicon.ico",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerList = await headers();
  const nonce = headerList.get("x-nonce") || "";

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${chironGoRound.variable}`}>
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: "" }} />
      </body>
    </html>
  );
}
