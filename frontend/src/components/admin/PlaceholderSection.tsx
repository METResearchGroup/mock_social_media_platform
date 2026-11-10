"use client";
import { useState, type FormEvent, type ReactNode } from "react";
import { AdminNav } from "@/components/chrome/AdminNav";
import { AppHeader } from "@/components/chrome/AppHeader";
import { AppShell } from "@/components/chrome/AppShell";
export function PlaceholderSection({ kind }: { kind: "posts" | "experiments" }): ReactNode {
 const label = kind === "posts" ? "Posts" : "Experiments"; const singular = kind === "posts" ? "post" : "experiment";
 const [items, setItems] = useState<string[]>([]); const [name, setName] = useState("");
 function add(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (name.trim()) { setItems((old) => [...old, name.trim()]); setName(""); } }
 return <AppShell active="admin" authors={[]} wide><AppHeader title="Admin" subtitle="Manage your content and studies" /><AdminNav active={kind} /><section className="admin-list"><h2 className="section-heading">{label}</h2><p className="public-note">Preview this workspace. Entries are temporary and will be cleared when you leave this page.</p>{items.length ? <ul>{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p className="empty-feeds">No {kind} added yet.</p>}
 <details className="placeholder-action"><summary>Add {singular}</summary><form onSubmit={add}><div className="field"><label htmlFor={`${kind}-name`}>{kind === "posts" ? "Post text" : "Name"}</label><input id={`${kind}-name`} value={name} onChange={(event) => setName(event.target.value)} required /></div><button type="submit" className="primary-button placeholder-action">Add {singular}</button></form></details></section></AppShell>;
}
