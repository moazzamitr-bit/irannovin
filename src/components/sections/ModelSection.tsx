"use client";

import { useState } from "react";
import AnimateOnScroll from "@/components/AnimateOnScroll";

const layers = [
  {
    number: "۰۱",
    title: "Commercial & Client Growth",
    fa: "رشد تجاری و توسعه مشتریان",
    desc: "جذب مشتری، توسعه همکاری، طراحی راهکار، مدیریت رابطه و رشد اکانت‌ها.",
    color: "#C8102E",
    bgLight: "rgba(200,16,46,0.08)",
    tags: ["Account Growth", "Client Partnership", "Business Development", "Solution Design"],
    metric: "۵۰۰+",
    metricLabel: "برند همکار",
  },
  {
    number: "۰۲",
    title: "Practices & Capabilities",
    fa: "تخصص‌ها و توانمندی‌ها",
    desc: "استراتژی، خلاقیت، دیجیتال، رسانه، تولید، تجربه، محتوا، تکنولوژی و داده.",
    color: "#ffffff",
    bgLight: "rgba(255,255,255,0.05)",
    tags: ["Strategy", "Creative", "Digital", "Media", "Production", "Data & Tech"],
    metric: "۷۰+",
    metricLabel: "خدمت تخصصی",
  },
  {
    number: "۰۳",
    title: "Operations, Finance & Delivery",
    fa: "عملیات، مالی و تحویل",
    desc: "مدیریت پروژه، کنترل کیفیت، زمان‌بندی، سودآوری، شفافیت مالی و تحویل قابل اعتماد.",
    color: "#6B6B6B",
    bgLight: "rgba(107,107,107,0.08)",
    tags: ["Project Management", "Quality Control", "Financial Transparency", "Delivery"],
    metric: "۳۴+",
    metricLabel: "سال تجربه",
  },
];

export default function ModelSection() {
  const [activeLayer, setActiveLayer] = useState(0);

  return (
    <section className="bg-[#111113] py-24 md:py-32 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(200,16,46,0.3) 0%, transparent 50%),
                           radial-gradient(circle at 80% 50%, rgba(200,16,46,0.2) 0%, transparent 50%)`,
        }}
      />

      <div className="max-w-7xl mx-auto px-6 relative">
        <AnimateOnScroll>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="w-8 h-px bg-[#C8102E]" />
              <span className="text-[#C8102E] text-sm font-semibold tracking-wide uppercase">مدل عملیاتی</span>
              <span className="w-8 h-px bg-[#C8102E]" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
              مدل یکپارچه{" "}
              <span className="text-[#C8102E]">ایران‌نوین</span>
            </h2>
            <p className="text-white/45 text-lg max-w-2xl mx-auto">
              سه لایه هماهنگ که با هم یک سیستم کامل رشد برند را تشکیل می‌دهند.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {layers.map((layer, i) => (
            <AnimateOnScroll key={layer.number} delay={i * 150}>
              <button
                className={`w-full text-right relative overflow-hidden rounded-sm border transition-all duration-400 p-8 group ${
                  activeLayer === i
                    ? "border-[#C8102E]/50 bg-[#C8102E]/8"
                    : "border-white/8 bg-white/3 hover:bg-white/5 hover:border-white/15"
                }`}
                onClick={() => setActiveLayer(i)}
              >
                {/* Active indicator line */}
                {activeLayer === i && (
                  <div className="absolute top-0 right-0 left-0 h-0.5 bg-[#C8102E]" />
                )}

                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <span
                      className="text-5xl font-black leading-none block mb-3"
                      style={{ color: activeLayer === i ? "#C8102E" : "rgba(255,255,255,0.08)" }}
                    >
                      {layer.number}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-white">{layer.metric}</div>
                    <div className="text-white/35 text-xs">{layer.metricLabel}</div>
                  </div>
                </div>

                <div className="text-white/40 text-[10px] font-bold tracking-wider mb-1 uppercase">
                  {layer.title}
                </div>
                <h3 className="text-white text-lg font-black mb-3">{layer.fa}</h3>
                <p className="text-white/55 text-sm leading-relaxed mb-5">{layer.desc}</p>

                <div className="flex flex-wrap gap-1.5">
                  {layer.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
                        activeLayer === i
                          ? "border-[#C8102E]/30 text-[#C8102E]/80"
                          : "border-white/8 text-white/35"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            </AnimateOnScroll>
          ))}
        </div>

        {/* Connection visual */}
        <AnimateOnScroll delay={450}>
          <div className="mt-10 flex items-center justify-center gap-4">
            {layers.map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <button
                  onClick={() => setActiveLayer(i)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    activeLayer === i ? "bg-[#C8102E] scale-125" : "bg-white/20 hover:bg-white/40"
                  }`}
                />
                {i < layers.length - 1 && (
                  <div className="w-16 h-px bg-gradient-to-left from-transparent via-white/20 to-transparent" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-4 bg-[#C8102E]/10 border border-[#C8102E]/25 rounded-sm px-8 py-4">
              <div className="w-2 h-2 rounded-full bg-[#C8102E] animate-pulse" />
              <span className="text-white font-semibold text-sm">یک سیستم یکپارچه • یک تیم • یک هدف: رشد برند شما</span>
              <div className="w-2 h-2 rounded-full bg-[#C8102E] animate-pulse" />
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
