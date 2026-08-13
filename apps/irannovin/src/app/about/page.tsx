import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import Link from "next/link";

const timeline = [
  { year: "۱۳۶۹", en: "1990", event: "تأسیس کانون ایران‌نوین" },
  { year: "۱۳۷۵", en: "1996", event: "توسعه به خدمات تولید و ایونت" },
  { year: "۱۳۸۰", en: "2001", event: "اولین کمپین‌های ملی یکپارچه" },
  { year: "۱۳۸۷", en: "2008", event: "راه‌اندازی واحد دیجیتال" },
  { year: "۱۳۹۲", en: "2013", event: "توسعه خدمات CRM و داده" },
  { year: "۱۳۹۶", en: "2017", event: "تبدیل به گروه بازاریابی یکپارچه" },
  { year: "۱۴۰۰", en: "2021", event: "لانچ مدل عملیاتی جدید" },
  { year: "۱۴۰۳", en: "2024", event: "جهش به آینده — استراتژی ۲۰۲۵+" },
];

const values = [
  { title: "تفکر استراتژیک", desc: "هر تصمیم با داده، بینش و هدف بلندمدت گرفته می‌شود.", icon: "◈" },
  { title: "تعالی خلاقانه", desc: "کارهای ما باید برجسته، معنادار و اثرگذار باشند.", icon: "◇" },
  { title: "انضباط اجرایی", desc: "تحویل به موقع، با کیفیت و در چارچوب بودجه.", icon: "◎" },
  { title: "شراکت با مشتری", desc: "موفقیت مشتری، موفقیت ماست. نه فروش خدمت — شراکت.", icon: "◉" },
  { title: "نوآوری مداوم", desc: "پذیرش تکنولوژی جدید، روش‌های نو و تفکر چابک.", icon: "◆" },
  { title: "پاسخگویی", desc: "شفافیت در نتایج، ریسک‌ها و فرصت‌های بهبود.", icon: "◐" },
];

const team = [
  { name: "مدیرعامل", role: "Chief Executive Officer", initial: "م" },
  { name: "مدیر خلاقیت", role: "Chief Creative Officer", initial: "خ" },
  { name: "مدیر استراتژی", role: "Chief Strategy Officer", initial: "ا" },
  { name: "مدیر دیجیتال", role: "Chief Digital Officer", initial: "د" },
  { name: "مدیر مالی", role: "Chief Financial Officer", initial: "م" },
  { name: "مدیر عملیات", role: "Chief Operations Officer", initial: "ع" },
];

