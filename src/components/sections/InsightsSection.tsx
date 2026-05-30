import Link from "next/link";
import AnimateOnScroll from "@/components/AnimateOnScroll";

const articles = [
  {
    category: "Brand Growth",
    categoryFa: "رشد برند",
    title: "چرا آژانس‌های تبلیغاتی باید از رسانه‌فروشی به راهکارفروشی حرکت کنند؟",
    excerpt: "تحول بازار تبلیغات ایران و ضرورت تغییر مدل کسب‌وکار برای بقا و رشد.",
    readTime: "۷ دقیقه",
    date: "آذر ۱۴۰۳",
    color: "#C8102E",
  },
  {
    category: "Campaign Strategy",
    categoryFa: "استراتژی کمپین",
    title: "مدل کمپین ۳۶۰ در بازار امروز ایران",
    excerpt: "چگونه یک کمپین یکپارچه در همه کانال‌ها به رشد پایدار برند کمک می‌کند.",
    readTime: "۵ دقیقه",
    date: "آبان ۱۴۰۳",
    color: "#1e3a6e",
  },
  {
    category: "AI in Marketing",
    categoryFa: "هوش مصنوعی",
    title: "نقش هوش مصنوعی در آینده بازاریابی برندها",
    excerpt: "از پرسونالایزیشن تا بهینه‌سازی خودکار کمپین — AI چه تغییراتی ایجاد می‌کند؟",
    readTime: "۸ دقیقه",
    date: "مهر ۱۴۰۳",
    color: "#1e3a2f",
  },
];

export default function InsightsSection() {
  return (
    <section className="bg-[#F7F7F5] py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateOnScroll>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-px bg-[#C8102E]" />
                <span className="text-[#C8102E] text-sm font-semibold tracking-wide uppercase">بینش‌ها</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-[#161616] leading-tight">
                دیدگاه‌ها و
                <br />
                <span className="text-[#C8102E]">بینش‌های تخصصی</span>
              </h2>
            </div>
            <Link
              href="/insights"
              className="group flex items-center gap-2 text-[#161616] font-semibold border-b-2 border-[#C8102E] pb-0.5 text-sm hover:text-[#C8102E] transition-colors"
            >
              مشاهده همه مقالات
              <span className="group-hover:translate-x-[-4px] transition-transform">←</span>
            </Link>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map((a, i) => (
            <AnimateOnScroll key={a.title} delay={i * 100}>
              <Link href="/insights" className="group block h-full">
                <div className="bg-white rounded-sm overflow-hidden border border-[#E9E6E1] hover:border-[#C8102E]/20 card-hover h-full flex flex-col">
                  {/* Color bar visual */}
                  <div
                    className="h-48 relative overflow-hidden flex items-end p-6"
                    style={{
                      backgroundColor: a.color,
                      backgroundImage: `radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 50%),
                                        radial-gradient(circle at 20% 80%, rgba(0,0,0,0.2) 0%, transparent 50%)`,
                    }}
                  >
                    <div className="absolute top-6 right-6 text-white/20 text-6xl font-black leading-none select-none">
                      {i + 1}
                    </div>
                    <span className="inline-flex items-center bg-white/15 border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                      {a.categoryFa}
                    </span>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-[#161616] font-black text-base mb-3 leading-relaxed group-hover:text-[#C8102E] transition-colors flex-1 line-clamp-3">
                      {a.title}
                    </h3>
                    <p className="text-[#6B6B6B] text-sm leading-relaxed mb-5 line-clamp-2">{a.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-[#6B6B6B] pt-4 border-t border-[#E9E6E1]">
                      <span>{a.date}</span>
                      <span className="flex items-center gap-1">{a.readTime} مطالعه</span>
                    </div>
                  </div>
                </div>
              </Link>
            </AnimateOnScroll>
          ))}
        </div>

        {/* Newsletter signup strip */}
        <AnimateOnScroll delay={300}>
          <div className="mt-12 bg-[#0B0B0D] rounded-sm p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-white font-black text-lg mb-1">دریافت بینش‌های ماهانه</h3>
              <p className="text-white/45 text-sm">تحلیل‌های بازاریابی برای مدیران — مستقیم به ایمیل شما.</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <input
                type="email"
                placeholder="ایمیل شما"
                className="input-field flex-1 md:w-64"
                dir="ltr"
                style={{ textAlign: "right" }}
              />
              <button className="bg-[#C8102E] hover:bg-[#A50D25] text-white font-bold px-6 py-3 rounded-sm transition-colors whitespace-nowrap">
                عضویت
              </button>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
