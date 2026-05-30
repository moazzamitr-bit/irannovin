import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import Link from "next/link";

const industries = [
  {
    icon: "🏦",
    name: "بانک، بیمه و فین‌تک",
    en: "Banking, Insurance & Fintech",
    challenges: ["جذب مشتریان دیجیتال جدید", "رقابت با چالنجر بانک‌ها", "افزایش تعامل با مشتریان فعلی", "ریبرندینگ و نوسازی تصویر"],
    solutions: ["Performance Marketing", "CRM & Retention", "Brand Strategy", "Digital Transformation"],
    desc: "ایران‌نوین با بزرگ‌ترین بانک‌های ایران همکاری کرده و مدل‌های رشد دیجیتال در این صنعت را می‌شناسد.",
  },
  {
    icon: "🛒",
    name: "FMCG و مواد غذایی",
    en: "FMCG & Food",
    challenges: ["تمایز در بازار شلوغ", "لانچ محصول جدید", "افزایش سهم بازار", "ساخت لویالتی"],
    solutions: ["Creative Campaigns", "Trade Marketing", "Shopper Marketing", "Social Content"],
    desc: "از برندسازی مصرفی تا کمپین‌های ملی، تجربه گسترده در صنعت FMCG ایران.",
  },
  {
    icon: "🚗",
    name: "خودرو",
    en: "Automotive",
    challenges: ["لانچ مدل جدید", "جنگ قیمت", "ساخت تجربه خرید", "آفتر سیلز و وفاداری"],
    solutions: ["360 Campaign", "Event & Activation", "Digital Lead Gen", "CRM"],
    desc: "تجربه اجرای کمپین‌های لانچ و پرفورمنس برای بزرگ‌ترین خودروسازان ایران.",
  },
  {
    icon: "📱",
    name: "لوازم خانگی",
    en: "Home Appliances",
    challenges: ["جنگ قیمت با برندهای چینی", "ساخت تمایز برند", "کانال توزیع دیجیتال", "تجربه مشتری"],
    solutions: ["Brand Strategy", "Retail Marketing", "Digital Commerce", "Content"],
    desc: "ترکیب برندسازی احساسی و پرفورمنس برای حضور در همه کانال‌ها.",
  },
  {
    icon: "📡",
    name: "تلکام و پلتفرم",
    en: "Telecom & Platforms",
    challenges: ["افزایش ARPU", "کاهش Churn", "جذب مشتریان جدید", "Launch خدمات جدید"],
    solutions: ["Performance", "CRM & Retention", "Brand Campaign", "Digital"],
    desc: "تخصص در کمپین‌های data-driven برای صنعت تلکام و اپراتورهای ایرانی.",
  },
  {
    icon: "🏗️",
    name: "مسکن و ساخت‌وساز",
    en: "Real Estate & Construction",
    challenges: ["جذب لید کیفی", "پیش‌فروش", "برندسازی توسعه‌دهنده", "بازاریابی پروژه"],
    solutions: ["Lead Generation", "Content Marketing", "Event", "Digital"],
    desc: "از پروژه‌های مسکونی لوکس تا توسعه‌های تجاری، تجربه فروش در مقیاس بزرگ.",
  },
  {
    icon: "🛍️",
    name: "خرده‌فروشی",
    en: "Retail",
    challenges: ["ترافیک به فروشگاه", "رقابت با e-commerce", "باشگاه مشتریان", "فصلی بودن"],
    solutions: ["Omnichannel", "CRM", "Activation", "Performance"],
    desc: "استراتژی Omnichannel برای ترکیب تجربه آنلاین و آفلاین.",
  },
  {
    icon: "🏥",
    name: "سلامت",
    en: "Healthcare",
    challenges: ["اعتمادسازی", "آموزش مخاطب", "رقابت در حوزه دیجیتال", "مقررات تبلیغاتی"],
    solutions: ["Content Marketing", "Brand Strategy", "Digital", "SEO"],
    desc: "تجربه در بازاریابی تخصصی حوزه سلامت با رعایت استانداردهای اخلاقی.",
  },
];

export default function IndustriesPage() {
  return (
    <main>
      <Header />

      <section className="bg-[#0B0B0D] pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <AnimateOnScroll>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">
              تخصص در
              <br />
              <span className="text-[#C8102E]">صنایع پیچیده</span>
            </h1>
            <p className="text-white/60 text-xl max-w-3xl">
              شناخت عمیق بازار هر صنعت، کلید طراحی راهکارهای مؤثر است.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      <section className="bg-[#F7F7F5] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {industries.map((ind, i) => (
              <AnimateOnScroll key={ind.name} delay={i * 80}>
                <div className="bg-white rounded-sm border border-[#E9E6E1] p-8 hover:border-[#C8102E]/20 transition-all">
                  <div className="flex items-start gap-4 mb-6">
                    <span className="text-4xl flex-shrink-0">{ind.icon}</span>
                    <div>
                      <h2 className="text-xl font-black text-[#161616] mb-1">{ind.name}</h2>
                      <p className="text-[#6B6B6B] text-xs">{ind.en}</p>
                    </div>
                  </div>

                  <p className="text-[#6B6B6B] text-sm leading-relaxed mb-6">{ind.desc}</p>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="text-xs font-bold text-[#C8102E] uppercase tracking-wide mb-3">چالش‌های رایج</div>
                      <ul className="space-y-1.5">
                        {ind.challenges.map((ch) => (
                          <li key={ch} className="text-xs text-[#6B6B6B] flex items-start gap-2">
                            <span className="w-1 h-1 rounded-full bg-[#C8102E] mt-1.5 flex-shrink-0" />
                            {ch}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#161616] uppercase tracking-wide mb-3">راهکارهای ما</div>
                      <ul className="space-y-1.5">
                        {ind.solutions.map((s) => (
                          <li key={s} className="text-xs text-[#161616] flex items-start gap-2">
                            <span className="w-1 h-1 rounded-full bg-[#161616] mt-1.5 flex-shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-[#E9E6E1]">
                    <Link href="/contact" className="text-[#C8102E] text-sm font-semibold hover:gap-3 transition-all inline-flex items-center gap-2">
                      دریافت راهکار تخصصی ←
                    </Link>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
