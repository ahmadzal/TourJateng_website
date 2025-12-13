'use client'
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    // Handle the hash from password reset email
    const handlePasswordReset = async () => {
      try {
        // Check for error in URL first
        const searchParams = new URLSearchParams(window.location.search);
        const urlError = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (urlError) {
          console.error('URL Error:', urlError, errorDescription);
          setError(decodeURIComponent(errorDescription || 'Link reset password tidak valid atau sudah kedaluwarsa.'));
          setIsValidating(false);
          return;
        }

        // Get the hash from URL (e.g., #access_token=...&type=recovery)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        const hashError = hashParams.get('error');
        const hashErrorDescription = hashParams.get('error_description');

        // Check for error in hash
        if (hashError) {
          console.error('Hash Error:', hashError, hashErrorDescription);
          setError(decodeURIComponent(hashErrorDescription || 'Link reset password tidak valid atau sudah kedaluwarsa.'));
          setIsValidating(false);
          return;
        }

        if (type === 'recovery' && accessToken && refreshToken) {
          console.log('Processing recovery token...');
          // Exchange the token for a session
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            setError('Link reset password tidak valid atau sudah kedaluwarsa.');
          } else {
            console.log('Session established successfully');
          }
        } else {
          // Check if there's an existing session
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            setError('Link reset password tidak valid atau sudah kedaluwarsa.');
          }
        }
      } catch (err) {
        console.error('Error handling password reset:', err);
        setError('Terjadi kesalahan saat memproses link reset password.');
      } finally {
        setIsValidating(false);
      }
    };

    handlePasswordReset();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (password.length < 8) {
      setError('Password minimal 8 karakter');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    setIsLoading(true);

    try {
      // Update password using Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        console.error('Update password error:', updateError);
        setError('Gagal mengubah password. Silakan coba lagi.');
        setIsLoading(false);
        return;
      }

      // Show success message
      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Terjadi kesalahan. Silakan coba lagi.');
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

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }

        .animate-bounce-in {
          animation: bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
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

            {!success ? (
              <>
                {/* Title */}
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Reset Kata Sandi</h1>
                <p className="text-xs sm:text-sm text-gray-600 mb-5">
                  Masukkan kata sandi baru Anda
                </p>

                {/* Form */}
                <form className="space-y-4" onSubmit={handleSubmit}>
                  {/* Password Field */}
                  <div>
                    <label htmlFor="password" className="block text-xs font-medium text-black mb-2">
                      Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm text-black border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                        placeholder="Minimal 8 karakter"
                        required
                        disabled={isLoading}
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-xs font-medium text-black mb-2">
                      Konfirmasi Kata Sandi
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm text-black border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                        placeholder="Ulangi kata sandi baru"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-xs">
                      {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-2 px-4 text-sm rounded-md font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Mengubah Password...' : 'Ubah Password'}
                  </button>

                  {/* Back to Login Link */}
                  <div className="text-center pt-4">
                    <Link href="/login" className="text-xs text-blue-600 hover:underline font-medium">
                      ← Kembali ke halaman masuk
                    </Link>
                  </div>
                </form>
              </>
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
                <h2 className="text-xl font-bold text-gray-900">Password Berhasil Diubah!</h2>
                <p className="text-sm text-gray-600">
                  Anda akan dialihkan ke halaman login dalam beberapa detik...
                </p>
                <Link 
                  href="/login" 
                  className="inline-block text-blue-600 hover:underline text-sm font-medium"
                >
                  Atau klik di sini untuk login sekarang
                </Link>
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
                Buat Password Baru
              </h2>
              <p className="text-base xl:text-lg opacity-90 leading-relaxed">
                Kami akan membantu Anda mendapatkan kembali akses ke petualangan Jawa Tengah.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
