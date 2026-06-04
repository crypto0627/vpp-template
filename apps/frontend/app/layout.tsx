import type { Metadata, Viewport } from "next";
import { Noto_Sans } from "next/font/google";
import { AuthProvider } from "@/components/providers/auth-provider";
import { NotificationProvider } from "@/components/providers/notification-provider";
import { AdminAiChatButton } from "@/components/ai-chat/admin-ai-chat-button";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Fortune VPP",
  description: "Manage your energy sites with ease using Fortune VPP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${notoSans.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <NotificationProvider>{children}</NotificationProvider>
          <AdminAiChatButton />
        </AuthProvider>
      </body>
    </html>
  );
}
