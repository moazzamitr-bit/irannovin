import AnimateOnScroll from "@/components/AnimateOnScroll";
import Link from "next/link";

const pillars = [
  {
    title: "Strategy-led",
    fa: "استراتژی‌محور",
    desc: "هر کمپین با تحلیل بازار، بینش مصرف‌کننده و تعریف دقیق هدف آغاز می‌شود.",
    icon: "◈",
    stat: "۱۰۰+",
    statLabel: "کمپین استراتژیک",
  },
  {
    title: "Creative-powered",
    fa: "خلاقیت‌محور",
    desc: "ایده‌هایی که متمایز می‌کنند، داستان می‌گویند و اثر می‌گذارند.",
    icon: "◇",
    stat: "۷۰۰+",
    statLabel: "متخصص خلاق",
  },
  {
    title: "Media-integrated",
    fa: "رسانه یکپارچه",
    desc: "پوشش ۳۶۰ درجه از رسانه‌های سنتی تا دیجیتال، OOH، ایونت و BTL.",
    icon: "◎",
    stat: "۳۶۰°",
    statLabel: "پوشش کانال",
  },
  {
    title: "Digital & data-enabled",
    fa: "دیجیتال و داده‌محور",
    desc: "بهره‌گیری از داده، پرفورمنس مارکتینگ و تکنولوژی برای تصمیم‌گیری هوشمند.",
    icon: "◉",
    stat: "۲۴/۷",
    statLabel: "تحلیل و بهینه‌سازی",
  },
];

export default function RepositioningSection() {
  return (
    <section className="bg-[#F7F7F5] py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <AnimateOnScroll>
          <div className="max-w-4xl mb-20">
            <div className="flex items-center gap-3 mb-8">
              <span className="w-8 h-px bg-[#C8102E]" />
              <span className="text-[#C8102E] text-sm font-semibold tracking-wide uppercase">درباره ایران‌نوین</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#161616] leading-tight mb-8">
              ایران‌نوین؛{" "}
              <span className="text-[#C8102E]">فراتر از</span>{" "}
              یک کانون تبلیغاتی
            </h2>
            <p className="text-xl text-[#6B6B6B] leading-relaxed max-w-3xl">
              ما مجموعه‌ای از توانمندی‌های تخصصی را در یک ساختار یکپارچه کنار هم قرار می‌دهیم تا
              برندها فقط کمپین اجرا نکنند، بلکه رشد کنند، دیده شوند، تجربه بسازند و رابطه
              بلندمدت با مخاطب ایجاد کنند.
            </p>
          </div>
        </AnimateOnScroll>

        {/* Pillars grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {pillars.map((p, i) => (
            <AnimateOnScroll key={p.title} delay={i * 100}>
              <div className="group bg-white rounded-sm p-8 border border-[#E9E6E1] hover:border-[#C8102E]/20 hover:shadow-xl hover:shadow-[#C8102E]/5 transition-all duration-300 card-hover cursor-default">
                <div className="flex items-start justify-between mb-6">
                  <span className="text-3xl text-[#C8102E] group-hover:scale-110 transition-transform inline-block">{p.icon}</span>
                  <div className="text-right">
                    <div className="text-2xl font-black text-[#161616]">{p.stat}</div>
                    <div className="text-[#6B6B6B] text-[10px]">{p.statLabel}</div>
                  </div>
                </div>
                <div className="text-[10px] text-[#C8102E] font-bold tracking-wider mb-2 uppercase">{p.title}</div>
                <h3 className="text-xl font-black text-[#161616] mb-3">{p.fa}</h3>
                <p className="text-sm text-[#6B6B6B] leading-relaxed">{p.desc}</p>
                <div className="mt-6 w-8 h-0.5 bg-[#E9E6E1] group-hover:bg-[#C8102E] transition-colors duration-300 group-hover:w-16" />
              </div>
            </AnimateOnScroll>
          ))}
        </div>

        {/* Bottom statement */}
        <AnimateOnScroll delay={400}>
          <div className="mt-14 bg-[#0B0B0D] rounded-sm p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <p className="text-white text-xl md:text-2xl font-bold leading-relaxed">
                «یک ایران‌نوین: استراتژی، خلاقیت، رسانه، دیجیتال، تجربه و تولید —
                <span className="text-[#C8102E]"> یکپارچه حول رشد برند.»</span>
              </p>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <Link
                href="/about"
                className="text-white/60 hover:text-white text-sm font-medium transition-colors whitespace-nowrap"
              >
                بیشتر بدانید
              </Link>
              <Link
                href="/contact"
                className="bg-[#C8102E] hover:bg-[#A50D25] text-white font-bold px-6 py-3 rounded-sm transition-all whitespace-nowrap text-sm"
              >
                شروع همکاری ←
              </Link>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
