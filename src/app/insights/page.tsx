import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnimateOnScroll from "@/components/AnimateOnScroll";

const categories = ["همه", "Brand Growth", "Digital Marketing", "Campaign Strategy", "Media & OOH", "AI in Marketing", "Consumer Trends", "Case Studies"];

const articles = [
  {
    category: "Brand Growth",
    categoryFa: "رشد برند",
    title: "چرا آژانس‌های تبلیغاتی باید از رسانه‌فروشی به راهکارفروشی حرکت کنند؟",
    excerpt: "تحول بنیادین در مدل کسب‌وکار آژانس‌های تبلیغاتی دیگر اختیاری نیست. برندها خواهان نتیجه هستند، نه خرید رسانه.",
    readTime: "۷ دقیقه",
    date: "آذر ۱۴۰۳",
    color: "#C8102E",
    featured: true,
  },
  {
    category: "Campaign Strategy",
    categoryFa: "استراتژی کمپین",
    title: "مدل کمپین ۳۶۰ در بازار امروز ایران",
    excerpt: "چگونه یک کمپین یکپارچه در همه کانال‌ها به رشد پایدار برند کمک می‌کند و چه اشتباهاتی آن را ناکارآمد می‌کنند.",
    readTime: "۵ دقیقه",
    date: "آبان ۱۴۰۳",
    color: "#1e3a6e",
    featured: false,
  },
  {
    category: "AI in Marketing",
    categoryFa: "هوش مصنوعی",
    title: "نقش هوش مصنوعی در آینده بازاریابی برندها",
    excerpt: "از پرسونالایزیشن تا بهینه‌سازی خودکار کمپین — AI چه تغییراتی ایجاد می‌کند و چطور باید آماده شویم؟",
    readTime: "۸ دقیقه",
    date: "مهر ۱۴۰۳",
    color: "#1e3a2f",
    featured: false,
  },
  {
    category: "Brand Growth",
    categoryFa: "رشد برند",
    title: "چطور همکاری با مشتریان فعلی را به رشد بلندمدت تبدیل کنیم؟",
    excerpt: "توسعه اکانت استراتژیک: از یک پروژه به یک مشارکت بلندمدت برای رشد مشترک.",
    readTime: "۶ دقیقه",
    date: "شهریور ۱۴۰۳",
    color: "#3a1e2f",
    featured: false,
  },
  {
    category: "Digital Marketing",
    categoryFa: "دیجیتال مارکتینگ",
    title: "Performance Marketing در ایران: چالش‌ها و فرصت‌ها",
    excerpt: "بررسی وضعیت Performance Marketing در اکوسیستم دیجیتال ایران و استراتژی‌های مؤثر.",
    readTime: "۵ دقیقه",
    date: "مرداد ۱۴۰۳",
    color: "#1a2a3a",
    featured: false,
  },
  {
    category: "Consumer Trends",
    categoryFa: "ترندهای مصرف",
    title: "مصرف‌کننده ایرانی در ۱۴۰۳: تغییر رفتار و انتظارات جدید",
    excerpt: "تحلیل رفتار مصرف‌کننده ایرانی پس از تحولات اقتصادی و فرصت‌های جدید برای برندها.",
    readTime: "۱۰ دقیقه",
    date: "تیر ۱۴۰۳",
    color: "#2a1a3a",
    featured: false,
  },
];

export default function InsightsPage() {
  const featured = articles.find((a) => a.featured);
  const rest = articles.filter((a) => !a.featured);

  return (
    <main>
      <Header />

      <section className="bg-[#0B0B0D] pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <AnimateOnScroll>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">
              بینش‌ها و
              <br />
              <span className="text-[#C8102E]">دیدگاه‌های تخصصی</span>
            </h1>
            <p className="text-white/60 text-xl max-w-3xl">
              تحلیل‌ها، راهنماها و دیدگاه‌های تیم ایران‌نوین درباره بازاریابی، برند و رشد.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      <section className="bg-[#F7F7F5] py-24">
        <div className="max-w-7xl mx-auto px-6">
          {/* Categories */}
          <div className="flex flex-wrap gap-3 mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  cat === "همه"
                    ? "bg-[#0B0B0D] text-white"
                    : "bg-white border border-[#E9E6E1] text-[#6B6B6B] hover:border-[#C8102E]/30"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Featured */}
          {featured && (
            <AnimateOnScroll>
              <div className="bg-[#0B0B0D] rounded-sm overflow-hidden mb-8">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  <div
                    className="h-64 lg:h-auto min-h-64"
                    style={{
                      backgroundColor: featured.color,
                      backgroundImage: "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.1) 0%, transparent 60%)",
                    }}
                  >
                    <div className="p-8 h-full flex items-end">
                      <span className="inline-flex items-center bg-[#C8102E] text-white text-xs font-bold px-3 py-1.5 rounded-full">
                        مقاله ویژه • {featured.categoryFa}
                      </span>
                    </div>
                  </div>
                  <div className="p-10 flex flex-col justify-center">
                    <h2 className="text-white text-2xl md:text-3xl font-black leading-relaxed mb-4">
                      {featured.title}
                    </h2>
                    <p className="text-white/60 leading-relaxed mb-6">{featured.excerpt}</p>
                    <div className="flex items-center gap-6">
                      <span className="text-white/30 text-sm">{featured.date}</span>
                      <span className="text-white/30 text-sm">{featured.readTime} مطالعه</span>
                    </div>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((a, i) => (
              <AnimateOnScroll key={a.title} delay={i * 80}>
                <div className="bg-white rounded-sm overflow-hidden border border-[#E9E6E1] hover:border-[#C8102E]/20 card-hover group">
                  <div
                    className="h-40"
                    style={{
                      backgroundColor: a.color,
                      backgroundImage: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)",
                    }}
                  >
                    <div className="p-6 h-full flex items-end">
                      <span className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
                        {a.categoryFa}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-[#161616] font-bold text-base mb-3 leading-relaxed group-hover:text-[#C8102E] transition-colors">
                      {a.title}
                    </h3>
                    <p className="text-[#6B6B6B] text-sm leading-relaxed mb-4">{a.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
                      <span>{a.date}</span>
                      <span>{a.readTime} مطالعه</span>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>

          {/* Newsletter */}
          <AnimateOnScroll delay={400}>
            <div className="mt-16 bg-[#0B0B0D] rounded-sm p-10 text-center">
              <h3 className="text-white text-2xl font-black mb-3">دریافت آخرین بینش‌ها</h3>
              <p className="text-white/50 mb-6">خبرنامه ماهانه ایران‌نوین — تحلیل‌های بازاریابی برای مدیران.</p>
              <div className="flex gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="ایمیل شما"
                  className="input-field flex-1"
                  dir="ltr"
                  style={{ textAlign: "right" }}
                />
                <button className="bg-[#C8102E] text-white font-bold px-6 py-3 rounded-sm hover:bg-[#A50D25] transition-colors whitespace-nowrap">
                  عضویت
                </button>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      <Footer />
    </main>
  );
}
