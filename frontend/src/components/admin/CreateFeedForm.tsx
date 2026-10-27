"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

import { createHostedFeed } from "@/lib/api";

function parseIdentifiers(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function CreateFeedForm(): ReactNode {
  const router = useRouter();
  const [name, setName] = useState("");
  const [rawPosts, setRawPosts] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const posts = parseIdentifiers(rawPosts);
  const canSubmit = name.trim().length > 0 && posts.length > 0 && !pending;

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    setPending(true);
    setError(null);
    setCopied(false);
    try {
      const feed = await createHostedFeed(name.trim(), posts);
      setCreatedUrl(`${window.location.origin}/feed/${feed.id}`);
      router.refresh();
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Could not create the feed.";
      setError(message);
    } finally {
      setPending(false);
    }
  }

  async function onCopy(): Promise<void> {
    if (createdUrl === null) {
      return;
    }
    const field = document.getElementById("feed-link");
    try {
      await navigator.clipboard.writeText(createdUrl);
      setCopied(true);
      setError(null);
    } catch {
      if (field instanceof HTMLInputElement) {
        field.focus();
        field.select();
      }
      setCopied(false);
      setError(null);
    }
  }

  return (
    <form className="admin-panel" onSubmit={onSubmit}>
      <h2 className="section-heading">Create a feed</h2>
      <p className="public-note">
        Paste one post identifier per line. Use a posts.id such as post_1, or
        any other identifier such as an at:// URI. This page is public. There
        is no sign-in.
      </p>
      <div className="field">
        <label htmlFor="feed-name">Name</label>
        <input
          id="feed-name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          placeholder="Morning notes"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="feed-posts">Post identifiers</label>
        <textarea
          id="feed-posts"
          name="posts"
          value={rawPosts}
          onChange={(event) => setRawPosts(event.target.value)}
          spellCheck={false}
          placeholder={"post_1\npost_3\nat://did:plc:example/app.bsky.feed.post/3kzo2exfi5z2r"}
          required
        />
      </div>
      <button className="primary-button" type="submit" disabled={!canSubmit}>
        {pending ? "Creating..." : "Create feed"}
      </button>
      {error ? <p className="error-text">{error}</p> : null}
      {createdUrl ? (
        <div className="share-panel" aria-live="polite">
          <p className="empty-title">Feed link</p>
          <div className="share-row">
            <input
              id="feed-link"
              readOnly
              value={createdUrl}
              aria-label="Shareable feed link"
            />
            <button className="secondary-button" type="button" onClick={onCopy}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <a className="text-link" href={createdUrl}>
            Open feed
          </a>
        </div>
      ) : null}
    </form>
  );
}
