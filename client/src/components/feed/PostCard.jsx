import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';
import { timeAgo } from '../../utils/helpers';
import CommentList from './CommentList';

export default function PostCard({ post, onDelete }) {
  const { user, isMod } = useAuth();
  const [liked, setLiked] = useState(post.likes?.some(l => l.userId === user?.id));
  const [likeCount, setLikeCount] = useState(post._count?.likes || 0);
  const [comments, setComments] = useState(post.comments || []);
  const [showComments, setShowComments] = useState(false);

  const handleLike = async () => {
    try {
      const res = await api.toggleLike(post.id);
      setLiked(res.liked);
      setLikeCount(c => res.liked ? c + 1 : c - 1);
    } catch {}
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer cette publication ?')) return;
    try {
      await api.deletePost(post.id);
      onDelete?.(post.id);
    } catch {}
  };

  const handleNewComment = (comment) => {
    setComments(prev => [...prev, comment]);
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch {}
  };

  const canDelete = post.authorId === user?.id || isMod;
  const authorName = post.author?.member?.companyName || post.author?.email;
  const attachments = Array.isArray(post.attachments) ? post.attachments : [];

  return (
    <div className="card p-4 sm:p-5 slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        {post.author?.member?.photoUrl ? (
          <img src={post.author.member.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
        ) : post.author?.member?.logoUrl ? (
          <img src={post.author.member.logoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-light flex items-center justify-center text-blue font-bold">
            {authorName?.charAt(0) || '?'}
          </div>
        )}
        <div className="flex-1">
          <p className="font-semibold text-sm">{authorName}</p>
          <p className="text-xs text-text-muted">{timeAgo(post.createdAt)}</p>
        </div>
        {post.type === 'demande' && (
          <span className="badge-demande">Demande</span>
        )}
        {canDelete && (
          <button onClick={handleDelete} className="text-text-muted hover:text-red-500 text-sm">
            Supprimer
          </button>
        )}
      </div>

      {/* Content */}
      <p className="text-text-main mb-3 whitespace-pre-wrap">{post.content}</p>

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {attachments.map((url, i) => (
            url.endsWith('.pdf') ? (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-blue text-sm hover:underline">
                Document PDF
              </a>
            ) : (
              <img key={i} src={url} alt="" className="rounded-xl object-cover w-full h-40" />
            )
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 text-sm transition-colors ${liked ? 'text-blue font-semibold' : 'text-text-muted hover:text-blue'}`}
        >
          {liked ? '♥' : '♡'} {likeCount}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 text-sm text-text-muted hover:text-blue transition-colors"
        >
          💬 {comments.length}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <CommentList
          comments={comments}
          postId={post.id}
          onNewComment={handleNewComment}
          onDeleteComment={handleDeleteComment}
        />
      )}
    </div>
  );
}
