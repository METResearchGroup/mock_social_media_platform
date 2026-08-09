"use client";

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
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"like" | "retweet" | null>(null);

  async function onLike(): Promise<void> {
    setPending("like");
    setError(null);
    try {
      const result = await likePost(postId);
      setEngagement(result.post.engagement);
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
    } catch {
      setError("Could not retweet this post.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="engagement-bar">
      <button
        type="button"
        className="engagement-button"
        onClick={onLike}
        disabled={pending !== null}
      >
        Like ({engagement.like_count})
      </button>
      <button
        type="button"
        className="engagement-button"
        onClick={onRetweet}
        disabled={pending !== null}
      >
        Retweet ({engagement.retweet_count})
      </button>
      <span className="reply-count">{engagement.reply_count} replies</span>
      {error ? <p className="error-text">{error}</p> : null}
    </div>
  );
}
