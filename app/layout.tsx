import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "تيّار",
  description: "منصة تيّار العقارية",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
