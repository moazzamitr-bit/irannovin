const industries = [
  {
    label: "OIL & GAS",
    img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80",
  },
  {
    label: "PETROCHEMICAL",
    img: "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=600&q=80",
  },
  {
    label: "MINING & METALS",
    img: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80",
  },
  {
    label: "REFINERIES",
    img: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=600&q=80",
  },
  {
    label: "POWER PLANTS",
    img: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=600&q=80",
  },
  {
    label: "EPC & INDUSTRIAL PROJECTS",
    img: "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=600&q=80",
  },
];

export default function IndustriesSection() {
  return (
    <section className="bg-[#0a0a0b] py-24">
      <div className="max-w-[1400px] mx-auto px-6">
        <p className="text-[#c8973d] text-xs font-semibold tracking-[0.3em] uppercase mb-8">INDUSTRIES SERVED</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {industries.map((ind, i) => (
            <div key={i} className="relative overflow-hidden group cursor-pointer" style={{ aspectRatio: "3/4" }}>
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ backgroundImage: `url(${ind.img})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute inset-0 border border-[#c8973d]/0 group-hover:border-[#c8973d]/40 transition-colors" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="text-white text-xs font-bold tracking-wider">{ind.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
