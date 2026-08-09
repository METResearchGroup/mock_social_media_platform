"use client";

import { Heart, MessageCircle, Repeat2 } from "lucide-react";
import { useState, type ReactNode } from "react";

import { likePost, retweetPost } from "@/lib/api";
import type { EngagementMetrics } from "@/lib/types";

export function EngagementBar({
  postId,
  initialEngagement,
}: {
  postId: string;
  initialEngagement: EngagementMetrics;
}): ReactNode {
  const [engagement, setEngagement] = useState(initialEngagement);
  const [liked, setLiked] = useState(false);
  const [retweeted, setRetweeted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"like" | "retweet" | null>(null);

  async function onLike(): Promise<void> {
    setPending("like");
    setError(null);
    try {
      const result = await likePost(postId);
      setEngagement(result.post.engagement);
      setLiked(true);
    } catch {
      setError("Could not like this post.");
    } finally {
      setPending(null);
    }
  }

  async function onRetweet(): Promise<void> {
    setPending("retweet");
    setError(null);
    try {
      const result = await retweetPost(postId);
      setEngagement(result.post.engagement);
      setRetweeted(true);
    } catch {
      setError("Could not retweet this post.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="engagement-bar">
      <div className="detail-stats" aria-label="Engagement summary">
        <span>
          <strong>{engagement.retweet_count}</strong> Retweets
        </span>
        <span>
          <strong>{engagement.like_count}</strong> Likes
        </span>
        <span>
          <strong>{engagement.reply_count}</strong> Replies
        </span>
      </div>
      <div className="engagement-actions">
        <button
          type="button"
          className="engagement-button is-reply"
          disabled
          aria-label={`${engagement.reply_count} replies`}
        >
          <MessageCircle aria-hidden="true" />
          <span className="engagement-label">Reply</span>
          <span className="engagement-count">{engagement.reply_count}</span>
        </button>
        <button
          type="button"
          className={
            retweeted
              ? "engagement-button is-retweet is-active"
              : "engagement-button is-retweet"
          }
          onClick={onRetweet}
          disabled={pending !== null}
          aria-label={`Retweet, ${engagement.retweet_count}`}
        >
          <Repeat2 aria-hidden="true" />
          <span className="engagement-label">Retweet</span>
          <span className="engagement-count">{engagement.retweet_count}</span>
        </button>
        <button
          type="button"
          className={
            liked ? "engagement-button is-like is-active" : "engagement-button is-like"
          }
          onClick={onLike}
          disabled={pending !== null}
          aria-label={`Like, ${engagement.like_count}`}
        >
          <Heart aria-hidden="true" fill={liked ? "currentColor" : "none"} />
          <span className="engagement-label">Like</span>
          <span className="engagement-count">{engagement.like_count}</span>
        </button>
      </div>
      {error ? <p className="error-text">{error}</p> : null}
    </div>
  );
}
