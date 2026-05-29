import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Reply, Trash2, Send, User, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Comment {
  id: string;
  user_id: string;
  anime_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  profile?: { username: string | null; avatar_url: string | null };
  replies?: Comment[];
}

interface CommentSectionProps {
  animeId: string;
}

const CommentSection = ({ animeId }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("anime_id", animeId)
        .order("created_at", { ascending: false });

      if (error) { setLoading(false); return; }

      // Fetch profiles for all unique user_ids
      const userIds = [...new Set((data || []).map((c: any) => c.user_id))];
      let profileMap = new Map();
      
      if (userIds.length > 0) {
        try {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, username, avatar_url")
            .in("id", userIds);
          profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
        } catch {
          // DB unavailable for profiles - continue with anonymous
        }
      }

      const enriched = (data || []).map((c: any) => ({
        ...c,
        profile: profileMap.get(c.user_id) || { username: null, avatar_url: null },
      }));

      // Build tree
      const topLevel: Comment[] = [];
      const childMap = new Map<string, Comment[]>();
      enriched.forEach((c: Comment) => {
        if (c.parent_id) {
          if (!childMap.has(c.parent_id)) childMap.set(c.parent_id, []);
          childMap.get(c.parent_id)!.push(c);
        } else {
          topLevel.push(c);
        }
      });
      topLevel.forEach((c) => { c.replies = childMap.get(c.id) || []; });

      setComments(topLevel);
    } catch {
      // Database unavailable - show empty state
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [animeId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`comments-${animeId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "comments", filter: `anime_id=eq.${animeId}` }, () => {
        fetchComments();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [animeId, fetchComments]);

  const handlePost = async (parentId?: string) => {
    if (!userId) { toast.error("Please log in to comment"); return; }
    const content = parentId ? replyContent : newComment;
    if (!content.trim()) return;

    try {
      const { error } = await supabase.from("comments").insert({
        user_id: userId,
        anime_id: animeId,
        parent_id: parentId || null,
        content: content.trim(),
      });

      if (error) { toast.error("Failed to post comment"); return; }
      if (parentId) { setReplyContent(""); setReplyTo(null); }
      else setNewComment("");
      toast.success("Comment posted!");
    } catch {
      toast.error("Database unavailable");
    }
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (error) toast.error("Failed to delete");
    else toast.success("Comment deleted");
  };

  const toggleReplies = (id: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`flex gap-3 ${isReply ? "ml-10 mt-3" : ""}`}>
      <Link to={`/user/${comment.user_id}`} className="shrink-0">
        {comment.profile?.avatar_url ? (
          <img 
            src={comment.profile.avatar_url} 
            className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20" 
            loading="lazy"
            width={32}
            height={32}
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-primary/20">
            <User className="h-4 w-4 text-primary" />
          </div>
        )}
      </Link>
      <div className="flex-1 min-w-0">
        <div className="glass-panel rounded-xl p-3 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Link to={`/user/${comment.user_id}`} className="text-xs font-semibold text-primary hover:underline truncate">
              {comment.profile?.username || "Anonymous"}
            </Link>
            <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(comment.created_at)}</span>
          </div>
          <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{comment.content}</p>
        </div>
        <div className="flex items-center gap-3 mt-1.5 px-1">
          {!isReply && (
            <button onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors">
              <Reply className="h-3 w-3" /> Reply
            </button>
          )}
          {userId === comment.user_id && (
            <button onClick={() => handleDelete(comment.id)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          )}
          {!isReply && comment.replies && comment.replies.length > 0 && (
            <button onClick={() => toggleReplies(comment.id)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors">
              {expandedReplies.has(comment.id) ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
            </button>
          )}
        </div>

        {/* Reply input */}
        {replyTo === comment.id && (
          <div className="flex gap-2 mt-2 ml-1">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="min-h-[60px] text-xs bg-background/50 border-primary/20 focus:border-primary/50 resize-none"
              maxLength={500}
            />
            <Button size="sm" onClick={() => handlePost(comment.id)} disabled={!replyContent.trim()} className="shrink-0 h-8 w-8 p-0">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* Replies */}
        {expandedReplies.has(comment.id) && comment.replies?.map((reply) => (
          <CommentItem key={reply.id} comment={reply} isReply />
        ))}
      </div>
    </div>
  );

  return (
    <div className="glass-panel rounded-xl p-4 md:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h2 className="text-base font-bold">Comments</h2>
        <span className="text-xs text-muted-foreground">({comments.length})</span>
      </div>

      {/* New comment input */}
      {userId ? (
        <div className="flex gap-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts about this anime..."
            className="min-h-[80px] text-sm bg-background/50 border-primary/20 focus:border-primary/50 resize-none"
            maxLength={1000}
          />
          <Button onClick={() => handlePost()} disabled={!newComment.trim()} className="shrink-0 self-end gap-1.5">
            <Send className="h-4 w-4" /> Post
          </Button>
        </div>
      ) : (
        <div className="text-center py-4 glass-panel rounded-lg">
          <p className="text-sm text-muted-foreground">
            <Link to="/auth" className="text-primary hover:underline font-medium">Log in</Link> to join the conversation
          </p>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-16 rounded-xl bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-6">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
          {comments.map((c) => <CommentItem key={c.id} comment={c} />)}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
