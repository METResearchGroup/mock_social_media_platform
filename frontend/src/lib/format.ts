import type { Post } from "@/lib/types";

export function formatTimestamp(value: string): string {
  const date = new Date(value);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function initials(displayName: string): string {
  return displayName
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const AVATAR_TONES = ["tone-sky", "tone-teal", "tone-slate", "tone-forest"] as const;

export function avatarTone(seed: string): (typeof AVATAR_TONES)[number] {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash + seed.charCodeAt(index) * (index + 1)) % AVATAR_TONES.length;
  }
  return AVATAR_TONES[hash] ?? "tone-sky";
}

export function uniqueAuthors(posts: Post[]): Post["author"][] {
  const seen = new Set<string>();
  const authors: Post["author"][] = [];
  for (const post of posts) {
    if (seen.has(post.author.id)) {
      continue;
    }
    seen.add(post.author.id);
    authors.push(post.author);
  }
  return authors;
}
