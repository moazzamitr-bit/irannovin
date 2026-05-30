import AnimateOnScroll from "@/components/AnimateOnScroll";

const layers = [
  {
    number: "۰۱",
    title: "Commercial & Client Growth",
    fa: "رشد تجاری و توسعه مشتریان",
    desc: "جذب مشتری، توسعه همکاری، طراحی راهکار، مدیریت رابطه و رشد اکانت‌ها.",
    color: "#C8102E",
    tags: ["Account Growth", "Client Partnership", "Business Development", "Solution Design"],
  },
  {
    number: "۰۲",
    title: "Practices & Capabilities",
    fa: "تخصص‌ها و توانمندی‌ها",
    desc: "استراتژی، خلاقیت، دیجیتال، رسانه، تولید، تجربه، محتوا، تکنولوژی و داده.",
    color: "#161616",
    tags: ["Strategy", "Creative", "Digital", "Media", "Production", "Experience", "Data & Tech"],
  },
  {
    number: "۰۳",
    title: "Operations, Finance & Delivery",
    fa: "عملیات، مالی و تحویل",
    desc: "مدیریت پروژه، کنترل کیفیت، زمان‌بندی، سودآوری، شفافیت مالی و تحویل قابل اعتماد.",
    color: "#4A4A4A",
    tags: ["Project Management", "Quality Control", "Financial Transparency", "Delivery"],
  },
];

export default function ModelSection() {
  return (
    <section className="bg-[#111113] py-24 md:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateOnScroll>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="w-8 h-px bg-[#C8102E]" />
              <span className="text-[#C8102E] text-sm font-semibold tracking-wide uppercase">مدل عملیاتی</span>
              <span className="w-8 h-px bg-[#C8102E]" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
              مدل یکپارچه{" "}
              <span className="text-[#C8102E]">ایران‌نوین</span>
            </h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              یک سیستم یکپارچه که در هر لایه، بهترین تخصص‌ها را به هم متصل می‌کند.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="space-y-4 max-w-4xl mx-auto">
          {layers.map((layer, i) => (
            <AnimateOnScroll key={layer.number} delay={i * 150}>
              <div className="group relative overflow-hidden rounded-sm border border-white/10 hover:border-white/20 transition-all duration-300">
                {/* Background */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                  style={{ backgroundColor: layer.color }}
                />

                <div className="relative p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                  {/* Number */}
                  <div className="flex-shrink-0">
                    <span
                      className="text-5xl font-black leading-none"
                      style={{ color: i === 0 ? "#C8102E" : "rgba(255,255,255,0.1)" }}
                    >
                      {layer.number}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="text-white/40 text-xs font-semibold tracking-wider mb-1 uppercase">
                      {layer.title}
                    </div>
                    <h3 className="text-white text-xl md:text-2xl font-bold mb-3">{layer.fa}</h3>
                    <p className="text-white/60 text-sm leading-relaxed mb-4">{layer.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {layer.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-3 py-1 rounded-full border border-white/10 text-white/50"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[#C8102E] text-2xl">←</span>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          ))}
        </div>

        {/* Center visual */}
        <AnimateOnScroll delay={450}>
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-4 bg-[#C8102E]/10 border border-[#C8102E]/30 rounded-sm px-8 py-4">
              <div className="w-3 h-3 rounded-full bg-[#C8102E] animate-pulse" />
              <span className="text-white font-semibold">یک سیستم یکپارچه • یک تیم • یک هدف: رشد برند شما</span>
              <div className="w-3 h-3 rounded-full bg-[#C8102E] animate-pulse" />
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
