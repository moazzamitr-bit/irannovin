import Link from "next/link";

const cards = [
  {
    label: "RELIABLE SUPPLY",
    desc: "Access to global manufacturers and strategic stock.",
    img: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=400&q=80",
  },
  {
    label: "TECHNICAL EXPERTISE",
    desc: "Engineering-driven procurement and quality assurance.",
    img: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80",
  },
  {
    label: "GLOBAL LOGISTICS",
    desc: "End-to-end logistics with compliance and efficiency.",
    img: "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=400&q=80",
  },
  {
    label: "TRUSTED PARTNER",
    desc: "Long-term partnerships built on transparency and performance.",
    img: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&q=80",
  },
];

export default function AboutSection() {
  return (
    <section className="bg-[#0a0a0b] py-24">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left */}
          <div>
            <p className="text-[#c8973d] text-xs font-semibold tracking-[0.3em] uppercase mb-4">
              ABOUT KHABARGAN ENERGY
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
              Engineering value.
              <br />
              Delivering impact.
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-md">
              Khabargan Energy, a strategic business unit of Iran Novin Group,
              operates at the intersection of energy, industry and international trade.
              We specialize in the procurement and supply of critical equipment,
              commodities and solutions for the oil & gas, petrochemical, mining
              and power sectors.
            </p>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 border border-[#c8973d]/40 text-[#c8973d] text-xs font-semibold tracking-wider px-6 py-3 hover:bg-[#c8973d] hover:text-black transition-all"
            >
              DISCOVER OUR STORY
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* Right: cards grid */}
          <div className="grid grid-cols-2 gap-3">
            {cards.map((card, i) => (
              <div
                key={i}
                className="relative overflow-hidden group cursor-pointer"
                style={{ aspectRatio: "1/1.1" }}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url(${card.img})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="text-[#c8973d] text-xs font-bold tracking-wider mb-1">{card.label}</div>
                  <div className="text-gray-300 text-xs leading-relaxed">{card.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
