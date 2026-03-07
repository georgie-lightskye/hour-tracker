"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { subscribeToComments, addComment } from "@/lib/firestore";
import type { Comment } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/utils";
import { FiSend, FiMessageCircle } from "react-icons/fi";

interface CommentSectionProps {
  entryId: string;
}

export default function CommentSection({ entryId }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const unsub = subscribeToComments(entryId, setComments);
    return () => unsub();
  }, [entryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;
    setSending(true);
    await addComment(entryId, {
      userId: user.uid,
      userName: user.displayName || user.email,
      text: text.trim(),
    });
    setText("");
    setSending(false);
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
        <FiMessageCircle className="w-4 h-4 text-accent" />
        Comments
        {comments.length > 0 && (
          <span className="text-xs text-text-tertiary">({comments.length})</span>
        )}
      </h3>

      {/* Comments list */}
      {comments.length === 0 ? (
        <p className="text-sm text-text-tertiary mb-4">No comments yet.</p>
      ) : (
        <div className="space-y-4 mb-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-surface-elevated border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-text-secondary uppercase">
                  {comment.userName.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-sm font-medium text-text-primary">
                    {comment.userName}
                  </span>
                  <span className="text-[10px] text-text-tertiary font-mono">
                    {formatDate(comment.createdAt)} {formatTime(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {comment.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 bg-bg-base border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent transition-all"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="bg-accent hover:bg-accent/90 text-bg-base px-4 py-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FiSend className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
