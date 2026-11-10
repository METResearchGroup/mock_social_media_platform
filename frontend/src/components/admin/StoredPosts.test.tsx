// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { StoredPosts } from "./StoredPosts";
import type { Post } from "../../lib/types";

afterEach(cleanup);
const post: Post = { id: "post/1", text: "A post to include", author: { id: "a", handle: "author", display_name: "Author" }, created_at: "2026-11-10T00:00:00Z", engagement: { like_count: 0, retweet_count: 0, reply_count: 0 }, parent_post_id: null };

describe("StoredPosts", () => {
  it("shows stored post identifiers and content for feed creation", () => {
    render(<StoredPosts posts={[post]} />);
    expect(screen.getByRole("link", { name: "post/1" }).getAttribute("href")).toBe("/post/post%2F1");
    expect(screen.getByText("A post to include")).toBeTruthy();
  });
  it("distinguishes an empty list from a failed request", () => {
    const { rerender } = render(<StoredPosts posts={[]} />);
    expect(screen.getByText("No posts available.")).toBeTruthy();
    rerender(<StoredPosts posts={null} />);
    expect(screen.getByRole("status").textContent).toContain("Unable to load posts");
  });
});
