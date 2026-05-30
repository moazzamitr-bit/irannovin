import AnimateOnScroll from "@/components/AnimateOnScroll";

const pillars = [
  {
    title: "Strategy-led",
    fa: "استراتژی‌محور",
    desc: "هر کمپین با تحلیل بازار، بینش مصرف‌کننده و تعریف دقیق هدف آغاز می‌شود.",
    icon: "◈",
  },
  {
    title: "Creative-powered",
    fa: "خلاقیت‌محور",
    desc: "ایده‌هایی که متمایز می‌کنند، داستان می‌گویند و اثر می‌گذارند.",
    icon: "◇",
  },
  {
    title: "Media-integrated",
    fa: "رسانه یکپارچه",
    desc: "پوشش ۳۶۰ درجه از رسانه‌های سنتی تا دیجیتال، OOH، ایونت و BTL.",
    icon: "◎",
  },
  {
    title: "Digital & data-enabled",
    fa: "دیجیتال و داده‌محور",
    desc: "بهره‌گیری از داده، پرفورمنس مارکتینگ و تکنولوژی برای تصمیم‌گیری هوشمند.",
    icon: "◉",
  },
];

export default function RepositioningSection() {
  return (
    <section className="bg-[#F7F7F5] py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <AnimateOnScroll>
          <div className="max-w-3xl mb-16">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-px bg-[#C8102E]" />
              <span className="text-[#C8102E] text-sm font-semibold tracking-wide uppercase">درباره ایران‌نوین</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-[#161616] leading-tight mb-6">
              ایران‌نوین؛{" "}
              <span className="text-[#C8102E]">فراتر از</span>{" "}
              یک کانون تبلیغاتی
            </h2>
            <p className="text-lg text-[#6B6B6B] leading-relaxed">
              ما مجموعه‌ای از توانمندی‌های تخصصی را در یک ساختار یکپارچه کنار هم قرار می‌دهیم تا
              برندها فقط کمپین اجرا نکنند، بلکه رشد کنند، دیده شوند، تجربه بسازند و رابطه
              بلندمدت با مخاطب ایجاد کنند.
            </p>
          </div>
        </AnimateOnScroll>

        {/* Pillars grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((p, i) => (
            <AnimateOnScroll key={p.title} delay={i * 100}>
              <div className="group bg-white rounded-sm p-8 border border-[#E9E6E1] hover:border-[#C8102E]/30 card-hover cursor-default">
                <div className="text-3xl mb-6 text-[#C8102E]">{p.icon}</div>
                <div className="text-xs text-[#C8102E] font-semibold tracking-wider mb-2 uppercase">{p.title}</div>
                <h3 className="text-xl font-bold text-[#161616] mb-3">{p.fa}</h3>
                <p className="text-sm text-[#6B6B6B] leading-relaxed">{p.desc}</p>
                <div className="mt-6 w-8 h-0.5 bg-[#E9E6E1] group-hover:bg-[#C8102E] transition-colors duration-300" />
              </div>
            </AnimateOnScroll>
          ))}
        </div>

        {/* Bottom statement */}
        <AnimateOnScroll delay={400}>
          <div className="mt-16 bg-[#0B0B0D] rounded-sm p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-white text-xl md:text-2xl font-bold leading-relaxed">
                «یک ایران‌نوین: استراتژی، خلاقیت، رسانه، دیجیتال، تجربه و تولید —
                <span className="text-[#C8102E]"> یکپارچه حول رشد برند.»</span>
              </p>
            </div>
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-[#C8102E] rounded-sm flex items-center justify-center">
                <span className="text-white text-2xl font-black">IN</span>
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
