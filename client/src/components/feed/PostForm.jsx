import { useState, useRef } from 'react';
import { api } from '../../utils/api';

export default function PostForm({ onCreated }) {
  const [content, setContent] = useState('');
  const [type, setType] = useState('post');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('type', type);
      files.forEach(f => formData.append('attachments', f));

      const post = await api.createPost(formData);
      onCreated?.(post);
      setContent('');
      setFiles([]);
      setType('post');
    } catch {}
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-3">
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => setType('post')}
          className={`px-4 py-1.5 rounded-full text-sm ${
            type === 'post' ? 'bg-blue text-white' : 'bg-gray-100 text-text-muted'
          }`}
        >
          Publication
        </button>
        <button
          type="button"
          onClick={() => setType('demande')}
          className={`px-4 py-1.5 rounded-full text-sm ${
            type === 'demande' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-text-muted'
          }`}
        >
          Demande
        </button>
      </div>

      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={type === 'demande' ? 'Décrivez votre besoin...' : 'Quoi de neuf ?'}
        className="input-field resize-none"
        rows={3}
      />

      {files.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {files.map((f, i) => (
            <div key={i} className="bg-gray-100 rounded-lg px-3 py-1 text-sm flex items-center gap-2">
              {f.name}
              <button type="button" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-red-400">
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="text-sm text-text-muted hover:text-blue"
        >
          + Pièce jointe
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files)])}
          className="hidden"
        />
        <button type="submit" disabled={loading || !content.trim()} className="btn-primary text-sm py-2 px-6">
          {loading ? 'Publication...' : 'Publier'}
        </button>
      </div>
    </form>
  );
}
