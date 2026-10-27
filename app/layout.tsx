import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "KetCode Website Design Assistant", description: "Bilingual assistant for KetCode website-design enquiries" };
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="ar" dir="rtl"><body>{children}</body></html>}
