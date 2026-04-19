import { useState, useEffect } from 'react';
import { MessageSquare, Send, User, Clock, Loader2 } from 'lucide-react';
import { fetchComments, postComment } from '../api';

export default function CommentsSection({ mediaType, mediaId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [content, setContent] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchComments(mediaType, mediaId)
      .then(res => {
        if (!cancelled) setComments(res.data);
      })
      .catch(err => console.error('Failed to load comments:', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [mediaType, mediaId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitLoading(true);
    try {
      const res = await postComment(mediaType, mediaId, content.trim());
      // Optimistic upate
      setComments(prev => [res.data, ...prev]);
      setContent('');
    } catch (err) {
      console.error('Failed to post comment:', err);
      alert('Failed to post comment. Please try again later.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const timeAgo = (dateStr) => {
    const d = new Date(dateStr);
    const seconds = Math.floor((new Date() - d) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <section className="mt-16 pt-8 border-t border-white/10 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-8">
        <MessageSquare className="text-prime-blue w-6 h-6" />
        <h2 className="text-2xl font-bold font-display tracking-tight text-white">
          Discussions
        </h2>
        <span className="text-sm font-semibold bg-white/10 text-white/70 px-3 py-1 rounded-full">
          {comments.length}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="mb-10 relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts anonymously..."
          disabled={submitLoading}
          maxLength={1000}
          className="w-full bg-[#1A222C]/70 border border-white/5 rounded-xl px-4 py-4 text-white placeholder-white/30 focus:outline-none focus:border-prime-blue/50 focus:bg-[#1A222C] transition-all min-h-[100px] resize-y shadow-inner"
        />
        <div className="flex justify-between items-center mt-3">
          <p className="text-xs text-white/40 font-medium">Posting anonymously. No account required.</p>
          <button
            type="submit"
            disabled={!content.trim() || submitLoading}
            className="btn-primary text-sm px-6 py-2.5 rounded-lg ml-auto disabled:opacity-50 disabled:hover:scale-100"
          >
            {submitLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send size={16} className="mr-1.5" /> Post
              </>
            )}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-prime-blue/50" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5">
            <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60 font-medium">No comments yet.</p>
            <p className="text-white/40 text-sm mt-1">Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment._id}
              className="p-5 bg-[#141C24]/80 backdrop-blur rounded-2xl border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-prime-blue/20 flex items-center justify-center text-prime-blue">
                  <User size={14} fill="currentColor" />
                </div>
                <div>
                  <h4 className="font-bold text-[15px] text-white leading-none">
                    {comment.author}
                  </h4>
                  <div className="flex items-center text-xs text-white/40 mt-1 font-medium gap-1">
                    <Clock size={10} />
                    {timeAgo(comment.createdAt)}
                  </div>
                </div>
              </div>
              <p className="text-white/80 text-[15px] leading-relaxed whitespace-pre-wrap pl-11">
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
