"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

type QA = { q: string; a: string };

export default function FAQ() {
  const qas: QA[] = [
    {
      q: "Apa itu TourJateng?",
      a: "TourJateng adalah platform wisata digital yang membantu kamu menemukan destinasi terbaik di Jawa Tengah, dari keindahan alam hingga kekayaan seni & budaya.",
    },
    {
      q: "Kenapa harus pakai TourJateng?",
      a: "Karena kami tidak hanya memberi daftar tempat wisata, tapi juga rekomendasi yang dipersonalisasi sesuai minat kamu, plus fitur AI Bot yang siap membantu perjalananmu!",
    },
    {
      q: "Apakah aplikasi ini gratis?",
      a: "Ya! kamu bisa menjelajahi semua fitur tanpa biaya. Nikmati petualangan seru tanpa batasan!",
    },
    {
      q: "Apakah saya bisa berkontribusi dalam TourJateng?",
      a: "Tentu! kamu bisa berbagi pengalaman wisata, menulis ulasan, atau berdiskusi dengan wisatawan lain di forum.",
    },
    {
      q: "Bagaimana cara memulai petualangan saya?",
      a: "Cukup kunjungi TourJateng, cari destinasi impianmu, dan biarkan kami membantu kamu merencanakan perjalanan tak terlupakan!",
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const contentRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    contentRefs.current.forEach((el, idx) => {
      if (!el) return;
      if (openIndex === idx) {
        el.style.maxHeight = el.scrollHeight + "px";
      } else {
        el.style.maxHeight = "0px";
      }
    });
  }, [openIndex]);

  function toggle(i: number) {
    setOpenIndex((prev) => (prev === i ? null : i));
  }

  return (
    <section className="py-12 sm:py-16 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 items-start">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#2563EB]">Paling Sering Ditanyakan</h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">Temukan jawaban untuk pertanyaan umum tentang TourJateng dan layanan kami.</p>

            <div className="mt-20 w-full max-w-md hidden md:block">
              <Image src="/images/check.png" alt="FAQ Illustration" width={400} height={300} className="w-full h-auto rounded-lg object-contain" />
            </div>
          </div>

          <div className="space-y-2">
            {qas.map((qa, i) => (
              <div key={qa.q} className="rounded-lg border border-gray-100">
                <button
                  onClick={() => toggle(i)}
                  aria-expanded={openIndex === i}
                  className="w-full flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 text-left"
                >
                  <span className="text-sm sm:text-base text-[#2563EB] font-semibold">{qa.q}</span>
                  <svg
                    className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-500 transition-transform duration-300 flex-shrink-0 ml-2 ${openIndex === i ? "rotate-180" : "rotate-0"}`}
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                <div
                  ref={(el) => {
                    contentRefs.current[i] = el;
                  }}
                  className="max-h-0 overflow-hidden px-4 sm:px-5 transition-all duration-300"
                  style={{ maxHeight: 0 }}
                >
                  <div className="py-2 text-xs sm:text-sm text-gray-600 border-t border-gray-100">{qa.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

