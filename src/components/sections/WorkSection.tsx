import Link from "next/link";
import AnimateOnScroll from "@/components/AnimateOnScroll";

const cases = [
  {
    client: "بانک ملت",
    industry: "Banking & Fintech",
    industryFa: "بانکداری و فین‌تک",
    challenge: "افزایش آگاهی از برند در نسل جدید و جذب مشتریان دیجیتال",
    solution: "کمپین ۳۶۰ شامل تبلیغات دیجیتال، OOH و کانتنت برندینگ",
    services: ["Brand Strategy", "Digital", "OOH", "Content"],
    result: "+۴۲% آگاهی از برند",
    metric: "42",
    metricLabel: "Brand Awareness",
    color: "#1a3a6e",
  },
  {
    client: "ایران‌خودرو",
    industry: "Automotive",
    industryFa: "خودرو",
    challenge: "لانچ محصول جدید با حداکثر دسترسی و تبدیل",
    solution: "کمپین لانچ یکپارچه با رویداد، تبلیغات تلویزیونی، دیجیتال و رسانه",
    services: ["Creative", "TVC", "Event", "Social"],
    result: "+۸۵% نرخ تبدیل",
    metric: "85",
    metricLabel: "Conversion Rate",
    color: "#1e3a2f",
  },
  {
    client: "ایرانسل",
    industry: "Telecom",
    industryFa: "مخابرات",
    challenge: "رشد فروش محصولات دیجیتال و افزایش اشتراک",
    solution: "پرفورمنس مارکتینگ، بهینه‌سازی تبدیل و کمپین محتوایی",
    services: ["Performance", "SEO", "Analytics", "Creative"],
    result: "+۱۲۰% رشد لید",
    metric: "120",
    metricLabel: "Lead Growth",
    color: "#3a1e2f",
  },
  {
    client: "بانک پاسارگاد",
    industry: "Banking",
    industryFa: "بانکداری",
    challenge: "تقویت جایگاه برند به عنوان بانک نوآور",
    solution: "استراتژی محتوا، ریبرندینگ کمپین و رسانه یکپارچه",
    services: ["Brand Strategy", "Content", "Media Planning"],
    result: "+۶۰% Engagement",
    metric: "60",
    metricLabel: "Engagement",
    color: "#1e2a3a",
  },
];

export default function WorkSection() {
  return (
    <section className="bg-white py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateOnScroll>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-px bg-[#C8102E]" />
                <span className="text-[#C8102E] text-sm font-semibold tracking-wide uppercase">نمونه‌کارها</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-[#161616] leading-tight">
                نتایج واقعی،
                <br />
                <span className="text-[#C8102E]">برندهای واقعی</span>
              </h2>
            </div>
            <Link
              href="/work"
              className="text-[#161616] font-semibold border-b-2 border-[#C8102E] pb-0.5 text-sm hover:text-[#C8102E] transition-colors"
            >
              مشاهده همه نمونه‌کارها ←
            </Link>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cases.map((c, i) => (
            <AnimateOnScroll key={c.client} delay={i * 100}>
              <Link href="/work" className="group block">
                <div className="relative overflow-hidden rounded-sm bg-[#111113] aspect-[4/3]">
                  {/* Colored background */}
                  <div
                    className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500"
                    style={{ backgroundColor: c.color }}
                  />

                  {/* Abstract pattern */}
                  <div className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `radial-gradient(circle at 70% 30%, rgba(255,255,255,0.1) 0%, transparent 60%)`,
                    }}
                  />

                  {/* Big metric */}
                  <div className="absolute top-6 left-6 text-right">
                    <div className="text-6xl font-black text-white/20">+{c.metric}%</div>
                    <div className="text-white/40 text-xs mt-1">{c.metricLabel}</div>
                  </div>

                  {/* Content */}
                  <div className="absolute inset-0 p-8 flex flex-col justify-end">
                    <div className="mb-4">
                      <span className="inline-block bg-[#C8102E] text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
                        {c.industryFa}
                      </span>
                      <h3 className="text-white text-2xl font-black mb-1">{c.client}</h3>
                      <p className="text-white/60 text-sm">{c.challenge}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {c.services.map((s) => (
                        <span key={s} className="text-xs bg-white/10 text-white/70 px-2.5 py-1 rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#C8102E] font-bold text-lg">{c.result}</span>
                      <span className="text-white/40 text-sm group-hover:text-[#C8102E] transition-colors">مشاهده پروژه ←</span>
                    </div>
                  </div>
                </div>
              </Link>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
