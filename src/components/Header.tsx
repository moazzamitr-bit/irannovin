"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const navLinks = [
  { label: "HOME", href: "/" },
  { label: "ABOUT US", href: "/about" },
  { label: "OUR DIVISIONS", href: "/divisions" },
  { label: "CAPABILITIES", href: "/capabilities" },
  { label: "INDUSTRIES", href: "/industries" },
  { label: "GLOBAL NETWORK", href: "/network" },
  { label: "NEWS", href: "/news" },
  { label: "CONTACT", href: "/contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[#0a0a0b]/95 backdrop-blur-sm shadow-lg" : "bg-transparent"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 relative">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <polygon points="20,2 38,12 38,28 20,38 2,28 2,12" fill="none" stroke="#c8973d" strokeWidth="2"/>
              <polygon points="20,8 32,15 32,25 20,32 8,25 8,15" fill="#c8973d" opacity="0.3"/>
              <text x="20" y="24" textAnchor="middle" fill="#c8973d" fontSize="12" fontWeight="bold">K</text>
            </svg>
          </div>
          <div>
            <div className="text-white font-bold text-sm tracking-[0.2em] leading-none">KHABARGAN</div>
            <div className="text-[#c8973d] font-light text-xs tracking-[0.3em] leading-none mt-0.5">ENERGY</div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden xl:flex items-center gap-6">
          {navLinks.map((link, i) => (
            <Link
              key={i}
              href={link.href}
              className={`text-xs font-medium tracking-wider transition-colors hover:text-[#c8973d] ${
                i === 0 ? "text-[#c8973d] border-b border-[#c8973d] pb-0.5" : "text-gray-300"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Link
            href="/contact"
            className="hidden md:inline-flex items-center gap-2 border border-[#c8973d] text-[#c8973d] text-xs font-semibold tracking-wider px-4 py-2 hover:bg-[#c8973d] hover:text-black transition-all duration-200"
          >
            REQUEST RFQ
          </Link>
          <button className="hidden md:flex items-center gap-1 text-gray-300 text-xs font-medium border border-gray-600 px-3 py-2 hover:border-[#c8973d] hover:text-[#c8973d] transition-colors">
            EN
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="xl:hidden text-white p-2"
          >
            <div className={`w-5 h-0.5 bg-white mb-1 transition-all ${mobileOpen ? "rotate-45 translate-y-1.5" : ""}`} />
            <div className={`w-5 h-0.5 bg-white mb-1 transition-all ${mobileOpen ? "opacity-0" : ""}`} />
            <div className={`w-5 h-0.5 bg-white transition-all ${mobileOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="xl:hidden bg-[#0a0a0b] border-t border-[#c8973d]/20 px-6 py-4">
          {navLinks.map((link, i) => (
            <Link
              key={i}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm text-gray-300 hover:text-[#c8973d] tracking-wider border-b border-gray-800 last:border-0"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/contact" className="mt-4 block text-center border border-[#c8973d] text-[#c8973d] text-xs py-2 tracking-wider">
            REQUEST RFQ
          </Link>
        </div>
      )}
    </header>
  );
}
