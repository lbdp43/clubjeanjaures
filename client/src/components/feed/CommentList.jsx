import { useState } from 'react';
import { api } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';
import { timeAgo } from '../../utils/helpers';

export default function CommentList({ comments, postId, onNewComment, onDeleteComment }) {
  const { user, isMod } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      const comment = await api.addComment(postId, content);
      onNewComment(comment);
      setContent('');
    } catch {}
    setLoading(false);
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-50 space-y-3">
      {comments.map(c => {
        const name = c.author?.member?.companyName || c.author?.email;
        const canDelete = c.authorId === user?.id || isMod;

        return (
          <div key={c.id} className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-text-muted flex-shrink-0">
              {name?.charAt(0) || '?'}
            </div>
            <div className="flex-1">
              <div className="bg-gray-50 rounded-xl px-3 py-2">
                <p className="text-xs font-semibold">{name}</p>
                <p className="text-sm">{c.content}</p>
              </div>
              <div className="flex gap-3 mt-1">
                <span className="text-xs text-text-muted">{timeAgo(c.createdAt)}</span>
                {canDelete && (
                  <button
                    onClick={() => onDeleteComment(c.id)}
                    className="text-xs text-text-muted hover:text-red-500"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Écrire un commentaire..."
          className="input-field text-sm py-2 min-w-0"
        />
        <button type="submit" disabled={loading || !content.trim()} className="btn-primary text-sm py-2 px-3 sm:px-4 flex-shrink-0 whitespace-nowrap">
          {loading ? '...' : 'Envoyer'}
        </button>
      </form>
    </div>
  );
}
