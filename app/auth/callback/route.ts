import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: Request) {
  console.log('🔵 === AUTH CALLBACK ROUTE START ===');
  
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  console.log('📊 Callback parameters:', {
    hasCode: !!code,
    hasTokenHash: !!token_hash,
    type,
    next,
    error,
    error_description,
  });

  if (error) {
    console.error('❌ OAuth error received:', error, error_description);
    const redirectPath = next || '/register';
    return NextResponse.redirect(`${requestUrl.origin}${redirectPath}?error=${encodeURIComponent(error_description || error)}`)
  }

  // Handle password recovery/email confirmation via token_hash
  if (token_hash && type) {
    console.log(`🔄 Handling ${type} with token_hash...`);
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as any,
      })

      if (verifyError) {
        console.error('❌ Error verifying token:', verifyError);
        const redirectPath = next || '/login';
        return NextResponse.redirect(`${requestUrl.origin}${redirectPath}?error=${encodeURIComponent(verifyError.message)}`)
      }

      console.log('✅ Token verified successfully');
      const redirectPath = next || '/';
      return NextResponse.redirect(`${requestUrl.origin}${redirectPath}`)
    } catch (error: any) {
      console.error('💥 Exception verifying token:', error);
      const redirectPath = next || '/login';
      return NextResponse.redirect(`${requestUrl.origin}${redirectPath}?error=${encodeURIComponent(error.message)}`)
    }
  }

  if (code) {
    console.log('✅ Authorization code received');
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    try {
      console.log('🔄 Exchanging code for session...');
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('❌ Error exchanging code for session:', exchangeError);
        return NextResponse.redirect(`${requestUrl.origin}/register?error=${encodeURIComponent(exchangeError.message)}`)
      }

      console.log('✅ Session established successfully');
      console.log('👤 User details:', {
        id: data.user?.id,
        email: data.user?.email,
        full_name: data.user?.user_metadata?.full_name,
      });

      // Check if user profile exists, if not create one
      if (data.user) {
        console.log('🔍 Checking if user profile exists in users table...');
        
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileCheckError && profileCheckError.code !== 'PGRST116') {
          console.error('❌ Error checking user profile:', profileCheckError);
        }

        if (!existingProfile) {
          console.log('📝 Creating user profile...');
          
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email!,
              full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error('❌ Error creating user profile:', insertError);
          } else {
            console.log('✅ User profile created successfully');
          }
        } else {
          console.log('✅ User profile already exists');
        }
      }

      console.log('🔄 Redirecting to home page...');
      console.log('🔵 === AUTH CALLBACK ROUTE SUCCESS ===');
      
      // Redirect to home page after successful authentication
      return NextResponse.redirect(`${requestUrl.origin}/`)
    } catch (error: any) {
      console.error('💥 Exception in auth callback:', error);
      console.log('🔵 === AUTH CALLBACK ROUTE ERROR ===');
      return NextResponse.redirect(`${requestUrl.origin}/register?error=${encodeURIComponent(error.message || 'Authentication failed')}`)
    }
  }

  console.log('⚠️ No code or error received, redirecting to register');
  console.log('🔵 === AUTH CALLBACK ROUTE END ===');
  
  // If no code or error, redirect to register
  return NextResponse.redirect(`${requestUrl.origin}/register`)
}
