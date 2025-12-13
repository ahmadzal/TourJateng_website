'use client'
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function ConfirmRegistrationPage() {
  const [email, setEmail] = useState('');
  const [mounted, setMounted] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const emailParam = urlParams.get('email');
      const confirmedParam = urlParams.get('confirmed');
      
      if (emailParam) {
        setEmail(decodeURIComponent(emailParam));
      }
      
      // Jika ada parameter confirmed=true, berarti user sudah klik link konfirmasi
      if (confirmedParam === 'true') {
        setIsConfirmed(true);
      }
    }
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat halaman...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-full lg:w-2/5 bg-white flex flex-col justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-md w-full mx-auto">
          <div className="flex items-center mb-6">
            <Image
              src="/images/Tourjateng.png"
              alt="TourJateng Logo"
              width={160}
              height={80}
              className="h-12 w-auto"
            />
          </div>

          <div className="text-center space-y-6">
            {isConfirmed ? (
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse">
                <svg className="w-10 h-10 text-green-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            )}

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {isConfirmed ? 'Email Terkonfirmasi!' : 'Konfirmasi Email Anda'}
            </h1>
            
            <p className="text-sm text-gray-600">
              {isConfirmed 
                ? 'Selamat! Email Anda telah berhasil dikonfirmasi dan akun sudah aktif.'
                : 'Terima kasih telah mendaftar! Kami telah mengirimkan email konfirmasi ke:'
              }
            </p>

            {email && (
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                  <span className="text-xs text-gray-500 font-medium">Email Terdaftar</span>
                </div>
                <p className="text-base font-semibold text-gray-900 break-all text-center">
                  {email}
                </p>
              </div>
            )}

            <div className="space-y-4">
              {isConfirmed ? (
                <div className="space-y-4">
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="text-sm text-green-700 font-medium">
                      ✅ Email berhasil dikonfirmasi! Akun Anda sudah aktif dan siap digunakan.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link 
                      href="/login" 
                      className="flex-1 bg-blue-600 text-white py-3 px-4 text-sm rounded-md font-medium hover:bg-blue-700 transition-colors text-center"
                    >
                      Masuk ke Akun
                    </Link>
                    <Link 
                      href="/" 
                      className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 text-sm rounded-md font-medium hover:bg-gray-200 transition-colors text-center"
                    >
                      Ke Beranda
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Silakan buka email Anda dan klik link konfirmasi untuk mengaktifkan akun.
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Jika tidak menemukan email, periksa folder spam Anda.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:block lg:w-3/5 relative overflow-hidden">
        <Image
          src="/images/photoss.jpg"
          alt="Pantai di Jawa Tengah"
          fill
          className="object-cover"
          priority
        />
        
        {/* Text Overlay - sama seperti halaman register */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/10 flex items-center justify-center p-8">
          <div className="text-center text-white max-w-xl">
            <h2 className="text-4xl xl:text-3xl font-bold mb-2 leading-tight">
              Ayo Bertualang di Jawa Tengah!
            </h2>
            <p className="text-lg xl:text-xl leading-relaxed">
              Mulai petualanganmu dan temukan tempat terbaik untuk
              liburan tak terlupakan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
