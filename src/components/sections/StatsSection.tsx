const stats = [
  { value: "$2B+", label: "Annual Trade Value", iconIndex: 0 },
  { value: "250+", label: "Successful Projects", iconIndex: 1 },
  { value: "15+", label: "Years of Experience", iconIndex: 2 },
  { value: "25+", label: "Countries Served", iconIndex: 3 },
  { value: "Global", label: "Network", iconIndex: 4 },
];

const icons = [
  <path key={0} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  <path key={1} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
  <path key={2} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />,
  <path key={3} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />,
  <path key={4} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
];

export default function StatsSection() {
  return (
    <section className="bg-[#111114] border-t border-b border-[#c8973d]/20">
      <div className="max-w-[1400px] mx-auto px-6 py-10">
        <div className="flex flex-wrap justify-between gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full border border-[#c8973d]/30 flex items-center justify-center text-[#c8973d]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {icons[stat.iconIndex]}
                </svg>
              </div>
              <div>
                <div className="text-white text-2xl font-black">{stat.value}</div>
                <div className="text-gray-400 text-xs tracking-wide">{stat.label}</div>
              </div>
              {i < stats.length - 1 && <div className="hidden lg:block w-px h-12 bg-gray-700 ml-4" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
