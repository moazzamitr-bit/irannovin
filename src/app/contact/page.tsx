import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import ContactSection from "@/components/sections/ContactSection";

export default function ContactPage() {
  return (
    <main>
      <Header />

      <section className="bg-[#0B0B0D] pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <AnimateOnScroll>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">
              بیایید درباره
              <br />
              <span className="text-[#C8102E]">رشد برند شما</span>
              <br />
              صحبت کنیم
            </h1>
            <p className="text-white/60 text-xl max-w-2xl">
              تیم ما آماده است تا چالش‌های برند شما را بشنود و راهکار متناسب پیشنهاد دهد.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      <ContactSection />

      <section className="bg-[#111113] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { icon: "📍", label: "آدرس", value: "تهران، ایران" },
              { icon: "📧", label: "ایمیل", value: "info@irannovin.com" },
              { icon: "📞", label: "تلفن", value: "+98 21 XXXX XXXX" },
            ].map((item) => (
              <AnimateOnScroll key={item.label}>
                <div className="flex flex-col items-center">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <div className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-2">{item.label}</div>
                  <div className="text-white font-medium">{item.value}</div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
