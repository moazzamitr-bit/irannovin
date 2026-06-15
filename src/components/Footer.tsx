import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0b] border-t border-[#c8973d]/10">
      <div className="max-w-[1400px] mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8">
                <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
                  <polygon points="20,2 38,12 38,28 20,38 2,28 2,12" fill="none" stroke="#c8973d" strokeWidth="2"/>
                  <polygon points="20,8 32,15 32,25 20,32 8,25 8,15" fill="#c8973d" opacity="0.3"/>
                  <text x="20" y="24" textAnchor="middle" fill="#c8973d" fontSize="12" fontWeight="bold">K</text>
                </svg>
              </div>
              <div>
                <div className="text-white font-bold text-sm tracking-[0.2em]">KHABARGAN</div>
                <div className="text-[#c8973d] text-xs tracking-[0.3em]">ENERGY</div>
              </div>
            </div>
            <p className="text-gray-500 text-xs leading-relaxed max-w-xs">
              A strategic energy and industrial supply partner connecting global resources with regional potential.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-xs font-bold tracking-[0.2em] mb-5">QUICK LINKS</h4>
            <ul className="space-y-3">
              {["About Us", "Our Divisions", "Capabilities", "Industries", "Global Network", "Contact"].map((l) => (
                <li key={l}>
                  <Link href={`/${l.toLowerCase().replace(/\s+/g, "-")}`} className="text-gray-500 text-xs hover:text-[#c8973d] transition-colors tracking-wide">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Divisions */}
          <div>
            <h4 className="text-white text-xs font-bold tracking-[0.2em] mb-5">OUR DIVISIONS</h4>
            <ul className="space-y-3">
              {["Oil & Gas Equipment", "Petrochemical", "Copper & Metals", "Drilling & Offshore", "Industrial Projects", "Trade & Logistics"].map((l) => (
                <li key={l}>
                  <span className="text-gray-500 text-xs tracking-wide">{l}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white text-xs font-bold tracking-[0.2em] mb-5">CONTACT</h4>
            <div className="space-y-3">
              <p className="text-gray-500 text-xs leading-relaxed">Tehran, Iran<br/>Dubai, UAE</p>
              <p className="text-gray-500 text-xs">info@khabarganenergy.com</p>
              <p className="text-gray-500 text-xs">+98 21 XXXX XXXX</p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-xs">© 2024 Khabargan Energy. All rights reserved.</p>
          <p className="text-gray-600 text-xs">A strategic business unit of Iran Novin Group</p>
        </div>
      </div>
    </footer>
  );
}
