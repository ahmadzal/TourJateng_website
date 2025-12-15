import Link from "next/link";
import Image from "next/image";
import ArticleList from "../components/ArticleList";
import TourBotPreview from "../components/TourBotPreview";
import FAQ from "../components/FAQ";
import ClientOnly from "../components/ClientOnly";
import { Playfair_Display } from "next/font/google";

const playfairDisplay = Playfair_Display({ subsets: ['latin'], weight: ['400', '700', '900'] });

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-16 lg:py-20 min-h-[100vh] md:min-h-[100vh] lg:min-h-0 flex items-center">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6 md:gap-8 lg:gap-12 w-full">
          {/* Left column: text */}
          <div className="max-w-xl mx-auto md:mx-0 text-center md:text-left">
            <h1 className={`text-xl sm:text-2xl lg:text-4xl font-extrabold leading-tight text-gray-900 ${playfairDisplay.className}`}>
              Ciptakan Momen Spesial di Destinasi Menakjubkan Jawa Tengah!
            </h1>

            <p className="mt-4 sm:mt-6 text-sm sm:text-base text-gray-600">
              Jelajahi keindahan alam, budaya, dan kuliner yang tak terlupakan di Jawa
              Tengah. Temukan pengalaman baru dan buat kenangan yang akan selalu
              dikenang!
            </p>

            <div className="mt-6 sm:mt-8">
              <Link
                href="/destinasi"
                className="inline-flex items-center justify-center w-full sm:w-auto rounded-full bg-[#2563EB] px-5 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base text-white shadow hover:bg-[#1F53C4] transition-colors"
              >
                Mulai Eksplorasi
                <svg
                  className="ml-2 sm:ml-3 h-3.5 w-3.5 sm:h-4 sm:w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Right column: image - hidden on mobile, smaller on tablet */}
          <div className="hidden md:flex items-center justify-center">
            <div className="relative w-full max-w-xs md:max-w-sm lg:max-w-lg">
              <Image
                src="/images/Traveller.png"
                alt="Traveler sitting on suitcase"
                width={640}
                height={640}
                className="w-full rounded-xl object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>
      {/* Features / info section under hero */}
      <section className="bg-sky-100 min-h-[100vh] md:min-h-[100vh] lg:min-h-0 flex items-center">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-16 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-center">
            <div className="hidden md:flex items-center justify-center order-first">
              <div className="w-full max-w-xs md:max-w-sm lg:max-w-lg rounded-xl">
                <img
                  src="/images/Bingung.jpeg"
                  alt="Travellers"
                  className="w-full h-auto rounded-md object-cover"
                />
              </div>
            </div>

            <div className="text-center md:text-left">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#2563EB]">Bingung Memilih tempat wisata?</h2>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-700">
                TourJateng menawarkan begitu banyak keindahan dan pengalaman unik. Dari Candi Borobudur yang megah hingga pesona alam Karimunjawa, pilihan destinasi wisata seolah tak ada habisnya.
              </p>

              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-700">
                Namun, dengan begitu banyak pilihan, tindakan Anda merasa:
              </p>

              <ul className="mt-3 sm:mt-4 list-disc list-inside text-sm sm:text-base text-gray-700 space-y-2">
                <li>Kesulitan menentukan destinasi yang sesuai dengan minat Anda?</li>
                <li>Bingung merencanakan rute perjalanan yang efisien?</li>
                <li>Kurang informasi tentang pengalaman nyata dari pengunjung sebelumnya?</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      
      {/* Solutions section (Kami Hadir dengan Solusi) */}
      <section className="bg-white min-h-[100vh] md:min-h-[100vh] lg:min-h-0 flex items-center">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-16 w-full">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#2563EB]">Kami Hadir dengan Solusi</h2>
            <p className="mx-auto mt-3 sm:mt-4 max-w-2xl text-sm sm:text-base text-gray-600">
              TourJateng menawarkan hadir untuk membantu kamu untuk menemukan dan merencanakan
              perjalanan wisata terbaik di jawa tengah. Berikut merupakan fitur - fitur unggulan kami :
            </p>
          </div>

          <div className="mt-6 sm:mt-8 lg:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="rounded-xl bg-white p-6 sm:p-8 shadow-md">
              <div className="flex items-center justify-center">
                <svg className="h-8 w-8 sm:h-10 sm:w-10 text-[#2563EB]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                </svg>
              </div>
              <h3 className="mt-4 sm:mt-6 text-center text-base sm:text-lg font-semibold text-[#2563EB]">Rekomendasi Personalisasi</h3>
              <p className="mt-2 sm:mt-3 text-center text-sm sm:text-base text-gray-600">Dapatkan saran destinasi yang sesuai dengan minat dan preferensi kamu</p>
            </div>

            <div className="rounded-xl bg-white p-6 sm:p-8 shadow-md">
              <div className="flex items-center justify-center">
                <svg className="h-8 w-8 sm:h-10 sm:w-10 text-[#2563EB]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <h3 className="mt-4 sm:mt-6 text-center text-base sm:text-lg font-semibold text-[#2563EB]">Komunitas Traveler</h3>
              <p className="mt-2 sm:mt-3 text-center text-sm sm:text-base text-gray-600">Berbagi pengalaman dan dapatkan tips dari sesama pecinta wisata Jawa Tengah</p>
            </div>

            <div className="rounded-xl bg-white p-6 sm:p-8 shadow-md">
              <div className="flex items-center justify-center">
                <svg className="h-8 w-8 sm:h-10 sm:w-10 text-[#2563EB]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.020.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.740.194V21l4.155-4.155" />
                </svg>
              </div>
              <h3 className="mt-4 sm:mt-6 text-center text-base sm:text-lg font-semibold text-[#2563EB]">Chatbot AI</h3>
              <p className="mt-2 sm:mt-3 text-center text-sm sm:text-base text-gray-600">Optimalkan persiapan perjalananmu dengan bantuan Assistant virtual kami</p>
            </div>
          </div>
        </div>
      </section>
      {/* 'Kami Membantu Menemukan Tempat Impianmu' section */}
      <section className="bg-sky-100 min-h-[100vh] md:min-h-[100vh] lg:min-h-0 flex items-center">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-16 w-full">
          <div className="grid grid-cols-1 gap-8 lg:gap-12 lg:grid-cols-2 items-start">
            {/* Left: heading, text, cards, CTA */}
            <div className="text-center lg:text-left">
              <h2 className="text-xl sm:text-2xl lg:text-4xl font-extrabold text-[#2563EB]">Kami Membantu Menemukan Tempat Impianmu</h2>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-700 max-w-2xl">
                Nikmati destinasi wisata yang memukau dengan kenyamanan maksimal. Kami memahami bahwa setiap perjalanan adalah pengalaman berharga, itulah mengapa kami hanya menawarkan harga terbaik dengan perlindungan penuh. Mulailah petualanganmu dan dapatkan pengalaman tak terlupakan bersama TourJateng.
              </p>

              <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-lg bg-sky-200 p-4 sm:p-6 shadow-md">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="rounded-full bg-sky-100 p-1.5 sm:p-2">
                      <svg className="h-5 w-5 sm:h-6 sm:w-6 text-[#2563EB]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1115 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base text-[#2563EB] font-semibold">600+ Destinasi</h4>
                      <p className="text-xs sm:text-sm text-gray-700">Destinasi wisata eksklusif di Jawa Tengah.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-sky-200 p-4 sm:p-6 shadow-md">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="rounded-full bg-sky-100 p-1.5 sm:p-2">
                      <svg className="h-5 w-5 sm:h-6 sm:w-6 text-[#2563EB]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base text-[#2563EB] font-semibold">3 Kategori</h4>
                      <p className="text-xs sm:text-sm text-gray-700">Pilihan sesuai minat dan preferensimu.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-sky-200 p-4 sm:p-6 shadow-md">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="rounded-full bg-sky-100 p-1.5 sm:p-2">
                      <svg className="h-5 w-5 sm:h-6 sm:w-6 text-[#2563EB]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.158.69-.158 1.006 0l4.994 2.497c.317.158.69.158 1.007 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base text-[#2563EB] font-semibold">36 Kota & Kabupaten</h4>
                      <p className="text-xs sm:text-sm text-gray-700">Keunikan dan pesona masing-masing daerah.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-sky-200 p-4 sm:p-6 shadow-md">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="rounded-full bg-sky-100 p-1.5 sm:p-2">
                      <svg className="h-5 w-5 sm:h-6 sm:w-6 text-[#2563EB]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base text-[#2563EB] font-semibold">100% Personalisasi</h4>
                      <p className="text-xs sm:text-sm text-gray-700">Rekomendasi sesuai gaya perjalananmu.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 sm:mt-8">
                <Link href="/destinasi" className="inline-flex items-center justify-center w-full sm:w-auto rounded-md bg-[#2563EB] px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base text-white shadow hover:bg-[#1F53C4] transition-colors">
                  Mulai Perjalananmu
                </Link>
              </div>
            </div>

            {/* Right: 2x2 image grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <img src="/images/des1.png" alt="dest1" className="h-44 w-full rounded-lg object-cover" />
              <img src="/images/des2.png" alt="dest2" className="h-44 w-full rounded-lg object-cover" />
              <img src="/images/des3.png" alt="dest3" className="h-44 w-full rounded-lg object-cover" />
              <img src="/images/des4.png" alt="dest4" className="h-44 w-full rounded-lg object-cover" />
            </div>
          </div>
        </div>
      </section>
      {/* Gallery: Nikmati Pesona Keindahan Jawa Tengah */}
      <section className="bg-white min-h-[100vh] md:min-h-[100vh] lg:min-h-0 flex items-center">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-16 w-full">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#2563EB]">Nikmati Pesona Keindahan Jawa Tengah</h2>
            <p className="mx-auto mt-3 sm:mt-4 max-w-2xl text-sm sm:text-base text-gray-600">
              TourJateng menyajikan keindahan dan pesona destinasi lokal melalui koleksi foto terbaik. Temukan inspirasi liburanmu dan rasakan keajaiban dari setiap sudut destinasi melalui tampilan visual yang memikat hati.
            </p>
          </div>

          <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="relative overflow-hidden rounded-xl shadow-md group">
              <img src="/images/PG.jpg" alt="Promas Greend Land" className="w-full h-56 object-cover transform transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 flex items-end bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <div className="p-4 text-white">
                  <h3 className="text-lg font-semibold">Promas Greend Land</h3>
                  <p className="mt-1 text-sm text-white/90">Promas Greend Land Area wisata keluarga bernuansa alam hijau dengan berbagai wahana bermain dan spot foto menarik.</p>
                  <p className="mt-2 text-xs text-yellow-300 font-medium">📍 Nglimut, Kabupaten Kendal</p>
                </div>
              </div>  
            </div>

            <div className="relative overflow-hidden rounded-xl shadow-md group">
              <img src="/images/Borobudur.png" alt="Candi Borobudur" className="w-full h-56 object-cover transform transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 flex items-end bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <div className="p-4 text-white">
                  <h3 className="text-lg font-semibold">Candi Borobudur</h3>
                  <p className="mt-1 text-sm text-white/90">Candi Borobudur memukau dengan kemegahan stupa bertingkat dan panorama perbukitan yang menghadirkan suasana spiritual yang tenang.</p>
                  <p className="mt-2 text-xs text-yellow-300 font-medium">📍 Borobudur, Kabupaten Magelang</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl shadow-md group">
              <img src="/images/CurugLawe.png" alt="Curug Lawe" className="w-full h-56 object-cover transform transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 flex items-end bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <div className="p-4 text-white">
                  <h3 className="text-lg font-semibold">Curug Lawe</h3>
                  <p className="mt-1 text-sm text-white/90">Curug Lawe menawarkan aliran air tinggi yang sejuk dengan suasana alam hijau yang masih asri dan menenangkan.</p>
                  <p className="mt-2 text-xs text-yellow-300 font-medium">📍 Ungaran, Kabupaten Semarang</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl shadow-md group">
              <img src="/images/TelagaWarna.jpg" alt="Telaga Warna" className="w-full h-56 object-cover transform transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 flex items-end bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <div className="p-4 text-white">
                  <h3 className="text-lg font-semibold">Telaga Warna</h3>
                  <p className="mt-1 text-sm text-white/90">Telaga eksotis di Dieng dengan air yang berubah warna sesuai cuaca dan pantulan cahaya matahari.</p>
                  <p className="mt-2 text-xs text-yellow-300 font-medium">📍 Dieng, Kabupaten Wonosobo</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl shadow-md group">
              <img src="/images/HPS.jpg" alt="Hutan Pinus Sawangan" className="w-full h-56 object-cover transform transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 flex items-end bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <div className="p-4 text-white">
                  <h3 className="text-lg font-semibold">Hutan Pinus Sawangan</h3>
                  <p className="mt-1 text-sm text-white/90">Hutan Pinus Sawangan menyajikan deretan pohon pinus menjulang dan spot foto alam yang estetik serta menyejukkan mata.</p>
                  <p className="mt-2 text-xs text-yellow-300 font-medium">📍 Sawangan, Kabupaten Banyumas</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl shadow-md group">
              <img src="/images/PantaiMenganti.png" alt="Pantai Menganti" className="w-full h-56 object-cover transform transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 flex items-end bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <div className="p-4 text-white">
                  <h3 className="text-lg font-semibold">Pantai Menganti</h3>
                  <p className="mt-1 text-sm text-white/90">Pantai Menganti menampilkan kombinasi pasir putih, tebing hijau, dan ombak biru jernih yang menciptakan pemandangan pesisir yang dramatis.</p>
                  <p className="mt-2 text-xs text-yellow-300 font-medium">📍 Logending, Kabupaten Kebumen</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

  {/* Forum Diskusi section */}
      <section className="bg-sky-100 min-h-[100vh] md:min-h-[100vh] lg:min-h-0 flex items-center">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-16 w-full">
          <div className="grid grid-cols-1 gap-8 lg:gap-12 lg:grid-cols-2 items-center">
            <div className="text-left">
              <h3 className="mt-0 sm:mt-6 text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#2563EB]">Bergabung dengan Komunitas Traveler</h3>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-700 max-w-xl">
                Diskusikan rute perjalanan, minta rekomendasi, berbagi pengalaman, dan dapatkan tips praktis dari traveler lain. Forum kami adalah tempat bertanya, belajar, dan terinspirasi.
              </p>

              <ul className="mt-4 sm:mt-6 grid gap-2 sm:gap-3">
                <li className="flex items-start gap-2 sm:gap-3">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-[#2563EB] mt-0.5 sm:mt-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span className="text-sm sm:text-base text-gray-700">Rute & pengalaman perjalanan dari wisatawan lain</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-[#2563EB] mt-0.5 sm:mt-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span className="text-sm sm:text-base text-gray-700">Tips eksplorasi destinasi dan kegiatan budaya lokal</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-[#2563EB] mt-0.5 sm:mt-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span className="text-sm sm:text-base text-gray-700">Panduan keamanan & etika berwisata dari komunitas</span>
                </li>
              </ul>

              <div className="mt-5 sm:mt-6 flex gap-3">
                <Link
                  href="/forum"
                  className="inline-flex items-center rounded-md border border-[#2563EB] px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base text-[#2563EB] bg-white transition-colors duration-200 hover:bg-[#1F53C4] hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  Kunjungi Forum
                </Link>
              </div>
            </div>

            <div>
              <div className="rounded-2xl bg-gradient-to-br from-white to-sky-50/30 p-6 shadow-lg border border-sky-100/50">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-sky-100">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1F53C4] shadow-md">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-800">Topik Terbaru</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Diskusi populer hari ini</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="group p-3.5 hover:bg-white/80 transition-all duration-300 rounded-xl cursor-default border border-transparent hover:border-sky-200 hover:shadow-md">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <h5 className="text-sm font-semibold text-gray-800 group-hover:text-[#2563EB] transition-colors line-clamp-1 flex-1">
                        Rekomendasi rute 3 hari di Dieng
                      </h5>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-sky-100 group-hover:bg-[#2563EB] transition-colors">
                        <svg className="w-3 h-3 text-[#2563EB] group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                        </svg>
                        <span className="text-xs font-bold text-[#2563EB] group-hover:text-white transition-colors">23</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-medium">Agung Wonosobo</span>
                      <span>•</span>
                      <span>2 jam lalu</span>
                    </div>
                  </div>

                  <div className="group p-3.5 hover:bg-white/80 transition-all duration-300 rounded-xl cursor-default border border-transparent hover:border-sky-200 hover:shadow-md">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <h5 className="text-sm font-semibold text-gray-800 group-hover:text-[#2563EB] transition-colors line-clamp-1 flex-1">
                        Tips mengunjungi Borobudur saat sunrise
                      </h5>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-sky-100 group-hover:bg-[#2563EB] transition-colors">
                        <svg className="w-3 h-3 text-[#2563EB] group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                        </svg>
                        <span className="text-xs font-bold text-[#2563EB] group-hover:text-white transition-colors">41</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-medium">Aprilia Setiawati</span>
                      <span>•</span>
                      <span>5 jam lalu</span>
                    </div>
                  </div>

                  <div className="group p-3.5 hover:bg-white/80 transition-all duration-300 rounded-xl cursor-default border border-transparent hover:border-sky-200 hover:shadow-md">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <h5 className="text-sm font-semibold text-gray-800 group-hover:text-[#2563EB] transition-colors line-clamp-1 flex-1">
                        Penginapan murah di Karimunjawa?
                      </h5>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-sky-100 group-hover:bg-[#2563EB] transition-colors">
                        <svg className="w-3 h-3 text-[#2563EB] group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                        </svg>
                        <span className="text-xs font-bold text-[#2563EB] group-hover:text-white transition-colors">12</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-medium">Admin TourJateng</span>
                      <span>•</span>
                      <span>1 hari lalu</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
  {/* Artikel section (dynamic) */}
  <ClientOnly fallback={<div className="flex justify-center items-center py-16"><div className="text-gray-500">Loading articles...</div></div>}>
    <ArticleList />
  </ClientOnly>

  {/* Asisten Virtual Wisatamu - TourBot preview */}
  <ClientOnly fallback={<div className="flex justify-center items-center py-16"><div className="text-gray-500">Loading preview...</div></div>}>
    <TourBotPreview />
  </ClientOnly>
  
  <ClientOnly fallback={<div className="flex justify-center items-center py-16"><div className="text-gray-500">Loading FAQ...</div></div>}>
    <FAQ />
  </ClientOnly>
  
  {/* Community CTA section */}
  <section className="bg-[#2563EB] min-h-[50vh] md:min-h-[60vh] lg:min-h-0 flex items-center">
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-16 text-center w-full">
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white">Bergabunglah dengan Komunitas Traveler Jawa Tengah</h2>
      <p className="mt-3 sm:mt-4 max-w-2xl mx-auto text-sm sm:text-base text-white/90">Dapatkan akses ke fitur eksklusif, forum diskusi, dan rekomendasi perjalanan personal. Mulai petualangan kamu sekarang!</p>

      <div className="mt-6 sm:mt-8">
        <Link href="/" className="inline-flex items-center justify-center w-full sm:w-auto rounded-full bg-white px-5 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base text-[#2563EB] font-semibold shadow-lg hover:shadow-xl focus:outline-none transition-shadow">
          Daftar Gratis
          <svg className="ml-2 sm:ml-3 h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </div>
  </section>
    </main>
  );
}