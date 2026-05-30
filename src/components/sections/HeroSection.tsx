"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Counter from "@/components/Counter";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: "easeOut" as const },
});

export default function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    const nodes: { x: number; y: number; vx: number; vy: number; r: number; opacity: number }[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 50; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.15,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(200, 16, 46, ${0.12 * (1 - dist / 160)})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;

        ctx.beginPath();
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 4);
        grad.addColorStop(0, `rgba(200, 16, 46, ${n.opacity})`);
        grad.addColorStop(1, "rgba(200, 16, 46, 0)");
        ctx.fillStyle = grad;
        ctx.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2);
        ctx.fill();
      });

      animFrame = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-[#0B0B0D]">
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: `linear-gradient(rgba(200,16,46,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(200,16,46,0.06) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Animated canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Glow orbs */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-[#C8102E]/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full bg-[#C8102E]/5 blur-2xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="max-w-4xl">
          {/* Badge */}
          <motion.div {...fadeUp(0.1)} className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-[#C8102E] animate-pulse" />
            <span className="text-white/60 text-xs font-medium tracking-wide">
              Iran Novin Advertising & Marketing Group
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1 {...fadeUp(0.2)} className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6">
            رشد برندها،{" "}
            <span className="text-[#C8102E]">با قدرت یکپارچه</span>{" "}
            ایران‌نوین
          </motion.h1>

          {/* Subheadline */}
          <motion.p {...fadeUp(0.35)} className="text-lg md:text-xl text-white/55 leading-relaxed mb-10 max-w-3xl">
            از استراتژی و خلاقیت تا رسانه، دیجیتال، تولید، تجربه و اجرا؛ ایران‌نوین شریک یکپارچه برندها
            برای ساخت کمپین‌های اثرگذار و رشد پایدار است.
          </motion.p>

          {/* CTAs */}
          <motion.div {...fadeUp(0.45)} className="flex flex-wrap items-center gap-4 mb-16">
            <Link
              href="/services"
              className="bg-[#C8102E] hover:bg-[#A50D25] text-white font-bold px-8 py-4 rounded-sm text-base transition-all hover:shadow-2xl hover:shadow-red-900/40 hover:-translate-y-0.5"
            >
              مشاهده توانمندی‌ها
            </Link>
            <Link
              href="/contact"
              className="group flex items-center gap-2 bg-white/8 hover:bg-white/15 border border-white/15 text-white font-semibold px-8 py-4 rounded-sm text-base transition-all"
            >
              شروع همکاری
              <span className="group-hover:translate-x-[-4px] transition-transform">←</span>
            </Link>
          </motion.div>

          {/* Stats strip */}
          <motion.div {...fadeUp(0.55)} className="flex flex-wrap items-center gap-8 pt-8 border-t border-white/10">
            {[
              { value: 34, suffix: "+ سال", label: "تجربه در بازار ایران" },
              { value: 700, suffix: "+", label: "متخصص و کارشناس" },
              { value: 70, suffix: "+", label: "خدمت و توانمندی" },
              { value: 500, suffix: "+", label: "برند همکار" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <span className="text-3xl font-black text-white">
                  <Counter end={stat.value} suffix={stat.suffix} />
                </span>
                <span className="text-white/35 text-xs mt-0.5">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Vertical text decoration */}
      <div className="absolute top-1/2 -translate-y-1/2 left-6 hidden xl:flex flex-col items-center gap-4 opacity-20">
        <div className="w-px h-20 bg-white/30" />
        <p className="text-white/50 text-[10px] tracking-[0.3em] rotate-90 whitespace-nowrap">IRAN NOVIN GROUP</p>
        <div className="w-px h-20 bg-white/30" />
      </div>

      {/* Scroll indicator */}
      <motion.div
        {...fadeUp(1)}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-white/25 text-[10px] tracking-widest uppercase">Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-white/25 to-transparent" />
      </motion.div>
    </section>
  );
}
