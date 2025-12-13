'use client'
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Send password reset email using Supabase
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        console.error('Reset password error:', resetError);
        setError('Gagal mengirim email reset. Pastikan email sudah terdaftar.');
        setIsLoading(false);
        return;
      }

      // Show success message
      setIsSubmitted(true);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounceIn {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes drawCheck {
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }

        .animate-bounce-in {
          animation: bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }

        .animate-pulse-gentle {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>
    <div className="flex h-screen overflow-hidden">
      {/* Left Section - Form */}
      <div className="w-full lg:w-2/5 bg-white flex flex-col justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-md w-full mx-auto">
          {/* Logo */}
          <div className="flex items-center mb-6 cursor-pointer" onClick={() => router.push('/')}>
            <Image
              src="/images/Tourjateng.png"
              alt="TourJateng Logo"
              width={160}
              height={80}
              className="h-12 w-auto"
            />
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Lupa Kata Sandi?</h1>
          <p className="text-xs sm:text-sm text-gray-600 mb-5">
            Masukkan email Anda dan kami akan mengirimkan link untuk reset kata sandi
          </p>

          {!isSubmitted ? (
            /* Form */
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-black mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm text-black border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="Masukkan email Anda"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-xs">
                  {error}
                </div>
              )}

              {/* Send Reset Link Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 text-sm rounded-md font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Mengirim...' : 'Kirim Link Reset'}
              </button>

              {/* Back to Login Link */}
              <div className="text-center pt-4">
                <Link href="/login" className="text-xs text-blue-600 hover:underline font-medium">
                  ← Kembali ke halaman masuk
                </Link>
              </div>
            </form>
          ) : (
            /* Success Message */
            <div className="text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-in shadow-lg">
                <svg 
                  className="w-8 h-8 text-green-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{
                    strokeDasharray: '20',
                    strokeDashoffset: '20',
                    animation: 'drawCheck 0.8s ease-out 0.8s forwards'
                  }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 animate-fade-in" style={{animationDelay: '0.3s', opacity: '0', animationFillMode: 'forwards'}}>Email Terkirim!</h2>
              <p className="text-sm text-gray-600 animate-fade-in" style={{animationDelay: '0.6s', opacity: '0', animationFillMode: 'forwards'}}>
                Kami telah mengirimkan link reset kata sandi ke email <strong>{email}</strong>
              </p>
              <p className="text-xs text-gray-500 animate-fade-in" style={{animationDelay: '0.9s', opacity: '0', animationFillMode: 'forwards'}}>
                Periksa folder inbox atau spam Anda. Link akan kedaluwarsa dalam 24 jam.
              </p>
              
              {/* Resend and Back Links */}
              <div className="space-y-3 pt-4 animate-fade-in" style={{animationDelay: '1.2s', opacity: '0', animationFillMode: 'forwards'}}>
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setError('');
                  }}
                  className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium hover:animate-pulse-gentle transition-all duration-200"
                >
                  Kirim ulang email
                </button>
                <Link 
                  href="/login" 
                  className="block text-center text-xs text-gray-600 hover:underline hover:text-blue-600 transition-colors duration-200"
                >
                  ← Kembali ke halaman masuk
                </Link>
              </div>
            </div>
          )}

          {/* Additional Help */}
          {!isSubmitted && (
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500">
                Masih butuh bantuan?{' '}
                <a 
                  href="https://wa.me/6281227272496?text=Halo%20TourJateng%20Support%2C%20saya%20mengalami%20kendala%20terkait%0A%5BBantuan%20Reset%20Password%5D" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Hubungi dukungan
                </a>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Section - Background Image */}
      <div className="hidden lg:block lg:w-3/5 relative overflow-hidden">
        <Image
          src="/images/photoss.jpg"
          alt="Pantai di Jawa Tengah"
          fill
          className="object-cover"
          priority
        />
        
        {/* Text Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/10 flex items-center justify-center p-8">
          <div className="text-center text-white max-w-xl">
            <h2 className="text-4xl xl:text-3xl font-bold mb-2 leading-tight">
              Jangan Khawatir!
            </h2>
            <p className="text-lg xl:text-xl leading-relaxed">
              Kami akan membantu Anda mendapatkan kembali akses ke petualangan Jawa Tengah.
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}