import AnimateOnScroll from "@/components/AnimateOnScroll";
import Counter from "@/components/Counter";

const reasons = [
  {
    title: "۳۴+ سال تجربه",
    desc: "سه دهه حضور در بازار ایران، با شناخت عمیق از رفتار مصرف‌کننده و دینامیک بازار.",
  },
  {
    title: "توانمندی ۳۶۰ درجه",
    desc: "از ایده تا اجرا، از خلاقیت تا دیجیتال، از رسانه تا تولید — همه زیر یک سقف.",
  },
  {
    title: "تیم‌های تخصصی",
    desc: "استراتژیست، خلاق، دیجیتال مارکتر، مدیر رسانه، تولیدکننده — هر تخصص، بهترین نفرات.",
  },
  {
    title: "تجربه برندهای بزرگ",
    desc: "سابقه همکاری با بزرگ‌ترین برندهای ایرانی در بانکداری، خودرو، FMCG و تلکام.",
  },
  {
    title: "اجرای کمپین‌های ملی",
    desc: "ظرفیت طراحی و اجرای کمپین‌های پیچیده در مقیاس ملی با هماهنگی چندکاناله.",
  },
  {
    title: "نگاه جدید به رشد",
    desc: "ترکیب تجربه ۳۴ ساله با مدل عملیاتی مدرن، داده، دیجیتال و هوش مصنوعی.",
  },
  {
    title: "شفافیت و پاسخگویی",
    desc: "گزارش‌دهی شفاف، نتایج قابل اندازه‌گیری و تعهد به رشد واقعی برند شما.",
  },
];

const stats = [
  { value: 34, suffix: "+", label: "سال تجربه" },
  { value: 700, suffix: "+", label: "متخصص" },
  { value: 70, suffix: "+", label: "خدمت" },
  { value: 500, suffix: "+", label: "برند همکار" },
];

export default function WhySection() {
  return (
    <section className="bg-[#0B0B0D] py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left */}
          <div>
            <AnimateOnScroll>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-px bg-[#C8102E]" />
                <span className="text-[#C8102E] text-sm font-semibold tracking-wide uppercase">چرا ایران‌نوین؟</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
                انتخاب شریک رشد
                <br />
                <span className="text-[#C8102E]">مناسب برند شما</span>
              </h2>
              <p className="text-white/50 text-lg leading-relaxed mb-10">
                ایران‌نوین ترکیب نادری از عمق تجربه، گستره توانمندی و مدل عملیاتی مدرن است
                که در بازار ایران کمتر می‌توان یافت.
              </p>
            </AnimateOnScroll>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-10">
              {stats.map((s, i) => (
                <AnimateOnScroll key={s.label} delay={i * 100}>
                  <div className="bg-white/5 rounded-sm p-6 border border-white/10">
                    <div className="text-4xl font-black text-white mb-1">
                      <Counter end={s.value} suffix={s.suffix} />
                    </div>
                    <div className="text-white/50 text-sm">{s.label}</div>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>

          {/* Right: reasons list */}
          <div className="space-y-4">
            {reasons.map((r, i) => (
              <AnimateOnScroll key={r.title} delay={i * 80}>
                <div className="group flex gap-4 p-5 rounded-sm border border-white/5 hover:border-[#C8102E]/30 hover:bg-white/3 transition-all">
                  <div className="flex-shrink-0 w-8 h-8 rounded-sm bg-[#C8102E]/10 border border-[#C8102E]/20 flex items-center justify-center">
                    <span className="text-[#C8102E] text-sm">✓</span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold mb-1">{r.title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed">{r.desc}</p>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
