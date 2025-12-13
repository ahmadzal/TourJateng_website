'use client'
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from "lucide-react";
import { signIn, signInWithGoogle } from '@/lib/supabase';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useClientRedirect } from '@/hooks/useClientRedirect';

function LoginContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const router = useRouter();
  const { redirect, getOrigin } = useClientRedirect();

  // Typing animation function
  const typeText = (text: string, setter: (value: string) => void, delay: number = 100) => {
    return new Promise<void>((resolve) => {
      let index = 0;
      setter(''); // Clear the field first
      
      const typeInterval = setInterval(() => {
        if (index < text.length) {
          setter(text.substring(0, index + 1));
          index++;
        } else {
          clearInterval(typeInterval);
          resolve();
        }
      }, delay);
    });
  };

  // Load saved credentials on component mount with typing animation
  useEffect(() => {
    const savedCredentials = localStorage.getItem('rememberedCredentials');
    if (savedCredentials) {
      try {
        const { email: savedEmail, password: savedPassword } = JSON.parse(savedCredentials);
        
        if (savedEmail || savedPassword) {
          setRememberMe(true);
          setIsTyping(true);
          
          // Animate typing after a short delay
          setTimeout(async () => {
            if (savedEmail) {
              await typeText(savedEmail, setEmail, 80);
            }
            
            // Small delay between email and password typing
            if (savedPassword) {
              setTimeout(async () => {
                await typeText(savedPassword, setPassword, 60);
                setIsTyping(false); // Animation complete
              }, 300);
            } else {
              setIsTyping(false);
            }
          }, 500);
        }
      } catch (error) {
        console.error('Failed to load saved credentials:', error);
        localStorage.removeItem('rememberedCredentials');
      }
    }
  }, []);

  const handleGoogleLogin = async () => {
    console.log('=== GOOGLE LOGIN BUTTON CLICKED ===');
    
    setLoading(true);
    setError('');
    
    try {
      console.log('🚀 Starting Google OAuth process...');
      
      const { data, error: googleError } = await signInWithGoogle();
      
      if (googleError) {
        console.error('❌ GOOGLE LOGIN ERROR:', googleError);
        setError('Gagal masuk dengan Google. Silakan coba lagi.');
        setLoading(false);
        return;
      }

      console.log('✅ Google OAuth initiated successfully');
      // Browser will redirect to Google, so no need to set loading to false
    } catch (err: any) {
      console.error('💥 UNEXPECTED ERROR DURING GOOGLE LOGIN:', err);
      setError(err?.message || 'Terjadi kesalahan saat masuk dengan Google');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Mohon masukkan email dan password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await signIn(email, password);
      
      if (signInError) {
        // @ts-ignore
        setError(signInError.message || 'Terjadi kesalahan saat login');
        return;
      }

      if (data?.user) {
        console.log('✅ Login successful!', data.user.email);
        setSuccess(true);
        setError('');
        
        // Handle remember me functionality
        if (rememberMe) {
          // Save credentials to localStorage
          localStorage.setItem('rememberedCredentials', JSON.stringify({
            email,
            password
          }));
        } else {
          // Remove saved credentials if remember me is unchecked
          localStorage.removeItem('rememberedCredentials');
        }
        
        // Show success message briefly then redirect
        redirect('/', 1500);
      }
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan yang tidak terduga');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Hallo,</h1>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Selamat Datang</h1>
          <p className="text-xs sm:text-sm text-gray-600 mb-5">Senang bisa menyambutmu kembali di sini!</p>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-green-600">Login berhasil! Mengalihkan...</p>
              </div>
            </div>
          )}

          {/* Form */}
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
                required
                disabled={isTyping}
                className={`w-full px-3 py-2.5 text-sm text-black border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                  isTyping ? 'cursor-text animate-pulse bg-blue-50' : ''
                }`}
                placeholder=""
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-black mb-2">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isTyping}
                  className={`w-full px-3 py-2.5 text-sm text-black border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-9 transition-colors ${
                    isTyping ? 'cursor-text animate-pulse bg-blue-50' : ''
                  }`}
                  placeholder=""
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setRememberMe(isChecked);
                    
                    // If unchecked, immediately remove saved credentials
                    if (!isChecked) {
                      localStorage.removeItem('rememberedCredentials');
                    }
                  }}
                  className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="remember" className="text-xs text-black">
                  Ingat saya
                </label>
              </div>
              <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">
                Lupa kata sandi?
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading || !email || !password || isTyping}
              className="w-full bg-blue-600 text-white py-2 px-4 text-sm rounded-md font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-4"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Masuk...
                </div>
              ) : (
                'Masuk'
              )}
            </button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-500">atau lanjutkan dengan</span>
              </div>
            </div>

            {/* Google Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 border border-gray-300 py-2 px-4 text-sm rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-gray-700 font-medium">
                {loading ? 'Memuat...' : 'Google'}
              </span>
            </button>

            {/* Register Link */}
            <p className="text-center text-xs text-gray-600 pt-3">
              Belum Punya Akun?{' '}
              <Link href="/register" className="text-blue-600 hover:underline font-medium">
                Daftar
              </Link>
            </p>
          </form>
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
              Ayo Bertualang di Jawa Tengah!
            </h2>
            <p className="text-lg xl:text-xl leading-relaxed">
              Mulai petualanganmu dan temukan tempat terbaik untuk liburan tak terlupakan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <ProtectedRoute requireAuth={false}>
      <LoginContent />
    </ProtectedRoute>
  )
}