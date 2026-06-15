import Link from "next/link";

export default function CTASection() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to right, rgba(10,10,11,0.9) 0%, rgba(10,10,11,0.7) 100%), url('https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=1800&q=80') center/cover no-repeat`,
        }}
      />
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 flex flex-col lg:flex-row items-center justify-between gap-10">
        <div>
          <p className="text-[#c8973d] text-xs font-semibold tracking-[0.3em] uppercase mb-4">
            LET&apos;S BUILD WHAT&apos;S NEXT
          </p>
          <h2 className="text-4xl md:text-5xl font-black text-white">
            Ready to collaborate?
          </h2>
          <p className="text-gray-400 text-sm mt-4 max-w-md leading-relaxed">
            Whether you have an RFQ, partnership inquiry or a project in mind,
            our team is ready to connect and create value together.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-[#c8973d] text-black text-xs font-bold tracking-wider px-8 py-4 hover:bg-[#e8b86d] transition-colors"
          >
            SUBMIT AN RFQ
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 border border-white/40 text-white text-xs font-bold tracking-wider px-8 py-4 hover:border-[#c8973d] hover:text-[#c8973d] transition-colors"
          >
            CONTACT OUR TEAM
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
