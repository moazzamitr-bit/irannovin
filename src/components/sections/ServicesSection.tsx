"use client";

import { useState } from "react";
import Link from "next/link";
import AnimateOnScroll from "@/components/AnimateOnScroll";

const practices = [
  {
    id: "strategy",
    number: "۰۱",
    title: "Brand, Strategy & Research",
    fa: "برند، استراتژی و پژوهش",
    services: ["Brand Strategy", "Campaign Strategy", "Market & Consumer Insight", "Positioning", "Communication Planning", "Creative Brief Development"],
    desc: "هر کمپین قدرتمند با پایه‌ای محکم از استراتژی آغاز می‌شود.",
    color: "#C8102E",
  },
  {
    id: "creative",
    number: "۰۲",
    title: "Creative & Content",
    fa: "خلاقیت و محتوا",
    services: ["Big Ideas", "Copywriting", "Art Direction", "Social Content", "Video Content", "Campaign Storytelling", "Always-on Content"],
    desc: "ایده‌هایی که برند را از جمع متمایز می‌کنند و ذهن مخاطب را درگیر.",
    color: "#C8102E",
  },
  {
    id: "digital",
    number: "۰۳",
    title: "Digital Growth & Performance",
    fa: "دیجیتال و پرفورمنس",
    services: ["Performance Marketing", "Google Ads", "Social Ads", "SEO", "Landing Pages", "Analytics", "Lead Generation", "Conversion Optimization"],
    desc: "رشد قابل اندازه‌گیری از کانال‌های دیجیتال با تمرکز بر نتیجه.",
    color: "#C8102E",
  },
  {
    id: "crm",
    number: "۰۴",
    title: "CRM, Data & MarTech",
    fa: "CRM، داده و تکنولوژی",
    services: ["CRM Strategy", "Marketing Automation", "Customer Journey Design", "Dashboards", "AI Marketing Tools", "Retention Programs", "Campaign Intelligence"],
    desc: "تبدیل داده به تصمیم و ساخت روابط پایدار با مشتری.",
    color: "#C8102E",
  },
  {
    id: "media",
    number: "۰۵",
    title: "Media & Experience",
    fa: "رسانه و تجربه",
    services: ["OOH", "TV", "Radio", "Event", "Activation", "Sponsorship", "BTL", "Media Planning"],
    desc: "حضور ۳۶۰ درجه در همه نقاط تماس مخاطب.",
    color: "#C8102E",
  },
  {
    id: "production",
    number: "۰۶",
    title: "Production & Studio",
    fa: "تولید و استودیو",
    services: ["TVC Production", "Photography", "VFX", "Editing", "Sound & Music", "Print", "Decoration", "Studio Production"],
    desc: "اجرای بی‌نقص ایده‌ها با بالاترین استانداردهای تولید.",
    color: "#C8102E",
  },
];

export default function ServicesSection() {
  const [active, setActive] = useState("strategy");
  const current = practices.find((p) => p.id === active) || practices[0];

  return (
    <section className="bg-[#F7F7F5] py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateOnScroll>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-px bg-[#C8102E]" />
                <span className="text-[#C8102E] text-sm font-semibold tracking-wide uppercase">توانمندی‌ها</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-[#161616] leading-tight">
                شش حوزه تخصصی،
                <br />
                <span className="text-[#C8102E]">یک راهکار یکپارچه</span>
              </h2>
            </div>
            <Link
              href="/services"
              className="text-[#161616] font-semibold border-b-2 border-[#C8102E] pb-0.5 text-sm hover:text-[#C8102E] transition-colors"
            >
              مشاهده همه توانمندی‌ها ←
            </Link>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Practice tabs */}
          <div className="lg:col-span-2 space-y-2">
            {practices.map((p, i) => (
              <AnimateOnScroll key={p.id} delay={i * 60}>
                <button
                  onClick={() => setActive(p.id)}
                  className={`w-full text-right p-5 rounded-sm border transition-all duration-200 ${
                    active === p.id
                      ? "bg-[#0B0B0D] border-[#C8102E] text-white"
                      : "bg-white border-[#E9E6E1] text-[#161616] hover:border-[#C8102E]/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold mb-1" style={{ color: active === p.id ? "#C8102E" : "#6B6B6B" }}>
                        {p.number} — {p.title}
                      </div>
                      <div className="font-bold text-base">{p.fa}</div>
                    </div>
                    <span className={`text-lg transition-colors ${active === p.id ? "text-[#C8102E]" : "text-[#E9E6E1]"}`}>←</span>
                  </div>
                </button>
              </AnimateOnScroll>
            ))}
          </div>

          {/* Practice detail */}
          <div className="lg:col-span-3">
            <AnimateOnScroll>
              <div className="bg-[#0B0B0D] rounded-sm p-8 md:p-10 h-full">
                <div className="text-[#C8102E] text-xs font-bold tracking-wider mb-2 uppercase">
                  {current.number} — {current.title}
                </div>
                <h3 className="text-white text-2xl md:text-3xl font-black mb-4">{current.fa}</h3>
                <p className="text-white/60 leading-relaxed mb-8">{current.desc}</p>

                <div className="grid grid-cols-2 gap-3">
                  {current.services.map((s) => (
                    <div
                      key={s}
                      className="flex items-center gap-2 bg-white/5 rounded-sm px-4 py-3 border border-white/5 hover:border-[#C8102E]/30 transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C8102E] flex-shrink-0" />
                      <span className="text-white/80 text-sm">{s}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-8 border-t border-white/10">
                  <Link
                    href="/services"
                    className="inline-flex items-center gap-2 text-[#C8102E] font-semibold text-sm hover:gap-3 transition-all"
                  >
                    مشاهده جزئیات این حوزه ←
                  </Link>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </div>
    </section>
  );
}
