"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function FloatingCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-8 left-8 z-40 hidden lg:block transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <Link
        href="/contact"
        className="flex items-center gap-3 bg-[#C8102E] hover:bg-[#A50D25] text-white font-bold px-6 py-3.5 rounded-sm shadow-2xl shadow-red-900/40 transition-all hover:-translate-y-0.5 hover:shadow-red-900/60"
      >
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        شروع همکاری
      </Link>
    </div>
  );
}
