import Link from "next/link";

const regions = [
  { label: "EUROPE", x: "35%", y: "22%" },
  { label: "CIS", x: "55%", y: "18%" },
  { label: "TURKEY", x: "42%", y: "30%" },
  { label: "CHINA", x: "72%", y: "28%" },
  { label: "AFRICA", x: "32%", y: "55%" },
  { label: "MIDDLE EAST", x: "53%", y: "42%" },
];

export default function GlobalNetworkSection() {
  return (
    <section className="bg-[#0a0a0b] py-24">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[#c8973d] text-xs font-semibold tracking-[0.3em] uppercase mb-4">GLOBAL NETWORK</p>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
              Connected to the world.
              <br />
              Committed to you.
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-md">
              With trusted partners and offices across key regions, we
              ensure fast response, local insight and global execution.
            </p>
            <Link
              href="/network"
              className="inline-flex items-center gap-2 border border-[#c8973d]/40 text-[#c8973d] text-xs font-semibold tracking-wider px-6 py-3 hover:bg-[#c8973d] hover:text-black transition-all"
            >
              VIEW ALL LOCATIONS
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          <div className="relative h-80 lg:h-96 bg-[#0d0d10] border border-[#c8973d]/10 overflow-hidden">
            <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
              <path fill="#c8973d" d="M60,80 L120,60 L200,70 L280,65 L360,78 L420,68 L480,85 L520,75 L560,90 L590,80 L620,95 L640,85 L660,100 L650,115 L630,120 L600,112 L570,125 L540,115 L510,130 L480,120 L450,135 L420,125 L390,140 L360,130 L330,145 L300,135 L270,150 L240,140 L210,155 L180,145 L150,160 L120,150 L90,165 L70,155 L55,145 L60,130 L65,115 L60,100 Z" />
              <path fill="#c8973d" d="M480,140 L540,130 L600,140 L650,135 L700,148 L720,160 L710,175 L690,180 L660,172 L630,185 L600,178 L570,190 L540,182 L510,195 L490,188 L475,175 L470,162 Z" />
              <path fill="#c8973d" d="M120,200 L180,190 L230,200 L270,195 L300,210 L290,230 L260,240 L220,235 L180,245 L150,238 L120,250 L100,240 L90,225 L100,212 Z" />
            </svg>

            <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.4 }}>
              <line x1="53%" y1="42%" x2="35%" y2="22%" stroke="#c8973d" strokeWidth="0.8" strokeDasharray="4,4" />
              <line x1="53%" y1="42%" x2="55%" y2="18%" stroke="#c8973d" strokeWidth="0.8" strokeDasharray="4,4" />
              <line x1="53%" y1="42%" x2="42%" y2="30%" stroke="#c8973d" strokeWidth="0.8" strokeDasharray="4,4" />
              <line x1="53%" y1="42%" x2="72%" y2="28%" stroke="#c8973d" strokeWidth="0.8" strokeDasharray="4,4" />
              <line x1="53%" y1="42%" x2="32%" y2="55%" stroke="#c8973d" strokeWidth="0.8" strokeDasharray="4,4" />
            </svg>

            {regions.map((r, i) => (
              <div key={i} className="absolute" style={{ left: r.x, top: r.y }}>
                <div className="relative">
                  <div className="w-2 h-2 bg-[#c8973d] rounded-full animate-pulse" />
                  <div className="absolute -top-5 left-3 text-[#c8973d] text-[9px] font-bold tracking-wider whitespace-nowrap">
                    {r.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
