"use client";
import React from "react";
import Link from "next/link";

export default function TourBotPreview() {
  const previewMessages = [
    { from: "bot", text: "Halo! Aku TourBot, asisten wisatamu di TourJateng.Aku bisa bantu nyari rekomendasi tempat seru, sampai kasih info penting biar liburanmu di Jawa Tengah." },
    { from: "user", text: "Rekomendasi destinasi akhir pekan dekat Semarang." },
    { from: "bot", text: "Bandungan, Ambarawa, dan Umbul Sidomukti cocok untuk pemandangan dan kuliner. Mau saya susun rencana 1 hari?" },
  ];

  const features = [
    { title: "Rekomendasi Personal", desc: "Memberikan saran destinasi berdasarkan preferensi pengguna" },
    { title: "Perencanaan Perjalanan", desc: "Menyusun itinerary perjalanan secara dinamis" },
    { title: "Info Praktis", desc: "Jam buka, biaya, dan tips lokal." },
    { title: "Asisten Percakapan Kontekstual", desc: "Memahami konteks percakapan dan pertanyaan lanjutan pengguna." },
  ];

  return (
    <section className="bg-sky-50">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#2563EB]">Asisten Virtual Wisatamu!</h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600">Rencanakan perjalanan impianmu di Jawa Tengah dengan bantuan AI. Travelbot siap membantu 24/7!</p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="hidden md:block md:col-span-2 rounded-xl bg-white p-4 shadow-md">
            <div className="rounded-md border border-gray-100 p-3 bg-gray-50">
              {previewMessages.map((m, idx) => (
                <div key={idx} className={`mb-4 flex items-start gap-3 ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                  {m.from === "bot" ? (
                    <>
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center overflow-hidden">
                          <img 
                            src="/images/robo.png" 
                            alt="TourBot Robot" 
                            className="h-8 w-8 object-contain"
                          />
                        </div>
                      </div>

                      <div className="bg-white text-gray-800 border rounded-lg px-4 py-2 shadow-sm max-w-[85%]">
                        {m.text}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-[#2563EB] text-white rounded-lg px-4 py-2 shadow-sm max-w-[85%]">
                        {m.text}
                      </div>

                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-[#2563EB] flex items-center justify-center text-white">
                          {/* user icon */}
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zM6 20c0-3.3137 2.6863-6 6-6s6 2.6863 6 6" />
                          </svg>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-xl bg-white p-4 sm:p-6 shadow-md">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Fitur Unggulan TourBot</h3>
            <ul className="space-y-2 sm:space-y-3">
              {features.map((f, index) => (
                <li key={f.title} className="flex items-start gap-2 sm:gap-3">
                  <div className="flex-shrink-0 flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-sky-100 text-[#2563EB]">
                    {index === 0 && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                    {index === 1 && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    )}
                    {index === 2 && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {index === 3 && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm sm:text-base font-medium text-gray-800 leading-tight">{f.title}</div>
                    <div className="text-xs sm:text-sm text-gray-500 mt-0.5 leading-snug">{f.desc}</div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 sm:mt-6">
              <Link href="/chatbot" className="w-full inline-flex items-center justify-center rounded-md bg-[#2563EB] px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base text-white hover:bg-[#1F53C4] transition-colors">Coba Sekarang</Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
