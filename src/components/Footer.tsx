import Link from "next/link";

const services = [
  "استراتژی برند",
  "خلاقیت و محتوا",
  "دیجیتال و پرفورمنس",
  "رسانه و تجربه",
  "تولید و استودیو",
  "CRM و داده",
];

const quickLinks = [
  { label: "درباره ما", href: "/about" },
  { label: "توانمندی‌ها", href: "/services" },
  { label: "نمونه‌کارها", href: "/work" },
  { label: "صنایع", href: "/industries" },
  { label: "بینش‌ها", href: "/insights" },
  { label: "فرصت‌های شغلی", href: "/careers" },
  { label: "تماس با ما", href: "/contact" },
];

const industries = [
  "بانک و بیمه و فین‌تک",
  "FMCG و مواد غذایی",
  "خودرو",
  "لوازم خانگی",
  "تلکام و پلتفرم",
  "مسکن و ساخت‌وساز",
  "خرده‌فروشی",
  "سلامت",
];

export default function Footer() {
  return (
    <footer className="bg-[#0B0B0D] text-white">
      {/* Top CTA bar */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold mb-2">آماده شروع همکاری هستید؟</h3>
            <p className="text-white/50 text-sm">با تیم ما درباره رشد برند خود صحبت کنید.</p>
          </div>
          <Link
            href="/contact"
            className="bg-[#C8102E] hover:bg-[#A50D25] text-white font-semibold px-8 py-3.5 rounded-sm transition-all whitespace-nowrap"
          >
            شروع همکاری ←
          </Link>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        {/* Brand */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-[#C8102E] rounded-sm flex items-center justify-center">
              <span className="text-white font-bold text-sm">IN</span>
            </div>
            <div>
              <div className="text-white font-bold text-base">ایران‌نوین</div>
              <div className="text-white/30 text-[10px] tracking-wider">IRAN NOVIN GROUP</div>
            </div>
          </div>
          <p className="text-white/50 text-sm leading-relaxed mb-6">
            شریک یکپارچه رشد برندها. از استراتژی و خلاقیت تا رسانه، دیجیتال، تولید و اجرا.
          </p>
          <div className="flex items-center gap-4">
            {["LinkedIn", "Instagram", "Aparat", "YouTube"].map((social) => (
              <a
                key={social}
                href="#"
                className="w-8 h-8 rounded-sm bg-white/5 hover:bg-[#C8102E] flex items-center justify-center text-white/50 hover:text-white text-xs transition-all"
                title={social}
              >
                {social[0]}
              </a>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h4 className="text-white font-semibold mb-6 text-sm tracking-wide">لینک‌های سریع</h4>
          <ul className="space-y-3">
            {quickLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-white/50 hover:text-white text-sm transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Services */}
        <div>
          <h4 className="text-white font-semibold mb-6 text-sm tracking-wide">توانمندی‌ها</h4>
          <ul className="space-y-3">
            {services.map((s) => (
              <li key={s}>
                <Link href="/services" className="text-white/50 hover:text-white text-sm transition-colors">
                  {s}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Industries + Contact */}
        <div>
          <h4 className="text-white font-semibold mb-6 text-sm tracking-wide">صنایع</h4>
          <ul className="space-y-3 mb-8">
            {industries.slice(0, 5).map((i) => (
              <li key={i}>
                <Link href="/industries" className="text-white/50 hover:text-white text-sm transition-colors">
                  {i}
                </Link>
              </li>
            ))}
          </ul>
          <h4 className="text-white font-semibold mb-3 text-sm tracking-wide">اطلاعات تماس</h4>
          <p className="text-white/50 text-sm">تهران، ایران</p>
          <a href="mailto:info@irannovin.com" className="text-white/50 hover:text-[#C8102E] text-sm transition-colors">
            info@irannovin.com
          </a>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-sm">
            © ۱۴۰۳ کانون ایران‌نوین. تمام حقوق محفوظ است.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-white/30 hover:text-white/60 text-xs transition-colors">حریم خصوصی</a>
            <a href="#" className="text-white/30 hover:text-white/60 text-xs transition-colors">شرایط استفاده</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
