// Komponen terpisah untuk komentar
// File: components/ForumComment.tsx

'use client'
import { useState } from 'react'
import { Clock, User, Heart, Reply, MoreVertical } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface Comment {
  id: string
  post_id: string
  content: string
  author: string
  author_id: string
  created_at: string
  image_url?: string
  likes_count?: number
}

interface ForumCommentProps {
  comment: Comment
  onReply?: (commentId: string) => void
  onLike?: (commentId: string) => void
  isLiked?: boolean
}

export function ForumComment({ comment, onReply, onLike, isLiked = false }: ForumCommentProps) {
  const { user } = useAuth()
  const [showOptions, setShowOptions] = useState(false)

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'baru saja'
    if (diffMins < 60) return `${diffMins} menit yang lalu`
    if (diffHours < 24) return `${diffHours} jam yang lalu`
    return `${diffDays} hari yang lalu`
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  const getAvatarColor = (authorId: string) => {
    // Generate consistent color based on user ID
    const colors = [
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-indigo-400 to-indigo-600',
      'from-red-400 to-red-600',
      'from-yellow-400 to-yellow-600',
      'from-teal-400 to-teal-600'
    ]
    const index = authorId.length % colors.length
    return colors[index]
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(comment.author_id)} flex items-center justify-center shadow-md`}>
            <span className="text-white font-semibold text-sm">
              {getInitials(comment.author)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-900">
                {comment.author}
              </span>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Clock size={14} />
                <span>{getRelativeTime(comment.created_at)}</span>
              </div>
            </div>
            
            {/* Options Menu */}
            {user && comment.author_id === user.id && (
              <div className="relative">
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <MoreVertical size={16} />
                </button>
                
                {showOptions && (
                  <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg">
                      Edit
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg">
                      Hapus
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comment Content */}
          {comment.content && (
            <p className="text-gray-700 whitespace-pre-wrap mb-3 leading-relaxed">
              {comment.content}
            </p>
          )}

          {/* Image */}
          {comment.image_url && (
            <div className="mb-3">
              <img 
                src={comment.image_url} 
                alt="Gambar komentar" 
                className="max-w-full h-auto rounded-xl border border-gray-200 cursor-pointer hover:opacity-90 transition-all duration-200 hover:shadow-lg"
                onClick={() => window.open(comment.image_url, '_blank')}
                style={{ maxHeight: '400px' }}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-2">
            {/* Like Button */}
            {user && onLike && (
              <button
                onClick={() => onLike(comment.id)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-all ${
                  isLiked
                    ? 'text-red-600 bg-red-50 hover:bg-red-100'
                    : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                <Heart 
                  size={16} 
                  className={isLiked ? 'fill-current' : ''}
                />
                {comment.likes_count && comment.likes_count > 0 && (
                  <span>{comment.likes_count}</span>
                )}
              </button>
            )}

            {/* Reply Button */}
            {user && onReply && (
              <button
                onClick={() => onReply(comment.id)}
                className="flex items-center gap-2 px-3 py-1 rounded-full text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all"
              >
                <Reply size={16} />
                <span>Balas</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}