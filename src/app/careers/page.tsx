import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnimateOnScroll from "@/components/AnimateOnScroll";

const openRoles = [
  { title: "Senior Brand Strategist", team: "استراتژی", type: "تمام‌وقت", location: "تهران" },
  { title: "Creative Director", team: "خلاقیت", type: "تمام‌وقت", location: "تهران" },
  { title: "Performance Marketing Manager", team: "دیجیتال", type: "تمام‌وقت", location: "تهران" },
  { title: "Senior Copywriter", team: "خلاقیت", type: "تمام‌وقت", location: "تهران / ریموت" },
  { title: "Data Analyst", team: "Data & MarTech", type: "تمام‌وقت", location: "تهران" },
  { title: "Social Media Manager", team: "دیجیتال", type: "تمام‌وقت", location: "تهران" },
  { title: "Project Manager", team: "عملیات", type: "تمام‌وقت", location: "تهران" },
  { title: "Video Producer", team: "تولید", type: "تمام‌وقت", location: "تهران" },
];

const values = [
  { title: "یادگیری مداوم", desc: "دسترسی به کتابخانه، دوره‌های آموزشی و کنفرانس‌های تخصصی.", icon: "📚" },
  { title: "تأثیر واقعی", desc: "کار روی پروژه‌های ملی که میلیون‌ها نفر می‌بینند.", icon: "🎯" },
  { title: "تیم برتر", desc: "همکاری با بهترین ذهن‌های استراتژیک و خلاق ایران.", icon: "⭐" },
  { title: "رشد شغلی", desc: "مسیر ترقی شفاف در یک سازمان در حال تحول.", icon: "📈" },
];

export default function CareersPage() {
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
              برای ساختن آینده
              <br />
              <span className="text-[#C8102E]">بازاریابی ایران</span>
              <br />
              به تیم ما بپیوندید
            </h1>
            <p className="text-white/60 text-xl max-w-3xl">
              جایی که استراتژی، خلاقیت، دیجیتال و فناوری با هم کار می‌کنند.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Why Join */}
      <section className="bg-[#F7F7F5] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <span className="text-[#C8102E] text-sm font-semibold tracking-wide uppercase mb-4 block">چرا ایران‌نوین؟</span>
              <h2 className="text-3xl md:text-4xl font-black text-[#161616]">کار در ایران‌نوین چه معنایی دارد</h2>
            </div>
          </AnimateOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <AnimateOnScroll key={v.title} delay={i * 100}>
                <div className="bg-white border border-[#E9E6E1] rounded-sm p-8 text-center hover:border-[#C8102E]/30 card-hover">
                  <div className="text-4xl mb-4">{v.icon}</div>
                  <h3 className="text-[#161616] font-bold text-lg mb-3">{v.title}</h3>
                  <p className="text-[#6B6B6B] text-sm leading-relaxed">{v.desc}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Open Roles */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <AnimateOnScroll>
            <div className="flex items-end justify-between mb-12">
              <div>
                <span className="text-[#C8102E] text-sm font-semibold tracking-wide uppercase mb-4 block">موقعیت‌های شغلی</span>
                <h2 className="text-3xl md:text-4xl font-black text-[#161616]">فرصت‌های باز</h2>
              </div>
              <span className="bg-[#C8102E] text-white text-sm font-bold px-4 py-2 rounded-full">
                {openRoles.length} موقعیت
              </span>
            </div>
          </AnimateOnScroll>

          <div className="space-y-3">
            {openRoles.map((role, i) => (
              <AnimateOnScroll key={role.title} delay={i * 60}>
                <div className="group flex items-center justify-between p-6 bg-[#F7F7F5] border border-[#E9E6E1] rounded-sm hover:border-[#C8102E]/30 hover:bg-white transition-all cursor-pointer">
                  <div>
                    <h3 className="text-[#161616] font-bold mb-1">{role.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-[#6B6B6B]">
                      <span className="bg-[#E9E6E1] px-2 py-0.5 rounded-full">{role.team}</span>
                      <span>{role.type}</span>
                      <span>{role.location}</span>
                    </div>
                  </div>
                  <span className="text-[#C8102E] group-hover:translate-x-[-4px] transition-transform text-lg">←</span>
                </div>
              </AnimateOnScroll>
            ))}
          </div>

          {/* Submit resume */}
          <AnimateOnScroll delay={400}>
            <div className="mt-12 bg-[#111113] rounded-sm p-8 md:p-10 text-center">
              <h3 className="text-white text-2xl font-black mb-3">موقعیت مناسب پیدا نکردید؟</h3>
              <p className="text-white/50 mb-6">رزومه خود را ارسال کنید تا در فرصت‌های آینده با شما تماس بگیریم.</p>
              <button className="bg-[#C8102E] text-white font-bold px-8 py-4 rounded-sm hover:bg-[#A50D25] transition-all">
                ارسال رزومه ←
              </button>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      <Footer />
    </main>
  );
}
