'use client'
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from "lucide-react";
import { signUp, signInWithGoogle } from '@/lib/supabase';
import ProtectedRoute from '@/components/ProtectedRoute';

function RegisterContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for OAuth errors in URL
  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) {
      console.error('❌ OAuth error from URL:', urlError);
      setError(decodeURIComponent(urlError));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Console logging untuk form validation
    console.log('=== FORM SUBMIT START ===');
    console.log('Form data:', { fullName, email, password: '***', agreed });
    
    if (!fullName || !email || !password || !agreed) {
      console.error('❌ Form validation failed - missing fields');
      setError('Mohon lengkapi semua field dan setujui persyaratan');
      return;
    }

    if (password.length < 6) {
      console.error('❌ Password validation failed - too short');
      setError('Password minimal 6 karakter');
      return;
    }

    console.log('✅ Form validation passed');
    setLoading(true);
    setError('');

    try {
      console.log('🚀 Starting registration process for:', email);
      console.log('📝 User data:', { fullName, email });
      
      const startTime = Date.now();
      const { data, error: signUpError } = await signUp(email, password, fullName);
      const endTime = Date.now();
      
      console.log(`⏱️ SignUp function completed in ${endTime - startTime}ms`);
      console.log('📊 SignUp result:', { data: data ? 'received' : 'null', error: signUpError ? 'yes' : 'no' });
      
      if (signUpError) {
        console.error('❌ REGISTRATION ERROR DETAILS:');
        console.error('Error object:', signUpError);
        console.error('Error message:', signUpError.message);
        console.error('Error code:', signUpError.status);
        console.error('Full error:', JSON.stringify(signUpError, null, 2));
        
        // Handle specific errors
        let errorMessage = 'Terjadi kesalahan saat registrasi';
        
        if (signUpError.message?.includes('User already registered')) {
          errorMessage = 'Email sudah terdaftar, silakan gunakan email lain atau login';
          console.log('🔄 Error type: User already exists');
        } else if (signUpError.message?.includes('Password should be at least 6 characters')) {
          errorMessage = 'Password minimal 6 karakter';
          console.log('🔄 Error type: Password too short');
        } else if (signUpError.message?.includes('Invalid email')) {
          errorMessage = 'Format email tidak valid';
          console.log('🔄 Error type: Invalid email format');
        } else if (signUpError.message?.includes('Database error')) {
          errorMessage = 'Kesalahan database: ' + signUpError.message;
          console.log('🔄 Error type: Database error');
        } else if (signUpError.message) {
          errorMessage = signUpError.message;
          console.log('🔄 Error type: Other -', signUpError.message);
        }
        
        console.error('💬 User-facing error message:', errorMessage);
        setError(errorMessage);
        return;
      }

      if (data?.user) {
        console.log('✅ USER CREATED SUCCESSFULLY!');
        console.log('👤 User details:', {
          id: data.user.id,
          email: data.user.email,
          created_at: data.user.created_at,
          email_confirmed_at: data.user.email_confirmed_at,
          user_metadata: data.user.user_metadata
        });
        
        // Wait for profile creation and check
        console.log('⏳ Waiting 3 seconds for database trigger to complete...');
        setTimeout(async () => {
          try {
            console.log('🔍 Checking if user profile was created...');
            const { supabase } = await import('@/lib/supabase');
            const { data: userProfile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', data.user!.id)
              .single();
            
            if (profileError) {
              console.error('❌ Profile check failed:', profileError);
              console.error('Database might have issues creating user profile');
            } else {
              console.log('✅ User profile found in database:', userProfile);
            }
          } catch (checkError) {
            console.error('❌ Error during profile check:', checkError);
          }
        }, 3000);
        
        console.log('🔄 Redirecting to confirmation page...');
        router.push(`/confirm-registration?email=${encodeURIComponent(email)}`);
      } else {
        console.error('❌ No user data received despite no error');
        console.log('Data received:', data);
        setError('Registrasi gagal, silakan coba lagi');
      }
    } catch (err: any) {
      console.error('💥 UNEXPECTED ERROR DURING REGISTRATION:');
      console.error('Error type:', typeof err);
      console.error('Error constructor:', err.constructor.name);
      console.error('Error message:', err?.message);
      console.error('Error stack:', err?.stack);
      console.error('Full error object:', err);
      
      setError(err?.message || 'Terjadi kesalahan yang tidak terduga');
    } finally {
      setLoading(false);
      console.log('=== FORM SUBMIT END ===');
    }
  };

  const handleGoogleSignIn = async () => {
    console.log('=== GOOGLE SIGNIN BUTTON CLICKED ===');
    
    setGoogleLoading(true);
    setError('');

    try {
      console.log('🚀 Starting Google OAuth process...');
      
      const { data, error: googleError } = await signInWithGoogle();
      
      if (googleError) {
        console.error('❌ GOOGLE SIGNIN ERROR:', googleError);
        setError('Gagal masuk dengan Google. Silakan coba lagi.');
        setGoogleLoading(false);
        return;
      }

      console.log('✅ Google OAuth initiated successfully');
      // Browser will redirect to Google, so no need to set loading to false
    } catch (err: any) {
      console.error('💥 UNEXPECTED ERROR DURING GOOGLE SIGNIN:', err);
      setError(err?.message || 'Terjadi kesalahan saat masuk dengan Google');
      setGoogleLoading(false);
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Buat Akun</h1>
          <p className="text-xs sm:text-sm text-gray-600 mb-5">Bergabunglah dan mulai menjelajahi Jawa Tengah</p>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Form */}
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="fullName" className="block text-xs font-medium text-black mb-1">
                Nama Lengkap
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder=""
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-black mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder=""
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-black mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-9 transition-colors"
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

            {/* Agreement Checkbox */}
            <div className="flex items-start space-x-2 py-1">
              <input
                type="checkbox"
                id="agreement"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
              />
              <label htmlFor="agreement" className="text-xs text-black leading-tight">
                Saya setuju dengan{' '}
                <Link href="/terms" className="text-blue-600 hover:underline">
                  Persyaratan Layanan
                </Link>
                {' '}dan{' '}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  Kebijakan Privasi
                </Link>
              </label>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={!agreed || loading || !fullName || !email || !password}
              className="w-full bg-blue-600 text-white py-2 px-4 text-sm rounded-md font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-3"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Mendaftar...
                </div>
              ) : (
                'Daftar'
              )}
            </button>

            {/* Divider */}
            <div className="relative my-3">
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
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center space-x-2 border border-gray-300 py-2 px-4 text-sm rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-700 font-medium">Menghubungkan...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-gray-700 font-medium">Google</span>
                </>
              )}
            </button>

            {/* Login Link */}
            <p className="text-center text-xs text-gray-600 pt-2">
              Sudah Punya Akun?{' '}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                Masuk
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
              Mulai petualanganmu dan temukan tempat terbaik untuk
              liburan tak terlupakan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <ProtectedRoute requireAuth={false}>
      <RegisterContent />
    </ProtectedRoute>
  )
}