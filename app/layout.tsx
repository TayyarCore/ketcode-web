import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Ket Code — AI Sales Assistant Preview", description: "Bilingual website-design sales assistant preview" };
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="ar" dir="rtl"><body>{children}</body></html>}
