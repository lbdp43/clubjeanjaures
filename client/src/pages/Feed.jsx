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
      <div className="text-center py-12">
        <h2 className="font-display text-xl text-blue-dark mb-2">Accès réservé aux membres</h2>
        <p className="text-text-muted">Complétez votre profil pour accéder au fil d'actualité.</p>
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
