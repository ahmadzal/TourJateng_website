'use client';

import { useState, useEffect, useRef } from 'react';

export default function TentangPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: boolean}>({});
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
  const [isImageHovered, setIsImageHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [spotlightSize, setSpotlightSize] = useState(200);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const roles = [
    { title: 'Full Stack Developer', subtitle: 'Passionate about Travel Tech' },
    { title: 'UI/UX Designer', subtitle: 'Creating Beautiful Experiences' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentRoleIndex((prev) => (prev + 1) % roles.length);
    }, 3000); // Ganti setiap 3 detik

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateSpotlightSize = () => {
      setSpotlightSize(window.innerWidth < 768 ? 120 : 200);
    };
    
    updateSpotlightSize();
    window.addEventListener('resize', updateSpotlightSize);
    
    return () => window.removeEventListener('resize', updateSpotlightSize);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (imageContainerRef.current) {
      const rect = imageContainerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePos({ x, y });
    }
  };

  const clearFieldError = (fieldName: string) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => ({
        ...prev,
        [fieldName]: false
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    // Validate all required fields
    const name = formData.get('name')?.toString().trim();
    const email = formData.get('email')?.toString().trim();
    const city = formData.get('city')?.toString().trim();
    const message = formData.get('message')?.toString().trim();
    
    // Reset field errors
    setFieldErrors({});
    
    let hasErrors = false;
    const errors: {[key: string]: boolean} = {};
    
    // Check if any field is empty
    if (!name) {
      errors.name = true;
      hasErrors = true;
    }
    if (!email) {
      errors.email = true;
      hasErrors = true;
    }
    if (!city) {
      errors.city = true;
      hasErrors = true;
    }
    if (!message) {
      errors.message = true;
      hasErrors = true;
    }
    
    if (hasErrors) {
      setFieldErrors(errors);
      setNotificationType('error');
      setNotificationMessage('Mohon lengkapi semua data yang diperlukan');
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
      }, 3000);
      return;
    }
    
    // Check minimum length for name and message
    if (name && name.length < 2) {
      setFieldErrors({name: true});
      setNotificationType('error');
      setNotificationMessage('Nama minimal 2 karakter');
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
      }, 3000);
      return;
    }
    
    if (message && message.length < 10) {
      setFieldErrors({message: true});
      setNotificationType('error');
      setNotificationMessage('Pesan minimal 10 karakter');
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
      }, 3000);
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      setFieldErrors({email: true});
      setNotificationType('error');
      setNotificationMessage('Format email tidak valid');
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
      }, 3000);
      return;
    }

    setIsSubmitting(true);

    // Show loading for 1.5 seconds then show success
    setTimeout(() => {
      // Reset form
      form.reset();
      
      // Show success notification
      setNotificationType('success');
      setNotificationMessage('Pesan terkirim ke layanan Tourjateng');
      setShowNotification(true);
      setIsSubmitting(false);
      
      // Hide notification after 3 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 3000);
    }, 1500);

    // Submit form to PageClip using traditional form submission in background
    
    // Create hidden iframe for silent submission
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.name = 'submitFrame';
    document.body.appendChild(iframe);

    // Create temporary form for submission
    const hiddenForm = document.createElement('form');
    hiddenForm.method = 'POST';
    hiddenForm.action = 'https://send.pageclip.co/YJ9ozUB19Jko6nr4W56mcSyFPPIFmtZX';
    hiddenForm.target = 'submitFrame';
    hiddenForm.className = 'pageclip-form';

    // Add all form fields
    formData.forEach((value, name) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value.toString();
      hiddenForm.appendChild(input);
    });

    document.body.appendChild(hiddenForm);
    hiddenForm.submit();

    // Clean up after 5 seconds
    setTimeout(() => {
      if (document.body.contains(hiddenForm)) {
        document.body.removeChild(hiddenForm);
      }
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 5000);
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[50vh] sm:h-[60vh] lg:h-[70vh] min-h-[400px] sm:min-h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="/images/prau.jpg" 
            alt="Pemandangan gunung dan bukit Jawa Tengah" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        
        <div className="relative z-10 flex items-end justify-start h-full">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 w-full pb-8 sm:pb-12">
            <div className="max-w-3xl">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 leading-tight">
                Tentang Kami
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-white/95 font-medium">
                Jelajahi dunia bersama TourJateng - Partner perjalanan terpercaya Anda
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-8 sm:gap-10 lg:gap-12 lg:grid-cols-2">
          {/* Left: Image */}
          <div className="order-2 lg:order-1">
            <div className="rounded-xl sm:rounded-2xl overflow-hidden">
              <img 
                src="/images/gs.png" 
                alt="Candi Borobudur dengan pemandangan gunung di latar belakang" 
                className="w-full h-[250px] sm:h-[300px] lg:h-[400px] object-cover"
              />
            </div>
          </div>
          
          {/* Right: Content */}
          <div className="order-1 lg:order-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-sky-600 mb-4 sm:mb-6 lg:mb-8">
              Siapa Kami
            </h1>
            
            <div className="space-y-4 sm:space-y-6 text-gray-700 text-sm sm:text-base lg:text-lg leading-relaxed">
              <p>
                TourJateng adalah platform perjalanan yang dirancang 
                untuk memudahkanmu dalam menemukan dan 
                merencanakan perjalanan ke berbagai destinasi wisata 
                di Jawa Tengah. Dengan informasi yang lengkap dan 
                mendalam, kami menghadirkan destinasi populer 
                maupun tempat-tempat tersembunyi yang menarik 
                untuk dieksplorasi.
              </p>
              
              <p>
                Kami berkomitmen untuk membuat setiap perjalanan 
                menjadi lebih mudah, menyenangkan, dan terorganisir. 
                Dengan TourJateng,
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sejarah Kami Section */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
          <div className="grid grid-cols-1 gap-8 sm:gap-10 lg:gap-12 lg:grid-cols-2">
            {/* Left: Content */}
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-sky-600 mb-4 sm:mb-6 lg:mb-8">
                Sejarah Kami
              </h2>
              
              <div className="space-y-4 sm:space-y-6 text-gray-700 text-sm sm:text-base lg:text-lg leading-relaxed">
                <p>
                  Didirikan pada 2025, TourJateng berawal dari keinginan 
                  untuk memudahkan wisatawan dalam menemukan 
                  pengalaman terbaik di Jawa Tengah. Dengan 
                  menggunakan teknologi terbaru, kami menawarkan 
                  sistem rekomendasi yang dipersonalisasi, memastikan 
                  bahwa setiap perjalananmu terasa lebih istimewa dan 
                  relevan.
                </p>
              </div>
            </div>
            
            {/* Right: Image */}
            <div>
              <div className="rounded-xl sm:rounded-2xl overflow-hidden shadow-lg">
                <img 
                  src="/images/ls.png" 
                  alt="Gedung bersejarah di Jawa Tengah" 
                  className="w-full h-[250px] sm:h-[300px] lg:h-[400px] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Motivasi Kami Section */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-sky-600 mb-3 sm:mb-4 px-4">
              Apa Yang Menjadi Motivasi Kami
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Visi Card */}
            <div className="border border-gray-200 rounded-lg p-4 sm:p-6 lg:p-8 hover:shadow-lg transition-shadow">
              <h3 className="text-xl sm:text-2xl font-bold text-sky-600 mb-4 sm:mb-6">Visi</h3>
              <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">
                Menjadi platform pariwisata interaktif terkemuka yang menghubungkan 
                wisatawan dengan keindahan budaya dan destinasi lokal, menciptakan 
                pengalaman perjalanan yang mudah, bermakna, dan tak terlupakan.
              </p>
              <div className="mt-6 sm:mt-8 hidden sm:block">
                <img 
                  src="/images/Turis.png" 
                  alt="Wisatawan dengan kamera" 
                  className="w-full h-auto object-cover rounded-lg"
                />
              </div>
            </div>

            {/* Misi Card */}
            <div className="border border-gray-200 rounded-lg p-4 sm:p-6 lg:p-8 hover:shadow-lg transition-shadow">
              <h3 className="text-xl sm:text-2xl font-bold text-sky-600 mb-4 sm:mb-6">Misi</h3>
              <div className="text-gray-700 text-sm sm:text-base leading-relaxed space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                <p>1. Memperkenalkan destinasi wisata lokal yang unik dan menarik kepada para wisatawan.</p>
                <p>2. Mengembangkan sistem rekomendasi berbasis preferensi pengguna untuk mempermudah perencanaan perjalanan.</p>
                <p>3. Menyediakan informasi yang akurat, lengkap, dan relevan untuk membantu wisatawan mengeksplorasi budaya dan keindahan alam Jawa Tengah.</p>
                <p>4. Membina komunitas wisatawan yang saling berbagi pengalaman, tips, dan inspirasi perjalanan.</p>
              </div>
              <div className="mt-6 sm:mt-8 hidden sm:block">
                <img 
                  src="/images/happy.png" 
                  alt="Destinasi wisata dengan pemandangan alam" 
                  className="w-full h-40 sm:h-48 object-cover rounded-lg"
                />
              </div>
            </div>

            {/* Komitmen Card */}
            <div className="border border-gray-200 rounded-lg p-4 sm:p-6 lg:p-8 hover:shadow-lg transition-shadow">
              <div className="mb-4 sm:mb-6 hidden sm:block">
                <img 
                  src="/images/learn.png" 
                  alt="LEARN - Wooden blocks" 
                  className="w-full h-24 sm:h-32 object-cover rounded-lg"
                />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-sky-600 mb-4 sm:mb-6">Komitmen</h3>
              <blockquote className="text-gray-700 text-sm sm:text-base leading-relaxed italic">
                "Kami selalu berusaha menjadi lebih baik untuk kamu. Setiap masukan, 
                saran, dan langkah yang kamu ambil bersama kami adalah motivasi 
                terbesar kami. Kami percaya, dengan berkembang bersamamu, TourJateng 
                ini akan menjadi tempat terbaik untuk menemukan inspirasi perjalanan yang 
                tak terlupakan. Terima kasih telah menjadi bagian dari perjalanan ini, 
                mari kita terus melangkah bersama!"
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* Pembuat Section */}
      <section className="relative bg-white overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-sky-50 opacity-60"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 lg:py-24">
          {/* Header */}
          <div className="text-center mb-10 sm:mb-14 lg:mb-16">
            <div className="inline-flex items-center justify-center p-2 bg-sky-100 rounded-full mb-4">
              <svg className="w-5 h-5 text-sky-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
              </svg>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent mb-4">
              Pembuat Platform
            </h2>
            <p className="text-gray-600 text-base sm:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed">
              Kenali sosok di balik TourJateng yang berdedikasi menghadirkan pengalaman terbaik dalam menjelajahi keindahan Jawa Tengah
            </p>
          </div>

          {/* Main Card */}
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              <div className="grid lg:grid-cols-2 gap-0">
                {/* Left Side - Photo */}
                <div 
                  ref={imageContainerRef}
                  className="relative group"
                  onMouseEnter={() => setIsImageHovered(true)}
                  onMouseLeave={() => setIsImageHovered(false)}
                  onMouseMove={handleMouseMove}
                >
                  <div className="relative h-72 sm:h-96 lg:h-full min-h-[500px] overflow-hidden bg-gradient-to-br from-sky-100 to-blue-50">
                    {/* Base Image */}
                    <img 
                      src="/images/adminss_anime.png"
                      alt="Pembuat TourJateng" 
                      className="w-full h-full object-contain object-center"
                    />
                    
                    {/* Overlay Image with Spotlight Effect */}
                    <div 
                      className="absolute inset-0"
                      style={{
                        clipPath: isImageHovered 
                          ? `circle(${spotlightSize}px at ${mousePos.x}% ${mousePos.y}%)` 
                          : 'circle(0px at 50% 50%)',
                        transition: isImageHovered ? 'none' : 'clip-path 0.3s ease-out'
                      }}
                    >
                      <img 
                        src="/images/adminss.png"
                        alt="Pembuat TourJateng Anime" 
                        className="w-full h-full object-contain object-center"
                      />
                    </div>
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none"></div>
                    
                    {/* Floating Badge on Photo */}
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg transform group-hover:translate-y-0 translate-y-2 transition-transform duration-300">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 transition-all duration-500">
                              {roles[currentRoleIndex].title}
                            </p>
                            <p className="text-xs text-gray-600 transition-all duration-500">
                              {roles[currentRoleIndex].subtitle}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - Content */}
                <div className="p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-sm">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                      </svg>
                      Informatic Engineering
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-500 to-yellow-700 text-white shadow-sm">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                      </svg>
                      Travel Enthusiast
                    </span>
                  </div>

                  {/* Name & Title */}
                  <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
                    Muhammad Rizal
                  </h3>
                  
                  <div className="flex items-center gap-2 mb-8">
                    <div className="h-1 w-12 bg-gradient-to-r from-sky-500 to-blue-500 rounded-full"></div>
                    <p className="text-lg sm:text-xl text-sky-600 font-semibold">
                      Founder & Lead Developer
                    </p>
                  </div>

                  {/* Description */}
                  <div className="space-y-4 mb-10">
                    <p className="text-gray-700 text-base leading-relaxed">
                      Mahasiswa Teknik Informatika yang memiliki minat kuat dalam pengembangan solusi digital untuk industri pariwisata. Berfokus pada inovasi yang mempermudah traveler dalam menemukan, mengeksplorasi, dan merencanakan perjalanan ke berbagai destinasi wisata di Jawa Tengah melalui pemanfaatan teknologi modern.
                    </p>
                    <div className="pl-4 border-l-4 border-sky-500">
                      <p className="text-gray-600 italic text-sm leading-relaxed">
                        "Melalui TourJateng, saya bertekad menghadirkan platform pariwisata yang bukan hanya informatif, tetapi juga interaktif, personal, dan benar-benar membantu setiap traveler dalam merencanakan perjalanan terbaik mereka. Saya ingin memastikan bahwa keindahan dan kekayaan budaya Jawa Tengah dapat dijelajahi dengan lebih mudah, nyaman, dan menyenangkan oleh siapa pun."
                      </p>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                      <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                      </svg>
                      Hubungi Saya
                    </h4>
                    
                    <a 
                      href="https://www.instagram.com/ahmadzal_rizal" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all duration-300 group border border-purple-100"
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-md">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 mb-0.5">Instagram</p>
                        <p className="text-sm text-purple-600 font-medium">@ahmadzal_rizal</p>
                      </div>
                      <svg className="w-5 h-5 text-purple-400 group-hover:text-purple-600 group-hover:translate-x-2 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes blob {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          
          @keyframes glitch {
            0%, 100% {
              transform: translate(0);
              opacity: 1;
            }
            10% {
              transform: translate(-5px, 0);
              opacity: 0.8;
            }
            20% {
              transform: translate(5px, 0);
              opacity: 1;
            }
            30% {
              transform: translate(-3px, 2px);
              opacity: 0.5;
            }
            40% {
              transform: translate(3px, -2px);
              opacity: 1;
            }
            50% {
              transform: translate(0);
              opacity: 0.3;
            }
            60% {
              transform: translate(-2px, 0);
              opacity: 1;
            }
            70% {
              transform: translate(2px, 1px);
              opacity: 0.7;
            }
            80% {
              transform: translate(0);
              opacity: 1;
            }
          }
          
          .glitch-effect {
            animation: glitch 0.4s infinite;
            position: relative;
          }
          
          .glitch-effect::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: white;
            opacity: 0;
            animation: flash 0.4s infinite;
            pointer-events: none;
            z-index: 1;
          }
          
          @keyframes flash {
            0%, 100% {
              opacity: 0;
            }
            10%, 30%, 50%, 70% {
              opacity: 0.3;
            }
            20%, 60% {
              opacity: 0.6;
            }
            40% {
              opacity: 0.8;
            }
          }
        `}</style>
      </section>

      {/* Hubungi Kami Section */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
          <div className="grid grid-cols-1 gap-8 sm:gap-10 lg:gap-12 items-center lg:grid-cols-2">
            {/* Left: Image */}
            <div className="order-2 lg:order-1 hidden lg:block">
              <div className="rounded-lg overflow-hidden shadow-lg">
                <img 
                  src="/images/mockuper.png" 
                  alt="Laptop menampilkan website TourJateng" 
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
            
            {/* Right: Contact Form */}
            <div className="order-1 lg:order-2">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-sky-600 mb-4 sm:mb-6">
                Hubungi Kami
              </h2>
              
              <p className="text-gray-700 text-sm sm:text-base lg:text-lg leading-relaxed mb-6 sm:mb-8">
                Kami selalu senang mendengar apapun dari kamu! Kalau kamu 
                punya pertanyaan, saran, atau butuh bantuan, jangan ragu untuk 
                menghubungi kami lewat formulir di bawah ini
              </p>

              <form
                onSubmit={handleSubmit}
                className="space-y-4 sm:space-y-6"
              >
                <div>
                  <input
                    type="text"
                    name="name"
                    placeholder="Masukkan nama"
                    required
                    disabled={isSubmitting}
                    onChange={() => clearFieldError('name')}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:border-transparent outline-none transition-colors text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      fieldErrors.name 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-sky-500'
                    }`}
                  />
                </div>
                
                <div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Masukkan email aktif"
                    required
                    disabled={isSubmitting}
                    onChange={() => clearFieldError('email')}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:border-transparent outline-none transition-colors text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      fieldErrors.email 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-sky-500'
                    }`}
                  />
                </div>
                
                <div>
                  <input
                    type="text"
                    name="city"
                    placeholder="Masukkan kota asal"
                    required
                    disabled={isSubmitting}
                    onChange={() => clearFieldError('city')}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:border-transparent outline-none transition-colors text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      fieldErrors.city 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-sky-500'
                    }`}
                  />
                </div>
                
                <div>
                  <textarea
                    rows={5}
                    name="message"
                    placeholder="Masukkan pesanmu"
                    required
                    disabled={isSubmitting}
                    onChange={() => clearFieldError('message')}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:border-transparent outline-none transition-colors resize-vertical text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      fieldErrors.message 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-sky-500'
                    }`}
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-sky-600 text-white py-2.5 sm:py-3 px-4 sm:px-6 text-sm sm:text-base rounded-lg font-semibold hover:bg-sky-700 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-colors disabled:bg-sky-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg 
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24"
                      >
                        <circle 
                          className="opacity-25" 
                          cx="12" 
                          cy="12" 
                          r="10" 
                          stroke="currentColor" 
                          strokeWidth="4"
                        ></circle>
                        <path 
                          className="opacity-75" 
                          fill="currentColor" 
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Mengirim...
                    </>
                  ) : (
                    'Kirim'
                  )}
                </button>
              </form>

              {/* Notification */}
              {showNotification && (
                <div className={`fixed top-4 right-4 left-4 sm:left-auto z-50 text-white px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg shadow-lg animate-slide-in ${
                  notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  <div className="flex items-center">
                    {notificationType === 'success' ? (
                      <svg 
                        className="w-5 h-5 mr-2" 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg 
                        className="w-5 h-5 mr-2" 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {notificationMessage}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}