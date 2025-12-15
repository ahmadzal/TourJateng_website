'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';

interface Article {
  id_artikel: number;
  judul_artikel: string;
  deskripsi_artikel: string;
  kategori_artikel: string;
  durasi_baca: string;
  penerbit: string;
  url_gambar: string;
  tanggal_terbit: string;
}

export default function ArticlePage() {
  const params = useParams();
  const articleId = parseInt(params.id as string);
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setIsLoading(true);
        
        // Fetch main article
        const { data: articleData, error: articleError } = await supabase
          .from('artikel')
          .select('*')
          .eq('id_artikel', articleId)
          .single();

        if (articleError) throw articleError;
        setArticle(articleData);

        // Fetch related articles (same category)
        if (articleData) {
          const { data: relatedData, error: relatedError } = await supabase
            .from('artikel')
            .select('*')
            .eq('kategori_artik', articleData.kategori_artik)
            .neq('id_artikel', articleId)
            .limit(3);

          if (!relatedError && relatedData) {
            setRelatedArticles(relatedData);
          }
        }
      } catch (error) {
        console.error('Error fetching article:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
  }, [articleId]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB] mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat artikel...</p>
        </div>
      </main>
    );
  }

  if (!article) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Artikel Tidak Ditemukan</h1>
          <p className="text-gray-600 mb-6">Maaf, artikel yang Anda cari tidak dapat ditemukan.</p>
          <Link href="/artikel" className="inline-flex items-center text-[#2563EB] font-semibold hover:text-[#1F53C4]">
            ← Kembali ke Daftar Artikel
          </Link>
        </div>
      </main>
    );
  }

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <nav className="bg-gray-50 border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
            <Link href="/" className="hover:text-[#2563EB]">Beranda</Link>
            <span>›</span>
            <Link href="/artikel" className="hover:text-[#2563EB]">Artikel</Link>
            <span>›</span>
            <span className="text-gray-900 capitalize">{article.kategori_artikel}</span>
          </div>
        </div>
      </nav>

      {/* Article Content */}
      <article className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12 text-gray-900">
        {/* Article Header */}
        <header className="mb-6 sm:mb-8">
          <div className="mb-3 sm:mb-4">
            <span className="inline-block px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-semibold text-white bg-[#2563EB] rounded-full capitalize">
              {article.kategori_artikel}
            </span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
            {article.judul_artikel}
          </h1>
          
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-6 text-xs sm:text-sm text-gray-600 mb-6 sm:mb-8">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Oleh {article.penerbit}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <time>{formatDate(article.tanggal_terbit)}</time>
            </div>
            
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{article.durasi_baca}</span>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        <div className="mb-6 sm:mb-8">
          <img
            src={article.url_gambar || '/images/placeholder.png'}
            alt={article.judul_artikel}
            className="w-full h-48 sm:h-64 md:h-80 lg:h-96 object-cover rounded-lg sm:rounded-xl shadow-lg"
          />
        </div>

        {/* Article Content */}
        <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:text-justify prose-ul:text-gray-700 prose-ol:text-gray-700 prose-strong:text-gray-900">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="text-justify mb-3 sm:mb-4 text-sm sm:text-base">{children}</p>,
              h1: ({ children }) => <h1 className="text-2xl sm:text-3xl font-bold mt-6 sm:mt-8 mb-3 sm:mb-4">{children}</h1>,
              h2: ({ children }) => <h2 className="text-xl sm:text-2xl font-bold mt-5 sm:mt-6 mb-2 sm:mb-3">{children}</h2>,
              h3: ({ children }) => <h3 className="text-lg sm:text-xl font-bold mt-4 sm:mt-5 mb-2">{children}</h3>,
              ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
              li: ({ children }) => <li className="text-justify">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              blockquote: ({ children }) => <blockquote className="border-l-4 border-[#2563EB] pl-4 italic my-4 text-gray-600">{children}</blockquote>,
            }}
          >
            {article.deskripsi_artikel}
          </ReactMarkdown>
        </div>

        {/* Share Buttons */}
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Bagikan Artikel Ini</h3>
          <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4">
            <button 
              onClick={() => {
                const url = encodeURIComponent(window.location.href);
                const text = encodeURIComponent(article?.judul_artikel || '');
                window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="hidden xs:inline">X</span>
            </button>
            
            <button 
              onClick={() => {
                const url = encodeURIComponent(window.location.href);
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="hidden xs:inline">Facebook</span>
            </button>
            
            <button 
              onClick={() => {
                const url = encodeURIComponent(window.location.href);
                const text = encodeURIComponent(article?.judul_artikel || '');
                window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              <span className="hidden xs:inline">WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-gray-200">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 lg:mb-8">Artikel Terkait</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {relatedArticles.map(relatedArticle => (
                <Link key={relatedArticle.id_artikel} href={`/artikel/${relatedArticle.id_artikel}`} className="group">
                  <article className="bg-white rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                    <img
                      src={relatedArticle.url_gambar || '/images/placeholder.png'}
                      alt={relatedArticle.judul_artikel}
                      className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="p-3 sm:p-4">
                      <div className="text-xs text-gray-500 mb-1.5 sm:mb-2">
                        <span className="capitalize">{relatedArticle.kategori_artikel}</span> • {relatedArticle.durasi_baca}
                      </div>
                      <h4 className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-[#2563EB] transition-colors line-clamp-2">
                        {relatedArticle.judul_artikel}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1.5 sm:mt-2 line-clamp-2">
                        {relatedArticle.deskripsi_artikel}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back to Articles */}
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200 text-center">
          <Link 
            href="/artikel" 
            className="inline-flex items-center gap-2 text-sm sm:text-base text-[#2563EB] font-semibold hover:text-[#1F53C4] transition-colors"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Daftar Artikel
          </Link>
        </div>
      </article>
    </main>
  );
}
