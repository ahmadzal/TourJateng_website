'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DatabaseDebugPage() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const testDatabaseConnection = async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(5)
      
      if (error) throw error
      setResults(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const checkTriggerStatus = async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase.rpc('check_trigger_status')
      if (error) throw error
      setResults(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const testUserCreation = async () => {
    setLoading(true)
    setError('')
    try {
      const testEmail = `test-${Date.now()}@example.com`
      const { data, error } = await supabase.rpc('test_user_creation', {
        test_email: testEmail,
        test_full_name: 'Debug Test User'
      })
      
      if (error) throw error
      setResults([{ test_result: data }])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const checkAuthUsers = async () => {
    setLoading(true)
    setError('')
    try {
      // This will show current authenticated user
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      setResults([user || { message: 'No authenticated user' }])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Database Debug Tools</h1>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={testDatabaseConnection}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test Database Connection
        </button>
        
        <button
          onClick={checkTriggerStatus}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          Check Trigger Status
        </button>
        
        <button
          onClick={testUserCreation}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Test User Creation
        </button>
        
        <button
          onClick={checkAuthUsers}
          disabled={loading}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
        >
          Check Auth Status
        </button>
      </div>

      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
          <p className="text-blue-600">Loading...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <p className="text-red-600 font-medium">Error:</p>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded p-4">
          <h3 className="font-medium mb-2">Results:</h3>
          <pre className="text-sm overflow-auto bg-white p-3 rounded border">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded p-4">
        <h3 className="font-medium text-yellow-800 mb-2">Debugging Steps:</h3>
        <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
          <li>Test Database Connection - Cek koneksi ke tabel users</li>
          <li>Check Trigger Status - Verifikasi trigger sudah aktif</li>
          <li>Test User Creation - Test manual insert ke tabel users</li>
          <li>Check Auth Status - Cek status autentikasi</li>
        </ol>
      </div>

      <div className="mt-4 bg-gray-50 border border-gray-200 rounded p-4">
        <h3 className="font-medium mb-2">Manual SQL Commands:</h3>
        <div className="text-sm font-mono bg-white p-3 rounded border">
          <p>-- Cek semua users:</p>
          <p>SELECT * FROM public.users;</p>
          <br />
          <p>-- Cek trigger:</p>
          <p>SELECT * FROM public.check_trigger_status();</p>
          <br />
          <p>-- Test insert:</p>
          <p>SELECT public.test_user_creation('test@example.com');</p>
        </div>
      </div>
    </div>
  )
}