'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

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

const categories = [
  { value: 'semua', label: 'Semua Kategori' },
  { value: 'alam', label: 'Alam' },
  { value: 'pesona buatan', label: 'Pesona Buatan' },
  { value: 'Seni & budaya', label: 'Seni & budaya' }
];

const sortOptions = [
  { value: 'terbaru', label: 'Terbaru' },
  { value: 'terlama', label: 'Terlama' }
];

export default function ArtikelPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('semua');
  const [sortOrder, setSortOrder] = useState('terbaru');
  const [currentPage, setCurrentPage] = useState(1);
  
  const articlesPerPage = 6;

  // Fetch articles from Supabase
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('artikel')
          .select('*')
          .order('tanggal_terbit', { ascending: false });

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

  // Filter and sort articles
  const filteredArticles = articles
    .filter(article => {
      const matchesSearch = article.judul_artikel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           article.deskripsi_artikel.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'semua' || article.kategori_artikel.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortOrder === 'terbaru') {
        return new Date(b.tanggal_terbit).getTime() - new Date(a.tanggal_terbit).getTime();
      } else {
        return new Date(a.tanggal_terbit).getTime() - new Date(b.tanggal_terbit).getTime();
      }
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);
  const startIndex = (currentPage - 1) * articlesPerPage;
  const endIndex = startIndex + articlesPerPage;
  const currentArticles = filteredArticles.slice(startIndex, endIndex);

  // Reset to first page when filters change
  const handleFilterChange = (filterType: string, value: string) => {
    setCurrentPage(1);
    if (filterType === 'search') setSearchTerm(value);
    if (filterType === 'category') setSelectedCategory(value);
    if (filterType === 'sort') setSortOrder(value);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB] mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat artikel...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Search and Filter Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-center md:justify-between">
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Cari artikel..."
                  value={searchTerm}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-row gap-2 sm:gap-3 md:gap-4 items-center">
              {/* Category Filter */}
              <div className="flex-1 min-w-0">
                <select
                  value={selectedCategory}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-8 sm:pr-10 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none text-gray-900 bg-white appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 8px center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '16px'
                  }}
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Filter */}
              <div className="flex-1 min-w-0">
                <select
                  value={sortOrder}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-8 sm:pr-10 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none text-gray-900 bg-white appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 8px center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '16px'
                  }}
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600">
            Menampilkan {currentArticles.length} dari {filteredArticles.length} artikel
            {searchTerm && ` untuk "${searchTerm}"`}
            {selectedCategory !== 'semua' && ` dalam kategori ${categories.find(c => c.value === selectedCategory)?.label}`}
            {totalPages > 1 && ` - Halaman ${currentPage} dari ${totalPages}`}
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
          {currentArticles.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                {currentArticles.map(article => (
                <Link key={article.id_artikel} href={`/artikel/${article.id_artikel}`}>
                  <article className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden cursor-pointer h-full">
                    <div className="relative overflow-hidden">
                      <img
                        src={article.url_gambar || '/images/placeholder.png'}
                        alt={article.judul_artikel}
                        className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                        <span className="inline-block px-2.5 py-1 text-xs font-semibold text-white bg-[#2563EB] rounded-full capitalize">
                          {article.kategori_artikel}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4 sm:p-5 lg:p-6">
                      <div className="flex items-center gap-3 sm:gap-4 text-xs text-gray-500 mb-2 sm:mb-3">
                        <time>{formatDate(article.tanggal_terbit)}</time>
                        <span>•</span>
                        <span>{article.durasi_baca}</span>
                      </div>
                      
                      <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3 group-hover:text-[#2563EB] transition-colors line-clamp-2">
                        {article.judul_artikel}
                      </h3>
                      
                      <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3">
                        {article.deskripsi_artikel}
                      </p>
                      
                      <div className="inline-flex items-center text-sm sm:text-base text-[#EBAD25] font-semibold group-hover:text-[#C4901F] transition-colors">
                        Baca Selengkapnya
                        <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 sm:mt-12 flex justify-center">
                  <nav className="flex items-center gap-1 sm:gap-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                      // Show first, last, current, and adjacent pages
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium border ${
                              pageNum === currentPage
                                ? 'bg-[#2563EB] text-white border-[#2563EB]'
                                : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (
                        pageNum === currentPage - 2 ||
                        pageNum === currentPage + 2
                      ) {
                        return (
                          <span key={pageNum} className="px-2 py-2 text-sm text-gray-500">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}

                    {/* Next Button */}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </nav>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 sm:py-16">
              <svg className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-3 sm:mb-4" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Tidak ada artikel ditemukan</h3>
              <p className="text-sm sm:text-base text-gray-600 px-4">Coba ubah kata kunci pencarian atau filter yang dipilih</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}