'use client'
import { useState, useEffect } from 'react'

export default function ConsoleMonitor() {
  const [logs, setLogs] = useState<string[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Override console methods to capture logs
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn

    console.log = (...args) => {
      originalLog(...args)
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')
      setLogs(prev => [...prev.slice(-49), `[LOG] ${new Date().toLocaleTimeString()}: ${message}`])
    }

    console.error = (...args) => {
      originalError(...args)
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')
      setLogs(prev => [...prev.slice(-49), `[ERROR] ${new Date().toLocaleTimeString()}: ${message}`])
    }

    console.warn = (...args) => {
      originalWarn(...args)
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')
      setLogs(prev => [...prev.slice(-49), `[WARN] ${new Date().toLocaleTimeString()}: ${message}`])
    }

    // Cleanup on unmount
    return () => {
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    }
  }, [])

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white px-3 py-2 rounded text-sm z-50"
      >
        Show Console
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-64 bg-black text-green-400 text-xs font-mono overflow-auto border border-gray-600 z-50">
      <div className="flex justify-between items-center bg-gray-800 px-2 py-1">
        <span>Console Monitor</span>
        <div>
          <button 
            onClick={() => setLogs([])}
            className="text-yellow-400 hover:text-yellow-200 mr-2"
          >
            Clear
          </button>
          <button 
            onClick={() => setIsVisible(false)}
            className="text-red-400 hover:text-red-200"
          >
            Hide
          </button>
        </div>
      </div>
      <div className="p-2 space-y-1">
        {logs.map((log, index) => (
          <div 
            key={index} 
            className={`text-xs ${
              log.includes('[ERROR]') ? 'text-red-400' : 
              log.includes('[WARN]') ? 'text-yellow-400' : 
              'text-green-400'
            }`}
          >
            {log}
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-gray-500">No console output yet...</div>
        )}
      </div>
    </div>
  )
}