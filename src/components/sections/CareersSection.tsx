import Link from "next/link";
import AnimateOnScroll from "@/components/AnimateOnScroll";

const roles = ["استراتژیست برند", "کارگردان خلاق", "دیجیتال مارکتر", "مدیر رسانه", "تحلیل‌گر داده", "تولیدکننده محتوا", "متخصص MarTech", "مدیر پروژه"];

export default function CareersSection() {
  return (
    <section className="bg-[#0B0B0D] py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <AnimateOnScroll>
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-px bg-[#C8102E]" />
              <span className="text-[#C8102E] text-sm font-semibold tracking-wide uppercase">فرصت‌های شغلی</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
              برای ساختن آینده
              <br />
              <span className="text-[#C8102E]">بازاریابی ایران</span>
              <br />
              به تیم ما بپیوندید
            </h2>
            <p className="text-white/60 text-lg leading-relaxed mb-8">
              ایران‌نوین به دنبال نسل جدیدی از استراتژیست‌ها، خلاق‌ها، دیجیتال مارکترها،
              تحلیل‌گران داده و متخصصان فناوری بازاریابی است.
            </p>
            <div className="flex flex-wrap gap-3 mb-10">
              {["خلاقیت بی‌مرز", "یادگیری مداوم", "تأثیر واقعی", "تیم برتر"].map((val) => (
                <span key={val} className="bg-white/5 border border-white/10 text-white/60 text-sm px-4 py-2 rounded-full">
                  {val}
                </span>
              ))}
            </div>
            <Link
              href="/careers"
              className="inline-flex items-center gap-3 bg-[#C8102E] hover:bg-[#A50D25] text-white font-bold px-8 py-4 rounded-sm transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-red-900/30"
            >
              مشاهده فرصت‌های شغلی ←
            </Link>
          </AnimateOnScroll>

          <div className="grid grid-cols-2 gap-3">
            {roles.map((role, i) => (
              <AnimateOnScroll key={role} delay={i * 80}>
                <div className="group bg-white/5 border border-white/10 rounded-sm p-5 hover:bg-white/10 hover:border-[#C8102E]/30 transition-all cursor-default">
                  <div className="w-2 h-2 rounded-full bg-[#C8102E] mb-3" />
                  <p className="text-white font-semibold text-sm">{role}</p>
                  <p className="text-white/30 text-xs mt-1">تهران</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
