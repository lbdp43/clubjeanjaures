import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import PostForm from '../components/feed/PostForm';
import PostCard from '../components/feed/PostCard';
import { Navigate } from 'react-router-dom';

export default function Feed() {
  const { user, isMember } = useAuth();
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isMember) return;
    setLoading(true);
    const params = { page: String(page) };
    if (filter) params.type = filter;

    api.getPosts(params)
      .then(data => {
        setPosts(data.posts);
        setTotalPages(data.pages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, filter, user, isMember]);

  if (!user) return <Navigate to="/connexion" replace />;
  if (!isMember) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-16 h-16 bg-blue-light rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
        </div>
        <h2 className="font-display text-xl text-blue-dark mb-2">Fil d'actualité</h2>
        <p className="text-text-muted mb-6">
          Le fil d'actualité est réservé aux membres du club. Complétez votre profil pour y accéder et publier.
        </p>
        <a href="/profil" className="btn-primary">Compléter mon profil</a>
      </div>
    );
  }

  const handleCreated = (post) => {
    setPosts(prev => [post, ...prev]);
  };

  const handleDelete = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 fade-in">
      <h1 className="font-display text-2xl text-blue-dark">Fil d'actualité</h1>

      <PostForm onCreated={handleCreated} />

      <div className="flex gap-2">
        {[
          { value: '', label: 'Tout' },
          { value: 'post', label: 'Publications' },
          { value: 'demande', label: 'Demandes' }
        ].map(f => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setPage(1); }}
            className={`px-4 py-2 rounded-full text-sm ${
              filter === f.value ? 'bg-blue text-white' : 'bg-white text-text-muted border border-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard key={post.id} post={post} onDelete={handleDelete} />
          ))}
          {posts.length === 0 && (
            <p className="text-text-muted text-center py-8">Aucune publication.</p>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-10 h-10 rounded-full text-sm ${
                p === page ? 'bg-blue text-white' : 'bg-white text-text-muted border border-gray-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
