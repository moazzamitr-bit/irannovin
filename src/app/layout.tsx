import type { Metadata } from "next";
import "./globals.css";
import FloatingCTA from "@/components/FloatingCTA";

export const metadata: Metadata = {
  title: "کانون ایران‌نوین | گروه تبلیغات و بازاریابی یکپارچه",
  description: "ایران‌نوین؛ شریک یکپارچه رشد برندها. از استراتژی و خلاقیت تا رسانه، دیجیتال، تولید، تجربه و اجرا.",
  keywords: "کانون تبلیغاتی, آژانس بازاریابی, تبلیغات ایران, استراتژی برند, دیجیتال مارکتینگ",
  openGraph: {
    title: "کانون ایران‌نوین | گروه بازاریابی یکپارچه",
    description: "شریک یکپارچه رشد برندها در ایران",
    locale: "fa_IR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100;200;300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#F7F7F5] text-[#161616]" style={{ fontFamily: "'Vazirmatn', 'Inter', sans-serif" }}>
        {children}
        <FloatingCTA />
</body>
    </html>
  );
}
