"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const navItems = [
  { label: "خانه", href: "/" },
  { label: "درباره ما", href: "/about" },
  { label: "توانمندی‌ها", href: "/services" },
  { label: "نمونه‌کارها", href: "/work" },
  { label: "صنایع", href: "/industries" },
  { label: "بینش‌ها", href: "/insights" },
  { label: "فرصت‌های شغلی", href: "/careers" },
  { label: "تماس با ما", href: "/contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#0B0B0D]/95 backdrop-blur-xl border-b border-white/5 py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-[#C8102E] rounded-sm flex items-center justify-center group-hover:bg-[#A50D25] transition-colors">
              <span className="text-white font-bold text-sm leading-none">IN</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-white font-bold text-base tracking-tight">ایران‌نوین</span>
              <span className="text-white/40 text-[10px] font-light tracking-wider">IRAN NOVIN GROUP</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-white/70 hover:text-white text-sm font-medium transition-colors relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 right-0 w-0 h-px bg-[#C8102E] transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden lg:flex items-center gap-4">
            <Link
              href="/contact"
              className="bg-[#C8102E] hover:bg-[#A50D25] text-white text-sm font-semibold px-5 py-2.5 rounded-sm transition-all duration-200 hover:shadow-lg hover:shadow-red-900/20"
            >
              شروع همکاری
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden flex flex-col gap-1.5 p-2"
            aria-label="منو"
          >
            <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-400 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0 bg-[#0B0B0D]/98 backdrop-blur-xl" onClick={() => setMenuOpen(false)} />
        <nav
          className={`absolute top-0 right-0 h-full w-full max-w-xs bg-[#111113] flex flex-col p-8 pt-24 transition-transform duration-400 ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {navItems.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="text-white/80 hover:text-white text-xl font-medium py-4 border-b border-white/5 transition-colors"
              style={{ transitionDelay: `${i * 50}ms` }}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/contact"
            onClick={() => setMenuOpen(false)}
            className="mt-8 bg-[#C8102E] text-white text-center py-3.5 rounded-sm font-semibold"
          >
            شروع همکاری
          </Link>
        </nav>
      </div>
    </>
  );
}
