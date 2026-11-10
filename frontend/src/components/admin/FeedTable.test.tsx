// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { FeedTable, type FeedTableRow } from "./FeedTable";

vi.mock("next/link", () => ({ default: ({ children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) => <a {...props}>{children}</a> }));

const rows: FeedTableRow[] = Array.from({ length: 30 }, (_, index) => ({
  id: `id-${String(index + 1).padStart(2, "0")}`,
  name: `Feed ${String(index + 1).padStart(2, "0")}`,
  postCount: index + 1,
  loadCount: 30 - index,
  createdAt: `2026-10-${String(index + 1).padStart(2, "0")}T12:00:00Z`,
  createdLabel: `October ${index + 1}`,
}));

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new Event("close")); };
});
afterEach(cleanup);

describe("FeedTable", () => {
  it("sorts by creation date by default and paginates 25 rows at a time", () => {
    render(<FeedTable rows={rows} />);
    let bodyRows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
    expect(bodyRows).toHaveLength(25);
    expect(within(bodyRows[0]).getByRole("button").textContent).toBe("Feed 30");
    expect(screen.getByText("Showing 1–25 of 30")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    bodyRows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
    expect(bodyRows).toHaveLength(5);
    expect(within(bodyRows[0]).getByRole("button").textContent).toBe("Feed 05");
    expect(screen.getByText("Showing 26–30 of 30")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Posts/ }));
    expect(screen.getByText("Showing 1–25 of 30")).toBeTruthy();
    expect(within(screen.getAllByRole("row")[1]).getByRole("button").textContent).toBe("Feed 01");
    fireEvent.click(screen.getByRole("button", { name: /Posts/ }));
    expect(within(screen.getAllByRole("row")[1]).getByRole("button").textContent).toBe("Feed 30");
  });

  it("opens a choice of admin and new-tab user views", () => {
    render(<FeedTable rows={[rows[0]]} />);
    fireEvent.click(screen.getByRole("button", { name: "Feed 01" }));
    const dialog = screen.getByRole("dialog", { name: "Open Feed 01" });
    expect(within(dialog).getByRole("link", { name: "Admin view" }).getAttribute("href")).toBe("/admin/feeds/id-01");
    const userLink = within(dialog).getByRole("link", { name: /User view/ });
    expect(userLink.getAttribute("href")).toBe("/feed/id-01");
    expect(userLink.getAttribute("target")).toBe("_blank");
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
