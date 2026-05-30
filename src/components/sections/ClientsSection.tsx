import AnimateOnScroll from "@/components/AnimateOnScroll";

const clients = [
  { name: "بانک ملت", en: "Bank Mellat", sector: "Banking" },
  { name: "ایران‌خودرو", en: "Iran Khodro", sector: "Automotive" },
  { name: "ایرانسل", en: "Irancell", sector: "Telecom" },
  { name: "سامسونگ ایران", en: "Samsung Iran", sector: "Technology" },
  { name: "بانک پاسارگاد", en: "Bank Pasargad", sector: "Banking" },
  { name: "سایپا", en: "SAIPA", sector: "Automotive" },
  { name: "همراه اول", en: "Hamrahe Aval", sector: "Telecom" },
  { name: "ال‌جی ایران", en: "LG Iran", sector: "Appliances" },
  { name: "بانک آینده", en: "Bank Ayandeh", sector: "Banking" },
  { name: "مپنا", en: "MAPNA", sector: "Industrial" },
  { name: "اسنپ", en: "Snapp", sector: "Platform" },
  { name: "دیجی‌کالا", en: "Digikala", sector: "Retail" },
  { name: "بیمه ایران", en: "Bimeh Iran", sector: "Insurance" },
  { name: "پتروشیمی", en: "Petrochemical", sector: "Industrial" },
  { name: "بانک صادرات", en: "Bank Saderat", sector: "Banking" },
  { name: "رایتل", en: "RighTel", sector: "Telecom" },
];

export default function ClientsSection() {
  return (
    <section className="bg-white border-y border-[#E9E6E1] py-14 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <AnimateOnScroll>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px flex-1 max-w-20 bg-gradient-to-r from-transparent to-[#E9E6E1]" />
            <p className="text-center text-[#6B6B6B] text-sm font-medium">
              صدها برند ایرانی به ایران‌نوین اعتماد کرده‌اند
            </p>
            <div className="h-px flex-1 max-w-20 bg-gradient-to-l from-transparent to-[#E9E6E1]" />
          </div>
        </AnimateOnScroll>
      </div>

      {/* First row - normal direction */}
      <div className="overflow-hidden mb-3">
        <div className="marquee-track">
          {[...clients.slice(0, 8), ...clients.slice(0, 8)].map((client, i) => (
            <div
              key={i}
              className="flex-shrink-0 mx-3 px-6 py-3 bg-[#F7F7F5] border border-[#E9E6E1] rounded-sm hover:border-[#C8102E]/20 hover:bg-white transition-all group cursor-default"
            >
              <div className="text-[#161616] font-bold text-sm group-hover:text-[#C8102E] transition-colors whitespace-nowrap">
                {client.name}
              </div>
              <div className="text-[#6B6B6B] text-[10px] mt-0.5">{client.sector}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Second row - reverse direction */}
      <div className="overflow-hidden">
        <div className="marquee-track" style={{ animationDirection: "reverse", animationDuration: "35s" }}>
          {[...clients.slice(8), ...clients.slice(8)].map((client, i) => (
            <div
              key={i}
              className="flex-shrink-0 mx-3 px-6 py-3 bg-[#F7F7F5] border border-[#E9E6E1] rounded-sm hover:border-[#C8102E]/20 hover:bg-white transition-all group cursor-default"
            >
              <div className="text-[#161616] font-bold text-sm group-hover:text-[#C8102E] transition-colors whitespace-nowrap">
                {client.name}
              </div>
              <div className="text-[#6B6B6B] text-[10px] mt-0.5">{client.sector}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
