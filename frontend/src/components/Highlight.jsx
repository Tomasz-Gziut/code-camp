import React from "react";
import { normalize } from "../utils/firmUtils";

export default function Highlight({ text, query }) {
  const q = normalize(query);
  const t = String(text);
  if (!q) return t;

  const lower = t.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return t;

  const before = t.slice(0, idx);
  const mid = t.slice(idx, idx + q.length);
  const after = t.slice(idx + q.length);

  return (
    <>
      {before}
      <mark>{mid}</mark>
      {after}
    </>
  );
}
