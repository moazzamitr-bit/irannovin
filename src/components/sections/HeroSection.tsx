"use client";
import Link from "next/link";

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    label: "OIL & GAS",
    sub: "EQUIPMENT",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    label: "PETROCHEMICAL",
    sub: "SUPPLY",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    label: "COPPER",
    sub: "EXPORT",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    label: "DRILLING &",
    sub: "OFFSHORE SOLUTIONS",
  },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(to right, rgba(10,10,11,0.95) 40%, rgba(10,10,11,0.5) 70%, rgba(10,10,11,0.3) 100%),
              url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1800&q=80') center/cover no-repeat
            `,
          }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,10,11,0.3) 0%, transparent 30%, transparent 70%, rgba(10,10,11,0.8) 100%)" }} />
      </div>

      {/* Slide indicators - right side */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-3">
        {["01", "02", "03", "04"].map((n, i) => (
          <div key={n} className={`text-xs font-mono transition-all ${i === 0 ? "text-[#c8973d]" : "text-gray-600"}`}>
            {n}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 pt-24 pb-16">
        {/* Tag */}
        <p className="text-[#c8973d] text-xs font-semibold tracking-[0.3em] uppercase mb-6">
          STRATEGIC ENERGY & INDUSTRIAL SUPPLY PARTNER
        </p>

        {/* Headline */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-none tracking-tight mb-6 max-w-3xl">
          POWERING INDUSTRY.
          <br />
          DELIVERING TRUST.
        </h1>

        {/* Subtitle */}
        <p className="text-gray-300 text-base max-w-lg mb-10 leading-relaxed">
          Khabargan Energy connects global resources with regional potential
          through secure supply, technical excellence and unwavering commitment.
        </p>

        {/* Feature icons */}
        <div className="flex flex-wrap gap-6 mb-10">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="text-[#c8973d]">{f.icon}</div>
              <div className="text-white text-xs font-semibold leading-tight">
                <div>{f.label}</div>
                <div className="text-gray-400">{f.sub}</div>
              </div>
              {i < features.length - 1 && <div className="w-px h-8 bg-gray-700 ml-4" />}
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-wrap gap-4">
          <Link
            href="/capabilities"
            className="inline-flex items-center gap-2 bg-[#c8973d] text-black text-xs font-bold tracking-wider px-7 py-3.5 hover:bg-[#e8b86d] transition-colors"
          >
            EXPLORE OUR CAPABILITIES
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 border border-white/40 text-white text-xs font-bold tracking-wider px-7 py-3.5 hover:border-[#c8973d] hover:text-[#c8973d] transition-colors"
          >
            REQUEST PARTNERSHIP
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
