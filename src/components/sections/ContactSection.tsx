"use client";

import { useState } from "react";
import AnimateOnScroll from "@/components/AnimateOnScroll";

const needs = [
  "استراتژی برند", "کمپین تبلیغاتی", "دیجیتال مارکتینگ",
  "تولید محتوا", "رسانه و OOH", "ایونت و رویداد",
  "CRM و داده", "مشاوره یکپارچه",
];

const budgets = [
  "تا ۵۰۰ میلیون تومان",
  "۵۰۰ میلیون تا ۲ میلیارد",
  "۲ تا ۵ میلیارد تومان",
  "بیش از ۵ میلیارد تومان",
  "مشخص نشده",
];

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section className="bg-[#F7F7F5] py-24 md:py-32" id="contact">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
          {/* Left info */}
          <div className="lg:col-span-2">
            <AnimateOnScroll>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-px bg-[#C8102E]" />
                <span className="text-[#C8102E] text-sm font-semibold tracking-wide uppercase">تماس با ما</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-[#161616] leading-tight mb-6">
                بیایید درباره
                <br />
                <span className="text-[#C8102E]">رشد برند شما</span>
                <br />
                صحبت کنیم
              </h2>
              <p className="text-[#6B6B6B] leading-relaxed mb-10">
                تیم ما آماده است تا با شما درباره چالش‌های برند و راهکارهای یکپارچه ایران‌نوین گفتگو کند.
              </p>

              <div className="space-y-6">
                {[
                  { label: "ایمیل", value: "info@irannovin.com", href: "mailto:info@irannovin.com" },
                  { label: "تلفن", value: "+98 21 XXXX XXXX", href: "tel:+982100000000" },
                  { label: "آدرس", value: "تهران، ایران", href: "#" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="text-xs text-[#6B6B6B] font-semibold mb-1 uppercase tracking-wide">{item.label}</div>
                    <a href={item.href} className="text-[#161616] font-medium hover:text-[#C8102E] transition-colors">
                      {item.value}
                    </a>
                  </div>
                ))}
              </div>
            </AnimateOnScroll>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <AnimateOnScroll delay={200}>
              {submitted ? (
                <div className="bg-[#0B0B0D] rounded-sm p-12 text-center">
                  <div className="w-16 h-16 bg-[#C8102E] rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-white text-2xl">✓</span>
                  </div>
                  <h3 className="text-white text-2xl font-black mb-3">درخواست شما ارسال شد</h3>
                  <p className="text-white/60">تیم ما در اسرع وقت با شما تماس خواهد گرفت.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-[#0B0B0D] rounded-sm p-8 md:p-10">
                  <h3 className="text-white text-xl font-bold mb-8">ارسال درخواست همکاری</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-white/50 text-xs mb-2">نام و نام خانوادگی *</label>
                      <input type="text" required placeholder="نام شما" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-white/50 text-xs mb-2">نام شرکت *</label>
                      <input type="text" required placeholder="شرکت شما" className="input-field" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-white/50 text-xs mb-2">سمت</label>
                      <input type="text" placeholder="مدیر بازاریابی" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-white/50 text-xs mb-2">شماره تماس *</label>
                      <input type="tel" required placeholder="09XXXXXXXXX" className="input-field" dir="ltr" style={{ textAlign: "right" }} />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-white/50 text-xs mb-2">ایمیل *</label>
                    <input type="email" required placeholder="email@company.com" className="input-field" dir="ltr" style={{ textAlign: "right" }} />
                  </div>

                  <div className="mb-4">
                    <label className="block text-white/50 text-xs mb-2">نوع نیاز</label>
                    <div className="flex flex-wrap gap-2">
                      {needs.map((n) => (
                        <label key={n} className="cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <span className="inline-block px-3 py-1.5 text-xs border border-white/10 rounded-full text-white/50 peer-checked:bg-[#C8102E] peer-checked:border-[#C8102E] peer-checked:text-white transition-all cursor-pointer">
                            {n}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-white/50 text-xs mb-2">بودجه تقریبی</label>
                    <select className="input-field" defaultValue="">
                      <option value="" disabled>انتخاب کنید</option>
                      {budgets.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-8">
                    <label className="block text-white/50 text-xs mb-2">توضیحات پروژه</label>
                    <textarea
                      rows={4}
                      placeholder="چالش یا هدف اصلی پروژه خود را توضیح دهید..."
                      className="input-field resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#C8102E] hover:bg-[#A50D25] text-white font-bold py-4 rounded-sm transition-all hover:shadow-xl hover:shadow-red-900/30"
                  >
                    ارسال درخواست همکاری ←
                  </button>
                </form>
              )}
            </AnimateOnScroll>
          </div>
        </div>
      </div>
    </section>
  );
}
