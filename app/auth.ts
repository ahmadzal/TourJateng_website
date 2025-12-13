'use server'

import { supabase } from '@/lib/supabase'

export async function registerUser(prevState: any, formData: FormData) {
  if (!formData || typeof formData.get !== 'function') {
    return { success: false, message: 'Invalid form data' }
  }

  const email = formData.get('email')
  const password = formData.get('password')
  const firstName = formData.get('firstName')
  const lastName = formData.get('lastName')

  if (!email || !password || !firstName || !lastName) {
    return { success: false, message: 'Missing required fields' }
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.toString(),
      password: password.toString(),
      options: {
        data: {
          first_name: firstName.toString(),
          last_name: lastName.toString(),
        },
      },
    })

    if (error) throw error

    return { success: true, message: 'Registration successful! Please check your email to verify your account.' }
  } catch (error) {
    console.error('Registration error:', error)
    return { success: false, message: 'Registration failed. Please try again.' }
  }
}
