import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthLayout } from "@/components/auth-layout";

export const metadata: Metadata = {
  title: "EFMP",
  description: "EFMP - E-Filing Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fontFamily = '"Funnel Display", system-ui, -apple-system, sans-serif';
  return (
    <html lang="en" style={{ fontFamily }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@300..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" style={{ fontFamily }}>
        <AuthLayout>
          {children}
        </AuthLayout>
        <Toaster />
      </body>
    </html>
  );
}
