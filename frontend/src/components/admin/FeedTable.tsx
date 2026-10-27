"use client";

import { useRouter } from "next/navigation";
import type { KeyboardEvent, ReactNode } from "react";

export type FeedTableRow = {
  id: string;
  name: string;
  postCount: number;
  loadCount: number;
  createdLabel: string;
};

export function FeedTable({ rows }: { rows: FeedTableRow[] }): ReactNode {
  const router = useRouter();

  function openDetail(id: string): void {
    router.push(`/admin/feeds/${id}`);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTableRowElement>, id: string): void {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDetail(id);
    }
  }

  return (
    <div className="table-wrap">
      <table className="feed-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Id</th>
            <th>Posts</th>
            <th>Loads</th>
            <th>Created</th>
            <th>Link</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="clickable-row"
              tabIndex={0}
              onClick={() => openDetail(row.id)}
              onKeyDown={(event) => onKeyDown(event, row.id)}
            >
              <td>{row.name}</td>
              <td className="feed-id">{row.id}</td>
              <td>{row.postCount}</td>
              <td>{row.loadCount}</td>
              <td>{row.createdLabel}</td>
              <td>
                <a
                  className="text-link"
                  href={`/feed/${row.id}`}
                  onClick={(event) => event.stopPropagation()}
                >
                  /feed/{row.id}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
