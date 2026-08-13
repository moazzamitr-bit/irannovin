import AnimateOnScroll from "@/components/AnimateOnScroll";

const clients = [
  "بانک ملت", "ایران‌خودرو", "ایرانسل", "سامسونگ ایران",
  "بانک پاسارگاد", "سایپا", "همراه اول", "ال‌جی ایران",
  "بانک آینده", "مپنا", "اسنپ", "دیجی‌کالا",
  "بیمه ایران", "پتروشیمی", "بانک صادرات", "رایتل",
];

export default function ClientsSection() {
  return (
    <section className="bg-white border-y border-[#E9E6E1] py-14 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <AnimateOnScroll>
          <p className="text-center text-[#6B6B6B] text-sm font-medium tracking-wide">
            صدها برند ایرانی به ایران‌نوین اعتماد کرده‌اند
          </p>
        </AnimateOnScroll>
      </div>

      {/* Marquee */}
      <div className="overflow-hidden">
        <div className="marquee-track">
          {[...clients, ...clients].map((client, i) => (
            <div
              key={i}
              className="flex-shrink-0 mx-6 px-8 py-3 bg-[#F7F7F5] border border-[#E9E6E1] rounded-sm text-[#6B6B6B] font-semibold text-sm whitespace-nowrap hover:border-[#C8102E]/30 hover:text-[#161616] transition-colors"
            >
              {client}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