export default function AboutPage() {
  return (
    <main>
      <Header />

      {/* Hero */}
      <section className="bg-[#0B0B0D] pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `linear-gradient(rgba(200,16,46,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(200,16,46,0.04) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }} />
        <div className="max-w-7xl mx-auto px-6 relative">
          <AnimateOnScroll>
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8">
              <span className="text-white/50 text-xs">درباره ما</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6">
              سه دهه تجربه،
              <br />
              <span className="text-[#C8102E]">یک نگاه تازه</span>
              <br />
              به آینده برندها
            </h1>
            <p className="text-white/60 text-lg md:text-xl max-w-3xl leading-relaxed">
              ایران‌نوین از یک کانون تبلیغاتی پیشرو به یک گروه کامل بازاریابی یکپارچه تبدیل شده است —
              با حفظ تجربه ۳۴ ساله و تلفیق آن با مدل عملیاتی مدرن.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Story */}
      <section className="bg-[#F7F7F5] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <AnimateOnScroll>
              <div>
                <span className="text-[#C8102E] text-sm font-semibold tracking-wide uppercase mb-4 block">داستان ما</span>
                <h2 className="text-3xl md:text-4xl font-black text-[#161616] leading-tight mb-6">
                  از یک کانون تبلیغاتی
                  <br />
                  به یک گروه بازاریابی یکپارچه
                </h2>
                <p className="text-[#6B6B6B] leading-relaxed mb-5">
                  ایران‌نوین در سال ۱۳۶۹ با هدف ارائه خدمات تبلیغاتی خلاقانه به برندهای ایرانی تأسیس شد.
                  در طول سه دهه، با رشد بازار و تغییر نیازهای مشتریان، توانمندی‌های خود را توسعه داد.
                </p>
                <p className="text-[#6B6B6B] leading-relaxed mb-5">
                  امروز ایران‌نوین یک گروه کامل بازاریابی یکپارچه است که استراتژی، خلاقیت، رسانه، دیجیتال،
                  تولید، تجربه و تکنولوژی را در یک ساختار منسجم ترکیب می‌کند.
                </p>
                <p className="text-[#6B6B6B] leading-relaxed">
                  مأموریت ما روشن است: تبدیل شدن به شریک اصلی رشد برندهای ایرانی، با ارائه راهکارهای
                  یکپارچه‌ای که نتایج واقعی و قابل اندازه‌گیری ایجاد می‌کنند.
                </p>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll delay={200}>
              <div className="bg-[#0B0B0D] rounded-sm p-10 grid grid-cols-2 gap-6">
                {[
                  { v: "۱۳۶۹", l: "سال تأسیس" },
                  { v: "۳۴+", l: "سال تجربه" },
                  { v: "۷۰۰+", l: "نفر تیم" },
                  { v: "۵۰۰+", l: "برند همکار" },
                ].map((s) => (
                  <div key={s.l} className="text-center">
                    <div className="text-4xl font-black text-white mb-2">{s.v}</div>
                    <div className="text-white/40 text-sm">{s.l}</div>
                  </div>
                ))}
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <span className="text-[#C8102E] text-sm font-semibold tracking-wide uppercase mb-4 block">تاریخچه</span>
              <h2 className="text-3xl md:text-4xl font-black text-[#161616]">مسیر رشد ایران‌نوین</h2>
            </div>
          </AnimateOnScroll>

          <div className="relative">
            <div className="absolute right-1/2 top-0 bottom-0 w-px bg-[#E9E6E1]" />
            <div className="space-y-8">
              {timeline.map((item, i) => (
                <AnimateOnScroll key={item.year} delay={i * 80}>
                  <div className={`flex items-center gap-8 ${i % 2 === 0 ? "flex-row-reverse" : ""}`}>
                    <div className={`flex-1 ${i % 2 === 0 ? "text-right" : "text-left"}`}>
                      <div className="inline-block bg-[#F7F7F5] border border-[#E9E6E1] rounded-sm p-4">
                        <div className="text-[#C8102E] font-bold text-sm mb-1">{item.year}</div>
                        <div className="text-[#161616] font-semibold">{item.event}</div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 w-4 h-4 rounded-full bg-[#C8102E] border-4 border-white shadow-sm relative z-10" />
                    <div className="flex-1" />
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-[#111113] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <span className="text-[#C8102E] text-sm font-semibold tracking-wide uppercase mb-4 block">ارزش‌های ما</span>
              <h2 className="text-3xl md:text-4xl font-black text-white">آنچه ما را متمایز می‌کند</h2>
            </div>
          </AnimateOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <AnimateOnScroll key={v.title} delay={i * 80}>
                <div className="bg-white/5 border border-white/10 rounded-sm p-8 hover:border-[#C8102E]/30 transition-all">
                  <div className="text-3xl text-[#C8102E] mb-4">{v.icon}</div>
                  <h3 className="text-white font-bold text-lg mb-3">{v.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{v.desc}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-[#F7F7F5] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <span className="text-[#C8102E] text-sm font-semibold tracking-wide uppercase mb-4 block">تیم رهبری</span>
              <h2 className="text-3xl md:text-4xl font-black text-[#161616]">تیم مدیران ارشد</h2>
            </div>
          </AnimateOnScroll>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {team.map((member, i) => (
              <AnimateOnScroll key={member.role} delay={i * 80}>
                <div className="text-center group">
                  <div className="w-20 h-20 mx-auto rounded-sm bg-[#0B0B0D] flex items-center justify-center mb-4 group-hover:bg-[#C8102E] transition-colors">
                    <span className="text-white text-2xl font-black">{member.initial}</span>
                  </div>
                  <h4 className="text-[#161616] font-bold text-sm mb-1">{member.name}</h4>
                  <p className="text-[#6B6B6B] text-xs">{member.role}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="bg-[#C8102E] py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <AnimateOnScroll>
            <p className="text-white/80 text-sm font-semibold tracking-wide uppercase mb-6">چشم‌انداز</p>
            <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
              تبدیل ایران‌نوین به شریک یکپارچه رشد برندها
              <br />
              در ایران و منطقه.
            </h2>
            <div className="mt-10">
              <Link
                href="/contact"
                className="inline-flex items-center gap-3 bg-white text-[#C8102E] font-bold px-8 py-4 rounded-sm hover:bg-[#F7F7F5] transition-all"
              >
                شروع همکاری ←
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      <Footer />
    </main>
  );
}
