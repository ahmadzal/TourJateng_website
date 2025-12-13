'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Paperclip, Plus, MessageSquare, MoreVertical, Trash2, Edit2, Star, Maximize2, Minimize2, Menu, X } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  file?: {
    name: string
    type: string
    size: number
    url?: string
  }
}

interface ChatHistory {
  id: string
  title: string
  lastMessage: string
  timestamp: Date
  isFavorite?: boolean
}

interface ChatSession {
  id: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export default function ChatbotPage() {
  const router = useRouter()
  const { user, userProfile } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [preventAutoLoad, setPreventAutoLoad] = useState(false)
  const [isNewChatActive, setIsNewChatActive] = useState(false)
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [greetingText, setGreetingText] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Array<{id: string, message: string}>>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingMessageText, setEditingMessageText] = useState('')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Generate random greeting
  const formatBotMessage = (text: string) => {
    // Replace **text** with <strong>text</strong> for bold formatting
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  }

  const generateGreeting = () => {
    const userName = userProfile?.full_name || user?.email?.split('@')[0] || 'Teman'
    
    const greetings = [
      `Halo ${userName}! Aku TourBot 👋`,
      `Hai ${userName}, salam kenal! Aku TourBot`,
      `Selamat datang, ${userName}! Aku TourBot`,
      `Hi ${userName}! TourBot siap membantu`,
      `Halo ${userName}, kenalan yuk! Aku TourBot`,
      `Hai! Aku TourBot, senang bertemu ${userName}`,
      `${userName}, halo! Aku TourBot 👋`,
      `Salam, ${userName}! TourBot di sini`,
      `Hi ${userName}, TourBot hadir untukmu!`,
      `Halo ${userName}! TourBot siap menemani`
    ]
    
    return greetings[Math.floor(Math.random() * greetings.length)]
  }

  // Load data from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {

      const savedChatHistory = localStorage.getItem('chatbot-history')
      const savedChatSessions = localStorage.getItem('chatbot-sessions')
      
      if (savedChatHistory) {
        try {
          const parsedHistory = JSON.parse(savedChatHistory).map((chat: any) => ({
            ...chat,
            timestamp: new Date(chat.timestamp)
          }))
          setChatHistory(parsedHistory)

        } catch (error) {
          console.error('Error parsing saved chat history:', error)
        }
      } else {

      }
      
      if (savedChatSessions) {
        try {
          const parsedSessions = JSON.parse(savedChatSessions).map((session: any) => ({
            ...session,
            createdAt: new Date(session.createdAt),
            updatedAt: new Date(session.updatedAt),
            messages: session.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          }))
          setChatSessions(parsedSessions)

        } catch (error) {
          console.error('Error parsing saved chat sessions:', error)
        }
      } else {

      }
      
