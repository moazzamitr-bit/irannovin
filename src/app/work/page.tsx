import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import Link from "next/link";

const cases = [
  {
    client: "بانک ملت",
    industry: "بانکداری",
    challenge: "افزایش آگاهی از برند در نسل جدید و جذب مشتریان دیجیتال",
    insight: "نسل جوان بانک را با خدمات دیجیتال می‌شناسد، نه شعبه",
    strategy: "Repositioning برند با فوکوس بر نوآوری دیجیتال",
    idea: "کمپین «بانک آینده در کنار شما» با محوریت تجربه دیجیتال",
    channels: ["TV", "Digital", "OOH", "Social", "Influencer"],
    result: "+۴۲% آگاهی از برند | +۳۵% دانلود اپ | +۶۰% Engagement",
    services: ["Brand Strategy", "Creative", "Digital", "OOH", "Content"],
    color: "#1a3a6e",
    year: "۱۴۰۲",
  },
  {
    client: "ایران‌خودرو",
    industry: "خودرو",
    challenge: "لانچ مدل جدید با حداکثر reach و تبدیل به فروش",
    insight: "مخاطب هدف به تجربه واقعی محصول نیاز دارد نه صرفاً آگهی",
    strategy: "Test Drive Campaign با اکتیویشن در ۲۰ شهر",
    idea: "«لمس کن، باور کن» — تجربه محصول به عنوان مرکز کمپین",
    channels: ["Event", "TVC", "Digital", "OOH", "Radio"],
    result: "+۸۵% نرخ تبدیل | ۵۰,۰۰۰+ Test Drive | +۱۲۰% پیش‌فروش",
    services: ["Creative", "TVC Production", "Event", "Digital", "Media"],
    color: "#1e3a2f",
    year: "۱۴۰۲",
  },
  {
    client: "ایرانسل",
    industry: "مخابرات",
    challenge: "رشد فروش محصولات دیجیتال و افزایش اشتراک‌های داده",
    insight: "قیمت دیگر تمایز اصلی نیست — تجربه و ارزش افزوده اهمیت بیشتری دارد",
    strategy: "Performance + Content = Qualified Lead Generation",
    idea: "ترکیب کمپین محتوایی با بهینه‌سازی دقیق تبدیل",
    channels: ["Google Ads", "Social", "SEO", "Email", "Content"],
    result: "+۱۲۰% رشد لید | -۴۰% CAC | +۸۵% Retention",
    services: ["Performance Marketing", "SEO", "Analytics", "Creative", "CRM"],
    color: "#3a1e2f",
    year: "۱۴۰۳",
  },
  {
    client: "بانک پاسارگاد",
    industry: "بانکداری",
    challenge: "تقویت جایگاه بانک نوآور در برابر چالنجرهای فین‌تک",
    insight: "اعتبار و نوآوری نه در تضاد، بلکه مکمل یکدیگرند",
    strategy: "Thought Leadership + Brand Campaign",
    idea: "«نوآوری با اعتماد» — ترکیب قدرت سنتی و تکنولوژی مدرن",
    channels: ["Media", "Content", "Social", "Event", "PR"],
    result: "+۶۰% Engagement | +۴۵% Brand Trust Score | ۱۰+ جایزه ملی",
    services: ["Brand Strategy", "Content", "Media Planning", "Event", "PR"],
    color: "#1e2a3a",
    year: "۱۴۰۱",
  },
];

export default function WorkPage() {
  return (
    <main>
      <Header />

      <section className="bg-[#0B0B0D] pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <AnimateOnScroll>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">
              نمونه‌کارها و
              <br />
              <span className="text-[#C8102E]">نتایج واقعی</span>
            </h1>
            <p className="text-white/60 text-xl max-w-3xl">
              کمپین‌هایی که رشد واقعی ایجاد کردند — از استراتژی تا اجرا.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      <section className="bg-[#F7F7F5] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="space-y-8">
            {cases.map((c, i) => (
              <AnimateOnScroll key={c.client} delay={i * 100}>
                <div className="bg-white rounded-sm border border-[#E9E6E1] overflow-hidden group">
                  <div className="grid grid-cols-1 lg:grid-cols-5">
                    {/* Visual */}
                    <div
                      className="lg:col-span-2 min-h-64 relative overflow-hidden"
                      style={{ backgroundColor: c.color }}
                    >
                      <div className="absolute inset-0 opacity-20" style={{
                        backgroundImage: "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.2) 0%, transparent 60%)",
                      }} />
                      <div className="absolute inset-0 p-8 flex flex-col justify-between">
                        <div>
                          <span className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                            {c.industry}
                          </span>
                          <h2 className="text-white text-3xl font-black">{c.client}</h2>
                          <p className="text-white/50 text-sm mt-2">{c.year}</p>
                        </div>
                        <div className="text-white/80 text-xl font-bold">{c.result.split("|")[0]}</div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-3 p-8 md:p-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {[
                          { label: "چالش", value: c.challenge },
                          { label: "بینش", value: c.insight },
                          { label: "استراتژی", value: c.strategy },
                          { label: "ایده خلاق", value: c.idea },
                        ].map((item) => (
                          <div key={item.label}>
                            <div className="text-[#C8102E] text-xs font-bold uppercase tracking-wide mb-1">{item.label}</div>
                            <p className="text-[#161616] text-sm leading-relaxed">{item.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mb-6">
                        <div className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wide mb-3">کانال‌ها</div>
                        <div className="flex flex-wrap gap-2">
                          {c.channels.map((ch) => (
                            <span key={ch} className="text-xs bg-[#F7F7F5] border border-[#E9E6E1] text-[#161616] px-3 py-1.5 rounded-full">
                              {ch}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-6 border-t border-[#E9E6E1]">
                        <div className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wide mb-2">نتایج</div>
                        <p className="text-[#C8102E] font-bold text-sm">{c.result}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#C8102E] py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <AnimateOnScroll>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
              می‌خواهید نتایج مشابه برای برند خود ببینید؟
            </h2>
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 bg-white text-[#C8102E] font-bold px-10 py-4 rounded-sm hover:bg-[#F7F7F5] transition-all"
            >
              شروع پروژه مشابه ←
            </Link>
          </AnimateOnScroll>
        </div>
      </section>

      <Footer />
    </main>
  );
}
