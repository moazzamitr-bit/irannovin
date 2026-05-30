import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import Link from "next/link";

const practices = [
  {
    number: "۰۱",
    title: "Brand, Strategy & Research",
    fa: "برند، استراتژی و پژوهش",
    desc: "پایه هر کمپین موفق، درک عمیق از بازار، مصرف‌کننده و جایگاه برند است. ما با ابزارهای تحقیقاتی پیشرفته و تفکر استراتژیک، مسیر رشد برند شما را تعریف می‌کنیم.",
    services: ["Brand Strategy", "Campaign Strategy", "Market & Consumer Insight", "Positioning & Architecture", "Communication Planning", "Creative Brief Development", "Brand Audit", "Competitive Analysis"],
    deliverables: ["Brand Book", "استراتژی کمپین", "Consumer Journey Map", "گزارش بازار"],
    clients: "برندهای B2B و B2C، استارت‌آپ‌ها، شرکت‌های بزرگ",
  },
  {
    number: "۰۲",
    title: "Creative & Content",
    fa: "خلاقیت و محتوا",
    desc: "ایده‌هایی که از جمع جدا می‌شوند، داستان می‌گویند و در ذهن مخاطب ماندگار می‌شوند. تیم خلاق ما از Big Idea تا اجرا همراه شماست.",
    services: ["Big Idea Development", "Copywriting", "Art Direction", "Social Content", "Video Content Creation", "Campaign Storytelling", "Always-on Content", "Brand Visual Identity"],
    deliverables: ["Creative Concept", "Content Calendar", "Visual Assets", "Campaign Kit"],
    clients: "برندهای مصرفی، خرده‌فروشی، FMCG، خودرو",
  },
  {
    number: "۰۳",
    title: "Digital Growth & Performance",
    fa: "دیجیتال و پرفورمنس",
    desc: "رشد قابل اندازه‌گیری از کانال‌های دیجیتال با تمرکز بر نتیجه. از جذب ترافیک تا تبدیل به مشتری واقعی.",
    services: ["Performance Marketing", "Google Ads", "Social Ads", "SEO & SEM", "Landing Page Optimization", "Analytics & Reporting", "Lead Generation", "Conversion Rate Optimization"],
    deliverables: ["گزارش پرفورمنس", "Dashboard Analytics", "A/B Test Results"],
    clients: "فین‌تک، فروشگاه آنلاین، آموزش، سلامت",
  },
  {
    number: "۰۴",
    title: "CRM, Data & MarTech",
    fa: "CRM، داده و تکنولوژی",
    desc: "داده بدون تفسیر بی‌معناست. ما سیستم‌های هوشمند CRM، اتوماسیون بازاریابی و داشبوردهای تحلیلی پیاده می‌کنیم.",
    services: ["CRM Strategy & Implementation", "Marketing Automation", "Customer Journey Design", "Analytics Dashboards", "AI Marketing Tools", "Retention Programs", "Campaign Intelligence", "CDP Implementation"],
    deliverables: ["CRM Blueprint", "Automation Flows", "Analytics Dashboard", "AI Reports"],
    clients: "بانک‌ها، بیمه‌ها، تلکام، فین‌تک",
  },
  {
    number: "۰۵",
    title: "Media & Experience",
    fa: "رسانه و تجربه",
    desc: "حضور برند در همه نقاط تماس مخاطب — از تلویزیون و OOH تا رویدادهای تجربی و اکتیویشن.",
    services: ["OOH & Outdoor", "TV & Radio Planning", "Event Management", "Brand Activation", "Sponsorship", "BTL Campaigns", "Media Planning & Buying", "Experiential Marketing"],
    deliverables: ["Media Plan", "Event Concept", "Activation Brief"],
    clients: "برندهای ملی با کمپین‌های بزرگ",
  },
  {
    number: "۰۶",
    title: "Production & Studio",
    fa: "تولید و استودیو",
    desc: "از TVC تا عکاسی، از VFX تا موسیقی — تیم تولید ما همه جنبه‌های ساخت محتوا را پوشش می‌دهد.",
    services: ["TVC Production", "Photography", "VFX & Motion Graphics", "Video Editing", "Sound Design & Music", "Print Production", "Decoration & 3D", "Studio Production"],
    deliverables: ["TVC Final File", "Photo Gallery", "Motion Reel", "Print Assets"],
    clients: "همه برندهایی که نیاز به تولید محتوا دارند",
  },
];

export default function ServicesPage() {
  return (
    <main>
      <Header />

      <section className="bg-[#0B0B0D] pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `linear-gradient(rgba(200,16,46,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(200,16,46,0.04) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }} />
        <div className="max-w-7xl mx-auto px-6 relative">
          <AnimateOnScroll>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6">
              شش حوزه تخصصی،
              <br />
              <span className="text-[#C8102E]">یک راهکار یکپارچه</span>
            </h1>
            <p className="text-white/60 text-xl max-w-3xl leading-relaxed">
              توانمندی‌های ایران‌نوین در شش Practice Area تخصصی سازماندهی شده‌اند
              که با هم یک اکوسیستم کامل بازاریابی را تشکیل می‌دهند.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      <section className="bg-[#F7F7F5] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="space-y-6">
            {practices.map((p, i) => (
              <AnimateOnScroll key={p.number} delay={i * 80}>
                <div className="bg-white rounded-sm border border-[#E9E6E1] overflow-hidden">
                  <div className="p-8 md:p-10">
                    <div className="flex flex-col lg:flex-row gap-10">
                      {/* Header */}
                      <div className="lg:w-72 flex-shrink-0">
                        <div className="text-[#C8102E] text-xs font-bold tracking-wider mb-2 uppercase">{p.number}</div>
                        <h2 className="text-2xl font-black text-[#161616] mb-2">{p.fa}</h2>
                        <p className="text-[#6B6B6B] text-xs mb-4">{p.title}</p>
                        <p className="text-[#6B6B6B] text-sm leading-relaxed">{p.desc}</p>
                        <div className="mt-6 pt-6 border-t border-[#E9E6E1]">
                          <div className="text-xs text-[#6B6B6B] mb-2 font-semibold">مناسب برای:</div>
                          <p className="text-[#161616] text-xs">{p.clients}</p>
                        </div>
                      </div>

                      {/* Services */}
                      <div className="flex-1">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                          {p.services.map((s) => (
                            <div key={s} className="bg-[#F7F7F5] border border-[#E9E6E1] rounded-sm px-4 py-3 text-sm text-[#161616] font-medium hover:border-[#C8102E]/30 hover:bg-white transition-all">
                              {s}
                            </div>
                          ))}
                        </div>
                        <div>
                          <div className="text-xs text-[#6B6B6B] mb-3 font-semibold uppercase tracking-wide">نمونه دلیوری‌ها</div>
                          <div className="flex flex-wrap gap-2">
                            {p.deliverables.map((d) => (
                              <span key={d} className="text-xs bg-[#0B0B0D] text-white px-3 py-1.5 rounded-full">{d}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0B0B0D] py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <AnimateOnScroll>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
              کدام توانمندی برای برند شما مناسب است؟
            </h2>
            <p className="text-white/50 mb-8">با تیم ما صحبت کنید تا راهکار متناسب برای چالش خود بیابید.</p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 bg-[#C8102E] text-white font-bold px-10 py-4 rounded-sm hover:bg-[#A50D25] transition-all"
            >
              درخواست مشاوره رایگان ←
            </Link>
          </AnimateOnScroll>
        </div>
      </section>

      <Footer />
    </main>
  );
}
