import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types untuk database
export interface User {
  id: string
  email: string
  full_name: string
  created_at: string
  updated_at: string
}

// Auth helper functions
export const signUp = async (email: string, password: string, fullName: string) => {
  console.log('🔵 === SUPABASE SIGNUP FUNCTION START ===');
  console.log('📧 Email:', email);
  console.log('👤 Full name:', fullName);
  console.log('🔑 Password length:', password.length);
  console.log('🌐 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('🔐 Anon key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  try {
    console.log('📡 Calling supabase.auth.signUp...');
    const signUpPayload = {
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    };
    console.log('📦 SignUp payload:', { ...signUpPayload, password: '***' });
    
    const startTime = Date.now();
    const { data, error } = await supabase.auth.signUp(signUpPayload);
    const endTime = Date.now();
    
    console.log(`⏱️ Supabase signUp call completed in ${endTime - startTime}ms`);
    
    if (error) {
      console.error('❌ SUPABASE AUTH SIGNUP ERROR:');
      console.error('Error code:', error.status);
      console.error('Error message:', error.message);
      console.error('Full error object:', error);
      console.error('Error JSON:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    console.log('✅ Supabase signup successful!');
    console.log('📊 Response data summary:');
    console.log('- User exists:', !!data.user);
    console.log('- Session exists:', !!data.session);
    
    if (data.user) {
      console.log('👤 User details:');
      console.log('- ID:', data.user.id);
      console.log('- Email:', data.user.email);
      console.log('- Created at:', data.user.created_at);
      console.log('- Email confirmed:', data.user.email_confirmed_at);
      console.log('- User metadata:', data.user.user_metadata);
      
      // Check profile creation immediately
      console.log('🔍 Checking immediate profile creation...');
      try {
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (profileError) {
          console.error('❌ Immediate profile check failed:', profileError);
          console.error('Profile error details:', JSON.stringify(profileError, null, 2));
          
          // Check if table exists
          console.log('🔍 Checking if users table exists...');
          const { data: tableCheck, error: tableError } = await supabase
            .from('users')
            .select('count')
            .limit(1);
            
          if (tableError) {
            console.error('❌ Users table check failed:', tableError);
          } else {
            console.log('✅ Users table exists and accessible');
          }
          
        } else {
          console.log('✅ Profile created immediately:', userProfile);
        }
      } catch (checkError) {
        console.error('❌ Error during immediate profile check:', checkError);
      }
      
      // Also schedule a delayed check
      setTimeout(async () => {
        console.log('🕐 Delayed profile check (3 seconds later)...');
        try {
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user!.id)
            .single();
          
          if (profileError) {
            console.error('❌ Delayed profile check failed:', profileError);
            console.error('This indicates the database trigger might not be working');
          } else {
            console.log('✅ Profile found in delayed check:', userProfile);
          }
        } catch (delayedCheckError) {
          console.error('❌ Error in delayed profile check:', delayedCheckError);
        }
      }, 3000);
    }
    
    console.log('🔵 === SUPABASE SIGNUP FUNCTION SUCCESS ===');
    return { data, error: null };
    
  } catch (error: any) {
    console.error('💥 SIGNUP FUNCTION EXCEPTION:');
    console.error('Exception type:', typeof error);
    console.error('Exception message:', error?.message);
    console.error('Exception stack:', error?.stack);
    console.error('Full exception:', error);
    
    // Check if it's a network error
    if (error?.message?.includes('fetch')) {
      console.error('🌐 This appears to be a network error');
    }
    
    // Check if it's a Supabase API error
    if (error?.status) {
      console.error('📡 This appears to be a Supabase API error with status:', error.status);
    }
    
    console.log('🔵 === SUPABASE SIGNUP FUNCTION ERROR ===');
    return { data: null, error };
  }
}

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return { user, error: null }
  } catch (error) {
    return { user: null, error }
  }
}

export const signInWithGoogle = async () => {
  console.log('🔵 === GOOGLE OAUTH SIGNIN START ===');
  
  try {
    console.log('📡 Calling supabase.auth.signInWithOAuth for Google...');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('❌ GOOGLE OAUTH ERROR:');
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      throw error;
    }

    console.log('✅ Google OAuth redirect initiated');
    console.log('📊 Response data:', data);
    console.log('🔵 === GOOGLE OAUTH SIGNIN SUCCESS ===');
    
    return { data, error: null };
  } catch (error: any) {
    console.error('💥 GOOGLE OAUTH EXCEPTION:');
    console.error('Exception message:', error?.message);
    console.error('Full exception:', error);
    console.log('🔵 === GOOGLE OAUTH SIGNIN ERROR ===');
    
    return { data: null, error };
  }
}
