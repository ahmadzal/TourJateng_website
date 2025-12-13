"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { supabase } from '@/lib/supabase';

type Article = {
  id_artikel: number;
  judul_artikel: string;
  deskripsi_artil: string;
  penerbit: string;
  kategori_artik: string;
  durasi_baca: string;
  url_gambar: string;
  tanggal_terbit: string;
};



function timeAgo(iso: string, currentTime: number) {
  const diff = currentTime - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec} detik lalu`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} menit lalu`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  return `${d} hari lalu`;
}

export default function ArticleList() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // auto-rotate featured article, but pause briefly when user selects an article manually
  const manualRef = useRef(false);
  const resumeTimeoutRef = useRef<number | null>(null);

  // Fetch articles from Supabase
  useEffect(() => {
    setIsMounted(true);
    setNow(Date.now());
    
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('artikel')
          .select('*')
          .order('tanggal_terbit', { ascending: false })
          .limit(4);

        if (error) throw error;
        setArticles(data || []);
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  useEffect(() => {
    if (!isMounted || articles.length === 0) return;
    
    const t = setInterval(() => {
      setIndex((i) => {
        if (manualRef.current) return i;
        return (i + 1) % articles.length;
      });
    }, 5000);
    const clock = setInterval(() => setNow(Date.now()), 10000);
    return () => {
      clearInterval(t);
      clearInterval(clock);
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, [articles, isMounted]);

  const featured = articles[index];

  function selectArticle(i: number) {
    setIndex(i);
    // mark as manual selection to pause auto-rotation briefly
    manualRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    // resume auto-rotation after 10 seconds of inactivity
    // use window.setTimeout to get number id compatible with TypeScript
    resumeTimeoutRef.current = window.setTimeout(() => {
      manualRef.current = false;
      resumeTimeoutRef.current = null;
    }, 10000) as unknown as number;
  }

  if (loading) {
    return (
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat artikel...</p>
          </div>
        </div>
      </section>
    );
  }

  if (articles.length === 0) {
    return (
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="text-center">
            <p className="text-gray-600">Belum ada artikel tersedia</p>
          </div>
        </div>
      </section>
    );
  }

  const latest = articles.reduce((acc, cur) => (new Date(cur.tanggal_terbit) > new Date(acc.tanggal_terbit) ? cur : acc), articles[0]);

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#2563EB]">Artikel Wisata TourJateng</h2>
            <p className="mt-3 text-sm md:text-base text-gray-600 max-w-2xl">Kumpulan artikel editorial, panduan dan inspirasi perjalanan yang disusun oleh Tim TourJateng.</p>
          </div>
          <div className="hidden md:block text-sm text-gray-500 whitespace-nowrap">Terakhir diperbarui • {isMounted && now ? timeAgo(latest.tanggal_terbit, now) : 'Loading...'}</div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <article className="col-span-1 md:col-span-2 rounded-xl overflow-hidden shadow-lg">
            <div className="relative h-64 md:h-80">
              <img src={featured.url_gambar || '/images/placeholder.png'} alt={featured.judul_artikel} className="w-full h-full object-cover" />
              <div className="absolute left-4 bottom-4 rounded-md bg-black/50 px-3 py-2 text-white">
                <div className="text-xs sm:text-sm opacity-90">Official</div>
                <h3 className="text-base sm:text-lg md:text-xl font-semibold">{featured.judul_artikel}</h3>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-white">
              <p className="text-sm sm:text-base text-gray-700 line-clamp-3">{featured.deskripsi_artil}</p>
              <div className="mt-3 sm:mt-4 flex items-center justify-between">
                <div className="text-xs sm:text-sm text-gray-500">{featured.penerbit} · {featured.durasi_baca}</div>
                <div className="flex items-center gap-2">
                  <Link href={`/artikel/${featured.id_artikel}`} className="inline-flex items-center rounded-md bg-[#2563EB] px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base text-white hover:bg-[#1F53C4] transition-colors">Baca Selengkapnya</Link>
                </div>
              </div>
            </div>
          </article>

          <aside className="hidden md:block col-span-1 space-y-4">
            {articles.map((a, i) => (
              <button
                key={a.id_artikel}
                type="button"
                onClick={() => selectArticle(i)}
                className={`w-full text-left flex gap-3 items-center rounded-lg p-3 transition ${a.id_artikel === featured.id_artikel ? "ring-2 ring-sky-100 bg-sky-50" : "bg-white hover:bg-sky-50"}`}
              >
                <img src={a.url_gambar || '/images/placeholder.png'} alt={a.judul_artikel} className="w-16 h-12 object-cover rounded-md" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">{a.judul_artikel}</div>
                  <div className="text-xs text-gray-500">{a.kategori_artik} · {isMounted && now ? timeAgo(a.tanggal_terbit, now) : 'Loading...'}</div>
                </div>
              </button>
            ))}
          </aside>
        </div>
      </div>
    </section>
  );
}