      setDataLoaded(true)
    }
  }, [])



  // Save to localStorage whenever chatHistory or chatSessions changes
  useEffect(() => {
    if (typeof window !== 'undefined' && dataLoaded) {
      localStorage.setItem('chatbot-history', JSON.stringify(chatHistory))

    }
  }, [chatHistory, dataLoaded])

  useEffect(() => {
    if (typeof window !== 'undefined' && dataLoaded) {
      localStorage.setItem('chatbot-sessions', JSON.stringify(chatSessions))

    }
  }, [chatSessions, dataLoaded])

  // Set greeting text when user profile is loaded
  useEffect(() => {
    if (userProfile?.full_name || user?.email) {
      setGreetingText(generateGreeting())
    }
  }, [userProfile, user])

  // Always start with new chat - don't auto-load previous chat
  useEffect(() => {
    if (dataLoaded && !hasInitialLoaded) {
      // Always start with empty chat area (new chat mode)
      setMessages([])
      setCurrentChatId(null)
      setIsNewChatActive(true)
      setHasInitialLoaded(true)
      
      // Generate greeting text if not already set
      if (!greetingText && (userProfile?.full_name || user?.email)) {
        setGreetingText(generateGreeting())
      }
    }
  }, [dataLoaded, hasInitialLoaded, greetingText, userProfile, user])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }, [inputMessage])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Check authentication - redirect if not logged in
  useEffect(() => {
    if (user === null && !showAuthModal) {
      // Show auth modal instead of immediate redirect
      setShowAuthModal(true)
    }
  }, [user, showAuthModal])

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage
    if ((!textToSend.trim() && !attachedFile) || isLoading) return

    // Create file URL if there's an attached file
    let fileUrl = ''
    if (attachedFile) {
      fileUrl = URL.createObjectURL(attachedFile)
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date(),
      ...(attachedFile && {
        file: {
          name: attachedFile.name,
          type: attachedFile.type,
          size: attachedFile.size,
          url: fileUrl
        }
      })
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setAttachedFile(null)
    setPreviewImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setIsLoading(true)

    // Deactivate new chat mode when user sends first message
    if (isNewChatActive) {
      setIsNewChatActive(false)
      setPreventAutoLoad(false)
    }
    
    // Handle chat session creation/update
    let chatId = currentChatId
    
    // Add to chat history if this is the first user message or no current chat
    if (messages.length === 0 || !chatId) {
      // Set title based on content: "Foto user" if only file without text, otherwise use the text
      let title = ''
      if (!textToSend.trim() && attachedFile) {
        title = 'Foto user'
      } else if (textToSend.trim()) {
        title = textToSend.length > 40 ? textToSend.substring(0, 40) + '...' : textToSend
      }

      chatId = Date.now().toString()
      setCurrentChatId(chatId)
      
      const newChatHistory: ChatHistory = {
        id: chatId,
        title: title,
        lastMessage: textToSend || 'Foto user',
        timestamp: new Date(),
        isFavorite: false
      }
      setChatHistory(prev => [newChatHistory, ...prev])
      
      // Create new chat session
      const newChatSession: ChatSession = {
        id: chatId,
        messages: [userMessage], // Start with just the user message
        createdAt: new Date(),
        updatedAt: new Date()
      }
      setChatSessions(prev => [newChatSession, ...prev])
    } else {
      // Update existing chat session and history
      setChatSessions(prev => 
        prev.map(session => 
          session.id === chatId 
            ? { ...session, messages: [...session.messages, userMessage], updatedAt: new Date() }
            : session
        )
      )
      
      // Update the chat history title and last message
      setChatHistory(prev => {
        const updated = prev.map(chat => {
          if (chat.id === chatId) {
            // If the current title is "Foto user" and user now sends text, update the title
            if (chat.title === 'Foto user' && textToSend.trim()) {
              return {
                ...chat,
                title: textToSend.length > 40 ? textToSend.substring(0, 40) + '...' : textToSend,
                lastMessage: textToSend,
                timestamp: new Date()
              }
            } else {
              // Otherwise just update the last message and timestamp
              return {
                ...chat,
                lastMessage: textToSend || 'Foto user',
                timestamp: new Date()
              }
            }
          }
          return chat
        })
        return updated
      })
    }

    // Call Gemini API
    try {
      let imageData = null
      
      // Convert attached file to base64 if it's an image
      if (attachedFile && attachedFile.type.startsWith('image/')) {
        const reader = new FileReader()
        imageData = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(attachedFile)
        })
      }

      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textToSend,
          image: imageData,
          conversationHistory: messages // Send current conversation history
        }),
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error response:', errorText)
        throw new Error(`Gagal mendapatkan respons dari chatbot (${response.status}): ${errorText}`)
      }

      const data = await response.json()
      console.log('API response data:', data)
      
      if (data.error) {
        throw new Error(data.error)
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.reply || 'Maaf, saya tidak dapat memberikan respons saat ini.',
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => {
        const updatedMessages = [...prev, botMessage]
        
        // Update chat session with bot message
        if (chatId) {
          setChatSessions(prevSessions => 
            prevSessions.map(session => 
              session.id === chatId 
                ? { ...session, messages: updatedMessages, updatedAt: new Date() }
                : session
            )
          )
        }
        
        return updatedMessages
      })
      
      // Auto-focus on textarea after bot responds
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
      
    } catch (error) {
      console.error('Error calling chatbot API:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Maaf, terjadi kesalahan saat memproses pertanyaan Anda. Silakan coba lagi dalam beberapa saat.',
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => {
        const updatedMessages = [...prev, errorMessage]
        
        // Update chat session with error message
        if (chatId) {
          setChatSessions(prevSessions => 
            prevSessions.map(session => 
              session.id === chatId 
                ? { ...session, messages: updatedMessages, updatedAt: new Date() }
                  : session
            )
          )
        }
        
        return updatedMessages
      })
      
      // Auto-focus on textarea after error message
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const startNewChat = () => {
    console.log('Starting new chat...')
    setIsNewChatActive(true) // Mark as new chat active
    setPreventAutoLoad(true) // Prevent auto-loading during new chat creation
    
    setMessages([]) // Start with empty messages
    setInputMessage('')
    setCurrentChatId(null)
    setAttachedFile(null)
    setPreviewImage(null)
    setIsLoading(false)
    setOpenMenuId(null)
    setEditingChatId(null)
    setDeleteConfirmId(null)
    setIsMobileSidebarOpen(false) // Close mobile sidebar
    
    // Generate new greeting text
    setGreetingText(generateGreeting())
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    // Auto focus on textarea after starting new chat
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 100)
  }

  const loadChatHistory = (chatId: string) => {
    const chatSession = chatSessions.find(session => session.id === chatId)
    if (chatSession) {
      console.log('Loading chat history:', chatId)
      setIsNewChatActive(false) // Deactivate new chat mode
      setPreventAutoLoad(false) // Reset flag when manually loading chat
      setMessages(chatSession.messages)
      setCurrentChatId(chatId)
      setInputMessage('')
      setAttachedFile(null)
      setPreviewImage(null)
      setIsLoading(false)
      setOpenMenuId(null)
      setEditingChatId(null)
      setIsMobileSidebarOpen(false) // Close mobile sidebar
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      // Auto scroll to bottom and focus on textarea after loading chat
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        textareaRef.current?.focus()
      }, 100)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File terlalu besar. Maksimal 10MB')
        return
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowedTypes.includes(file.type)) {
        alert('Tipe file tidak didukung. Hanya gambar (JPG, PNG, GIF, WebP) dan dokumen (PDF, DOC, DOCX)')
        return
      }
      
      setAttachedFile(file)
      console.log('File selected:', file.name)
    }
  }

  const handleAttachmentClick = () => {
    fileInputRef.current?.click()
  }

  const removeAttachment = () => {
    setAttachedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDeleteChat = (chatId: string) => {
    setChatHistory(prev => prev.filter(chat => chat.id !== chatId))
    setChatSessions(prev => prev.filter(session => session.id !== chatId))
    setOpenMenuId(null)
    setDeleteConfirmId(null)
    // If deleting current chat, reset to new chat
    if (currentChatId === chatId) {
      startNewChat()
    }
  }

  const handleShowDeleteConfirm = (chatId: string) => {
    setDeleteConfirmId(chatId)
    setOpenMenuId(null)
  }

  const handleCancelDelete = () => {
    setDeleteConfirmId(null)
  }

  const handleStartEditTitle = (chatId: string, currentTitle: string) => {
    setEditingChatId(chatId)
    setEditingTitle(currentTitle)
    setOpenMenuId(null)
  }

  const handleSaveTitle = (chatId: string) => {
    if (editingTitle.trim()) {
      setChatHistory(prev => 
        prev.map(chat => 
          chat.id === chatId 
            ? { ...chat, title: editingTitle.trim() }
            : chat
        )
      )
    }
    setEditingChatId(null)
    setEditingTitle('')
  }

  const handleCancelEdit = () => {
    setEditingChatId(null)
    setEditingTitle('')
  }

  const handleToggleFavorite = (chatId: string) => {
    const targetChat = chatHistory.find(chat => chat.id === chatId)
    if (!targetChat) return

    // If trying to add favorite, check if limit reached
    if (!targetChat.isFavorite) {
      const currentFavoriteCount = chatHistory.filter(chat => chat.isFavorite).length
      if (currentFavoriteCount >= 3) {
        const toastId = Date.now().toString()
        const newToast = {
          id: toastId,
          message: 'Maksimal 3 chat favorit. Hapus favorit lain terlebih dahulu.'
        }
        setToasts(prev => [...prev, newToast])
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toastId))
        }, 5000)
        setOpenMenuId(null)
        return
      }
    }

    setChatHistory(prev => {
      const updated = prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, isFavorite: !chat.isFavorite, timestamp: chat.isFavorite ? chat.timestamp : new Date() }
          : chat
      )
      return updated
    })
    setOpenMenuId(null)
  }

  const handleEditMessage = (messageId: string, currentText: string) => {
    setEditingMessageId(messageId)
    setEditingMessageText(currentText)
  }

  const handleCancelEditMessage = () => {
    setEditingMessageId(null)
    setEditingMessageText('')
  }

  const handleSaveEditMessage = async () => {
    if (!editingMessageId || !editingMessageText.trim()) return

    // Find the message index
    const messageIndex = messages.findIndex(msg => msg.id === editingMessageId)
    if (messageIndex === -1) return

    // Create updated messages array with the edited message
    const updatedMessages = [...messages]
    updatedMessages[messageIndex] = {
      ...updatedMessages[messageIndex],
      text: editingMessageText.trim()
    }

    // Remove all messages after the edited message (including bot responses)
    const messagesToKeep = updatedMessages.slice(0, messageIndex + 1)
    setMessages(messagesToKeep)

    // Update chat session
    if (currentChatId) {
      setChatSessions(prev => 
        prev.map(session => 
          session.id === currentChatId 
            ? { ...session, messages: messagesToKeep, updatedAt: new Date() }
            : session
        )
      )
      
      // Update chat history
      setChatHistory(prev => 
        prev.map(chat => 
          chat.id === currentChatId
            ? { ...chat, lastMessage: editingMessageText.trim(), timestamp: new Date() }
            : chat
        )
      )
    }

    // Clear edit state
    const editedText = editingMessageText.trim()
    setEditingMessageId(null)
    setEditingMessageText('')

    // Send the edited message to get new bot response
    setIsLoading(true)
    
    try {
      console.log('=== SENDING EDITED MESSAGE ===')
      console.log('Edited text:', editedText)
      
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: editedText,
          image: null,
          conversationHistory: messagesToKeep // Send conversation history up to the edited message
        })
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (!response.ok) {
        throw new Error('Failed to get response from chatbot')
      }

      const data = await response.json()
      console.log('Response data:', data)
      
      if (data.error) {
        throw new Error(data.error)
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.reply || 'Maaf, saya tidak dapat memberikan respons saat ini.',
        sender: 'bot',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, botMessage])
      
      // Update chat session with new bot message
      if (currentChatId) {
        setChatSessions(prev => 
          prev.map(session => 
            session.id === currentChatId 
              ? { ...session, messages: [...messagesToKeep, botMessage], updatedAt: new Date() }
              : session
          )
        )
      }
      
      // Auto-focus on textarea after bot responds to edited message
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    } catch (error) {
      console.error('Error getting bot response after edit:', error)
      // Show toast notification for error
      const toastId = Date.now().toString()
      const newToast = {
        id: toastId,
        message: 'Terjadi kesalahan saat mendapatkan respons bot'
      }
      setToasts(prev => [...prev, newToast])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toastId))
      }, 5000)
    } finally {
      setIsLoading(false)
    }
  }

  // Sort chat history: favorites first (by timestamp desc), then non-favorites by timestamp desc
  const sortedChatHistory = [...chatHistory].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1
    if (!a.isFavorite && b.isFavorite) return 1
    return b.timestamp.getTime() - a.timestamp.getTime()
  })

  // Show loading screen while checking authentication
  if (!user && !showAuthModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Memeriksa autentikasi...</p>
        </div>
      </div>
    )
  }

  // Show auth modal if not logged in
  if (!user && showAuthModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white rounded-xl sm:rounded-2xl max-w-md w-full p-4 sm:p-6 md:p-8 shadow-2xl">
          <div className="text-center">
            {/* Icon */}
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-blue-100 rounded-full flex items-center justify-center mb-3 sm:mb-4 md:mb-6">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            
            {/* Title & Message */}
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
              Login Diperlukan
            </h3>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-4 sm:mb-6 md:mb-8 leading-relaxed px-2">
              Untuk menggunakan <span className="font-semibold text-blue-600">Chatbot AI TourJateng</span>, 
              Anda perlu login terlebih dahulu agar percakapan Anda dapat tersimpan.
            </p>

            {/* Buttons */}
            <div className="flex flex-col gap-2 sm:gap-3">
              <button
                onClick={() => router.push('/login?redirect=/chatbot')}
                className="w-full bg-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-xs sm:text-sm md:text-base"
              >
                Login Sekarang
              </button>
              <button
                onClick={() => router.push('/register?redirect=/chatbot')}
                className="w-full bg-white text-blue-600 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors font-medium text-xs sm:text-sm md:text-base"
              >
                Belum Punya Akun? Daftar
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full text-gray-500 hover:text-gray-700 transition-colors font-medium text-xs sm:text-sm md:text-base mt-1 sm:mt-2 py-1"
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        .chat-item {
          transition: all 0.3s ease-in-out;
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        @keyframes slide-out {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(-100%);
            opacity: 0;
          }
        }
        @keyframes slide-in {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .sidebar-enter {
          animation: slide-in 0.3s ease-out forwards;
        }
        .sidebar-exit {
          animation: slide-out 0.3s ease-out forwards;
        }
      `}</style>
      <div className="flex h-screen overflow-hidden">
        {/* Mobile Overlay */}
        {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Chat History */}
        <div className={`w-80 lg:w-80 md:w-72 ${
          isFullscreen 
            ? 'md:w-0 md:opacity-0 md:-translate-x-full' 
            : 'md:opacity-100 md:translate-x-0'
        } ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } fixed md:relative left-0 top-0 z-50 md:z-auto flex bg-gradient-to-b from-[#1e3a8a] to-[#1e40af] text-white flex-col shadow-2xl transition-all duration-300 ease-in-out overflow-hidden h-full`}
          onClick={(e) => {
            // Close menu when clicking outside
            if ((e.target as HTMLElement).closest('.chat-item-menu') === null) {
              setOpenMenuId(null)
            }
          }}
        >
          {/* Logo TourJateng di atas */}
          <div className="pt-6 px-4 pb-4 md:pt-8 md:px-6 md:pb-5 border-b border-blue-400/30">
            <div className="flex items-center justify-center">
              <img 
                src="/images/Tourjateng.png" 
                alt="TourJateng Logo" 
                className="h-12 md:h-14 w-auto object-contain"
              />
            </div>
          </div>

          {/* Sidebar Header with New Chat Button */}
          <div className="p-4 md:p-6 pb-3 md:pb-4">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-base md:text-lg font-semibold text-blue-100">Riwayat Chat</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={startNewChat}
                  className="p-2 md:p-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl transition-all hover:scale-105 shadow-lg"
                  title="Percakapan Baru"
                >
                  <Plus className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                {/* Close button for mobile */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsMobileSidebarOpen(false)
                  }}
                  className="p-2 md:hidden bg-blue-600 hover:bg-blue-700 rounded-xl transition-all hover:scale-105 shadow-lg"
                  title="Tutup Menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="h-px bg-blue-400/30"></div>
          </div>

          {/* Chat History List */}
          <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
            {chatHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center mt-16 px-4">
                <p className="text-sm text-blue-100 font-medium text-center mb-2">Belum ada riwayat</p>
                <p className="text-xs text-blue-200/70 text-center leading-relaxed">
                  Percakapan Anda dengan TourBot akan tersimpan di sini
                </p>
              </div>
            ) : (
              <div className="pb-4">
                {/* Favorite Chats Section */}
                {sortedChatHistory.some(chat => chat.isFavorite) && (
                  <div className="mb-6">
                    <div className="space-y-2">
                      {sortedChatHistory.filter(chat => chat.isFavorite).map((chat) => (
                        <div
                          key={chat.id}
                          className={`chat-item group relative p-3 rounded-xl transition-all border ${
                            currentChatId === chat.id 
                              ? 'bg-white/15 border-blue-400/50 shadow-lg' 
                              : 'bg-white/5 hover:bg-white/10 border-transparent hover:border-blue-400/30'
                          }`}
                        >
                          {editingChatId === chat.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveTitle(chat.id)
                                  } else if (e.key === 'Escape') {
                                    handleCancelEdit()
                                  }
                                }}
                                className="flex-1 bg-white/20 text-white px-2 py-1 rounded text-sm focus:outline-none focus:bg-white/30"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveTitle(chat.id)}
                                className="text-green-300 hover:text-green-100 text-xs"
                              >
                                ✓
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="text-red-300 hover:text-red-100 text-xs"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <>
                              <div 
                                onClick={() => loadChatHistory(chat.id)}
                                className="flex items-center justify-between gap-2 cursor-pointer"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {chat.isFavorite && (
                                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                                  )}
                                  <h3 className="font-medium text-sm text-white truncate">{chat.title}</h3>
                                </div>
                                <span className="text-xs text-blue-300/60 whitespace-nowrap transition-all group-hover:mr-7">
                                  {chat.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              
                              {/* Menu Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenMenuId(openMenuId === chat.id ? null : chat.id)
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded transition-opacity"
                              >
                                <MoreVertical className="w-4 h-4 text-white" />
                              </button>

                              {/* Dropdown Menu */}
                              {openMenuId === chat.id && (
                                <div className="absolute right-2 top-full mt-1 bg-white rounded-lg shadow-lg py-1 z-50 min-w-[140px]">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleToggleFavorite(chat.id)
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <Star className={`w-3 h-3 ${chat.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                    {chat.isFavorite ? 'Hapus Favorit' : 'Tambah Favorit'}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleStartEditTitle(chat.id, chat.title)
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    Ganti Nama
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleShowDeleteConfirm(chat.id)
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Hapus
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                    {/* Separator */}
                    {sortedChatHistory.some(chat => !chat.isFavorite) && (
                      <div className="my-4 h-px bg-blue-400/20"></div>
                    )}
                  </div>
                )}

                {/* Non-Favorite Chats Section */}
                {sortedChatHistory.some(chat => !chat.isFavorite) && (
                  <div className="space-y-2">
                    {sortedChatHistory.filter(chat => !chat.isFavorite).map((chat) => (
                      <div
                        key={chat.id}
                        className={`chat-item group relative p-3 rounded-xl transition-all border ${
                          currentChatId === chat.id 
                            ? 'bg-white/15 border-blue-400/50 shadow-lg' 
                            : 'bg-white/5 hover:bg-white/10 border-transparent hover:border-blue-400/30'
                        }`}
                      >
                        {editingChatId === chat.id ? (
                          <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveTitle(chat.id)
                            } else if (e.key === 'Escape') {
                              handleCancelEdit()
                            }
                          }}
                          className="flex-1 bg-white/20 text-white px-2 py-1 rounded text-sm focus:outline-none focus:bg-white/30"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveTitle(chat.id)}
                          className="text-green-300 hover:text-green-100 text-xs"
                        >
                          ✓
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-red-300 hover:text-red-100 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <div 
                          onClick={() => loadChatHistory(chat.id)}
                          className="flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {chat.isFavorite && (
                              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                            )}
                            <h3 className="font-medium text-sm text-white truncate">{chat.title}</h3>
                          </div>
                          <span className="text-xs text-blue-300/60 whitespace-nowrap transition-all group-hover:mr-7">
                            {chat.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        {/* Menu Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenuId(openMenuId === chat.id ? null : chat.id)
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded transition-opacity"
                        >
                          <MoreVertical className="w-4 h-4 text-white" />
                        </button>

                        {/* Dropdown Menu */}
                        {openMenuId === chat.id && (
                          <div className="absolute right-2 top-full mt-1 bg-white rounded-lg shadow-lg py-1 z-50 min-w-[140px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleFavorite(chat.id)
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Star className={`w-3 h-3 ${chat.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                              {chat.isFavorite ? 'Hapus Favorit' : 'Tambah Favorit'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStartEditTitle(chat.id, chat.title)
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Edit2 className="w-3 h-3" />
                              Ganti Nama
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleShowDeleteConfirm(chat.id)
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-3 h-3" />
                              Hapus
                            </button>
                          </div>
                        )}
                      </>
                    )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Kredit */}
          <div className="p-4 md:p-6 border-t border-blue-400/30 mt-auto">
            <p className="text-xs md:text-sm text-center text-blue-200/80">
              © 2025 TourJateng. Semua Hak Dilindungi
            </p>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white pt-16 md:pt-20 relative">
          {/* Mobile Hamburger Menu Button */}
          <div className="absolute top-4 left-4 z-10 md:hidden">
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all hover:scale-105 shadow-lg"
              title="Buka Menu"
            >
              {isMobileSidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Fullscreen Toggle Button - Positioned at top left of chat area, hidden on mobile */}
          <div className="absolute top-4 md:top-6 left-4 md:left-6 z-10 hidden md:block">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 md:p-3 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all hover:scale-105 shadow-lg"
              title={isFullscreen ? 'Tampilkan Sidebar' : 'Mode Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </button>
          </div>

          {/* Show greeting with input in center when no conversation */}
          {messages.length <= 1 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
              <div className="w-full max-w-2xl text-center mb-8 md:mb-16">
                <h1 className="text-lg md:text-2xl font-bold text-blue-600 mb-6 md:mb-12 px-4">
                  {greetingText}
                </h1>
                
                {/* Input Area in Center */}
                <div className="flex items-center gap-2 md:gap-3 px-2">
                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  {/* Attachment Button */}
                  <button 
                    onClick={handleAttachmentClick}
                    className="p-2 md:p-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex-shrink-0"
                    title="Lampirkan file atau gambar"
                  >
                    <Paperclip className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
                  </button>

                  {/* Input Field */}
                  <div className="flex-1 relative">
                    {/* File Preview */}
                    {attachedFile && (
                      <div className="absolute bottom-full left-0 mb-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center gap-2 text-sm">
                        <span 
                          onClick={() => {
                            if (attachedFile.type.startsWith('image/')) {
                              setPreviewImage(URL.createObjectURL(attachedFile))
                            }
                          }}
                          className={`text-blue-700 truncate max-w-xs ${
                            attachedFile.type.startsWith('image/') ? 'cursor-pointer hover:underline' : ''
                          }`}
                        >
                          📎 {attachedFile.name}
                        </span>
                        <button
                          onClick={removeAttachment}
                          className="text-blue-700 hover:text-blue-900 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <textarea
                      ref={textareaRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Tanyakan Apapun seputar wisata Jawa Tengah"
                      className="w-full px-3 md:px-5 py-2 md:py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 text-sm md:text-base text-gray-800 placeholder-gray-400 transition-colors resize-none overflow-hidden"
                      rows={1}
                      style={{ minHeight: '44px', maxHeight: '150px' }}
                    />
                  </div>

                  {/* Send Button */}
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={(!inputMessage.trim() && !attachedFile) || isLoading}
                    className="p-2 md:p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl transition-colors flex-shrink-0"
                  >
                    <Send className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="w-full max-w-4xl mx-auto">
                  {/* Show conversation messages */}
                  {messages.map((message, index) => (
                    <div key={message.id}>
                      {message.id !== '1' && (
                        <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4 md:mb-6 gap-2 md:gap-3 items-end animate-slide-up`}>
                          {/* Bot Avatar */}
                          {message.sender === 'bot' && (
                            <div className="flex-shrink-0 w-8 h-8 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-orange-500 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-200 ring-2 md:ring-4 ring-blue-100 overflow-hidden">
                              <img 
                                src="/images/robo.png" 
                                alt="TourBot Robot" 
                                className="w-6 h-6 md:w-8 md:h-8 object-contain"
                              />
                            </div>
                          )}
                          
                          {/* Message Bubble */}
                          <div
                            className={`max-w-[85%] md:max-w-xl lg:max-w-2xl group relative ${
                              message.sender === 'user'
                                ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200'
                                : 'bg-gradient-to-br from-gray-50 to-white text-gray-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 border-2 border-gray-100 hover:border-blue-200'
                            } rounded-2xl md:rounded-3xl px-4 py-3 md:px-6 md:py-4 backdrop-blur-sm`}
                          >
                            {/* Edit Button for User Messages */}
                            {message.sender === 'user' && editingMessageId !== message.id && (
                              <button
                                onClick={() => handleEditMessage(message.id, message.text)}
                                className="absolute -left-2 md:-left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 md:p-2 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition-all duration-200 transform hover:scale-110"
                                title="Edit pesan"
                              >
                                <Edit2 className="w-3 h-3 md:w-4 md:h-4 text-white" />
                              </button>
                            )}
                            {/* Decorative corner accent for bot messages */}
                            {message.sender === 'bot' && (
                              <div className="absolute -left-2 top-4 w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full opacity-30 group-hover:opacity-50 transition-opacity"></div>
                            )}
                            
                            {/* Decorative corner accent for user messages */}
                            {message.sender === 'user' && (
                              <div className="absolute -right-2 top-4 w-4 h-4 bg-blue-400 rounded-full opacity-40 group-hover:opacity-60 transition-opacity"></div>
                            )}
                            
                            {message.file && (
                              <div className="mb-2 md:mb-3">
                                {message.file.type.startsWith('image/') ? (
                                  <div 
                                    onClick={() => setPreviewImage(message.file!.url!)}
                                    className="cursor-pointer hover:opacity-90 transition-all duration-200 transform hover:scale-[1.02] rounded-xl md:rounded-2xl overflow-hidden shadow-lg"
                                  >
                                    <img 
                                      src={message.file.url} 
                                      alt={message.file.name}
                                      className="w-40 h-40 md:w-56 md:h-56 object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className={`flex items-center gap-2 text-sm rounded-xl p-3 mb-2 ${
                                    message.sender === 'user' 
                                      ? 'bg-white/20 backdrop-blur-sm' 
                                      : 'bg-blue-50 border border-blue-100'
                                  }`}>
                                    <span className="text-lg">📎</span>
                                    <span className="font-medium">{message.file.name}</span>
                                    <span className="text-xs opacity-70">
                                      ({(message.file.size / 1024).toFixed(1)} KB)
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                            {message.text && (
                              editingMessageId === message.id ? (
                                <div className="space-y-3">
                                  <textarea
                                    value={editingMessageText}
                                    onChange={(e) => setEditingMessageText(e.target.value)}
                                    className="w-full p-3 bg-white/20 text-white placeholder-white/70 rounded-xl focus:outline-none focus:bg-white/30 resize-none"
                                    rows={3}
                                    placeholder="Edit pesan Anda..."
                                    autoFocus
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={handleCancelEditMessage}
                                      className="px-3 py-1 text-sm bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                                    >
                                      Batal
                                    </button>
                                    <button
                                      onClick={handleSaveEditMessage}
                                      className="px-3 py-1 text-sm bg-white hover:bg-white/90 text-blue-600 rounded-lg transition-colors font-medium"
                                    >
                                      Simpan
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div 
                                  className={`text-sm md:text-[15px] leading-relaxed whitespace-pre-wrap break-words ${
                                    message.sender === 'user' ? 'text-white' : 'text-gray-700'
                                  }`}
                                  dangerouslySetInnerHTML={{
                                    __html: message.sender === 'bot' ? formatBotMessage(message.text) : message.text
                                  }}
                                />
                              )
                            )}
                            
                            {/* Timestamp on hover */}
                            <div className={`text-xs mt-2 opacity-0 group-hover:opacity-60 transition-opacity ${
                              message.sender === 'user' ? 'text-white text-right' : 'text-gray-500'
                            }`}>
                              {message.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          
                          {/* User Avatar */}
                          {message.sender === 'user' && (
                            <div className="flex-shrink-0 w-8 h-8 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg overflow-hidden transform hover:scale-110 transition-transform duration-200 ring-2 md:ring-4 ring-purple-100">
                              {userProfile?.avatar_url ? (
                                <img src={userProfile.avatar_url} alt="User Avatar" className="w-full h-full object-cover rounded-full" />
                              ) : (
                                <span className="text-sm md:text-lg">{userProfile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start mb-4 md:mb-6 gap-2 md:gap-3 items-end animate-slide-up">
                      {/* Bot Avatar for loading */}
                      <div className="flex-shrink-0 w-8 h-8 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-orange-500 flex items-center justify-center shadow-lg ring-2 md:ring-4 ring-blue-100 animate-pulse overflow-hidden">
                        <img 
                          src="/images/robo.png" 
                          alt="TourBot Robot" 
                          className="w-6 h-6 md:w-8 md:h-8 object-contain"
                        />
                      </div>
                      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl md:rounded-3xl px-4 py-3 md:px-6 md:py-5 shadow-lg border-2 border-gray-100">
                        <div className="flex gap-2 md:gap-2.5">
                          <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full animate-bounce shadow-sm"></div>
                          <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0.15s' }}></div>
                          <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0.3s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input Area at Bottom */}
              <div className="border-t border-gray-200 p-3 md:p-6 bg-white">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center gap-2 md:gap-3">
                    {/* Hidden File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    
                    {/* Attachment Button */}
                    <button 
                      onClick={handleAttachmentClick}
                      className="p-2 md:p-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex-shrink-0"
                      title="Lampirkan file atau gambar"
                    >
                      <Paperclip className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
                    </button>

                    {/* Input Field */}
                    <div className="flex-1 relative">
                      {/* File Preview */}
                      {attachedFile && (
                        <div className="absolute bottom-full left-0 mb-2 bg-blue-50 border border-blue-200 rounded-lg px-2 md:px-3 py-1.5 md:py-2 flex items-center gap-2 text-xs md:text-sm">
                          <span 
                            onClick={() => {
                              if (attachedFile.type.startsWith('image/')) {
                                setPreviewImage(URL.createObjectURL(attachedFile))
                              }
                            }}
                            className={`text-blue-700 truncate max-w-xs ${
                              attachedFile.type.startsWith('image/') ? 'cursor-pointer hover:underline' : ''
                            }`}
                          >
                            📎 {attachedFile.name}
                          </span>
                          <button
                            onClick={removeAttachment}
                            className="text-blue-700 hover:text-blue-900 font-bold"
                          >
                            ×
                          </button>
                        </div>
                      )}
                      <textarea
                        ref={textareaRef}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Tanyakan Apapun seputar wisata Jawa Tengah"
                        className="w-full px-3 md:px-5 py-2 md:py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 text-sm md:text-base text-gray-800 placeholder-gray-400 transition-colors resize-none overflow-hidden"
                        rows={1}
                        style={{ minHeight: '44px', maxHeight: '150px' }}
                      />
                    </div>

                    {/* Send Button */}
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={(!inputMessage.trim() && !attachedFile) || isLoading}
                      className="p-2 md:p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl transition-colors flex-shrink-0"
                    >
                      <Send className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-7xl max-h-[90vh]">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-4xl font-bold"
            >
              ×
            </button>
            <img 
              src={previewImage} 
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={handleCancelDelete}
        >
          <div 
            className="bg-white rounded-2xl p-4 md:p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-2 md:mb-3">Hapus Percakapan?</h3>
            <p className="text-xs md:text-sm lg:text-base text-gray-600 mb-3 md:mb-4 lg:mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus percakapan <span className="font-semibold text-gray-900">"{chatHistory.find(c => c.id === deleteConfirmId)?.title}"</span>?
            </p>
            <div className="flex gap-2 md:gap-3 justify-end">
              <button
                onClick={handleCancelDelete}
                className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm lg:text-base bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteChat(deleteConfirmId)}
                className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm lg:text-base bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-4 md:bottom-6 right-4 md:right-6 z-50 flex flex-col gap-2 md:gap-3 max-w-[90vw] md:max-w-sm">
        {toasts.map((toast, index) => (
          <div 
            key={toast.id} 
            className="animate-slide-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="bg-red-600 text-white px-4 md:px-6 py-3 md:py-4 rounded-xl shadow-2xl flex items-center gap-2 md:gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-xs md:text-sm font-medium">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
