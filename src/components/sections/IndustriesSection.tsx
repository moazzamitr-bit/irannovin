import Link from "next/link";
import AnimateOnScroll from "@/components/AnimateOnScroll";

const industries = [
  { icon: "🏦", name: "بانک، بیمه و فین‌تک", en: "Banking & Fintech", count: "۱۲+ پروژه" },
  { icon: "🛒", name: "FMCG و مواد غذایی", en: "FMCG & Food", count: "۲۰+ پروژه" },
  { icon: "🚗", name: "خودرو", en: "Automotive", count: "۱۵+ پروژه" },
  { icon: "📱", name: "لوازم خانگی", en: "Home Appliances", count: "۸+ پروژه" },
  { icon: "📡", name: "تلکام و پلتفرم", en: "Telecom & Platforms", count: "۱۰+ پروژه" },
  { icon: "🏗️", name: "مسکن و ساخت‌وساز", en: "Real Estate", count: "۹+ پروژه" },
  { icon: "🛍️", name: "خرده‌فروشی", en: "Retail", count: "۱۴+ پروژه" },
  { icon: "✈️", name: "گردشگری و هتل", en: "Tourism & Hospitality", count: "۶+ پروژه" },
  { icon: "🏥", name: "سلامت", en: "Healthcare", count: "۷+ پروژه" },
  { icon: "🏭", name: "B2B و صنعتی", en: "B2B & Industrial", count: "۵+ پروژه" },
];

export default function IndustriesSection() {
  return (
    <section className="bg-[#F7F7F5] py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateOnScroll>
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="w-8 h-px bg-[#C8102E]" />
              <span className="text-[#C8102E] text-sm font-semibold tracking-wide uppercase">صنایع</span>
              <span className="w-8 h-px bg-[#C8102E]" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-[#161616] leading-tight mb-4">
              ساخته شده برای{" "}
              <span className="text-[#C8102E]">صنایع پیچیده</span>
            </h2>
            <p className="text-[#6B6B6B] text-lg max-w-2xl mx-auto">
              تجربه عمیق در صنایع مختلف، ما را قادر می‌سازد راهکارهای متناسب با هر بازار ارائه دهیم.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {industries.map((ind, i) => (
            <AnimateOnScroll key={ind.name} delay={i * 60}>
              <Link href="/industries" className="group block">
                <div className="bg-white border border-[#E9E6E1] rounded-sm p-6 text-center hover:border-[#C8102E]/30 hover:bg-[#0B0B0D] transition-all duration-300 card-hover">
                  <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">{ind.icon}</div>
                  <h3 className="text-[#161616] group-hover:text-white font-bold text-sm mb-1 transition-colors">{ind.name}</h3>
                  <p className="text-[#6B6B6B] group-hover:text-white/40 text-xs transition-colors">{ind.en}</p>
                  <div className="mt-3 text-[#C8102E] text-xs font-semibold">{ind.count}</div>
                </div>
              </Link>
            </AnimateOnScroll>
          ))}
        </div>

        <AnimateOnScroll delay={600}>
          <div className="mt-12 text-center">
            <Link
              href="/industries"
              className="inline-flex items-center gap-3 bg-[#0B0B0D] text-white font-semibold px-8 py-4 rounded-sm hover:bg-[#C8102E] transition-all"
            >
              مشاهده راهکارهای تخصصی هر صنعت ←
            </Link>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
