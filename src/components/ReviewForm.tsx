"use client";
import { useState } from "react";
import { sb } from "@/lib/supabase";

export function ReviewForm({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false), [rating, setRating] = useState(0), [busy, setBusy] = useState(false);
  const [f, setF] = useState({ user_name: "", title: "", comment: "" });
  const [files, setFiles] = useState<File[]>([]), [msg, setMsg] = useState("");

  const submit = async () => {
    if (!rating || f.user_name.trim().length < 2 || f.comment.trim().length < 10)
      return setMsg("Add a star rating, your name and a review of at least 10 characters.");
    setBusy(true); setMsg("");
    const urls: string[] = [];
    for (const file of files.slice(0, 3)) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 3 * 1024 * 1024) {
        setBusy(false); return setMsg("Photos must be JPG, PNG or WebP under 3 MB.");
      }
      const path = `${productId}/${crypto.randomUUID()}.${file.type.split("/")[1]}`;
      const { error } = await sb.storage.from("review-photos").upload(path, file, { contentType: file.type });
      if (error) { setBusy(false); return setMsg("Photo upload failed. Please try again."); }
      urls.push(sb.storage.from("review-photos").getPublicUrl(path).data.publicUrl);
    }
    const { error } = await sb.from("reviews").insert({
      product_id: productId, rating, user_name: f.user_name.trim(), title: f.title.trim() || null, comment: f.comment.trim(), images: urls,
    });
    setBusy(false);
    if (error) return setMsg("Could not submit your review. Please try again.");
    setOpen(false); setMsg("Thanks! Your review will appear once it has been approved.");
  };

  return (
    <div className="space-y-3">
      {!open && <button className="btn btn-ghost" onClick={() => setOpen(true)}>Write a product review</button>}
      {open && (
        <div className="space-y-3 rounded-md border border-line bg-surface p-4">
          <div role="radiogroup" aria-label="Rating" className="flex gap-1 text-2xl">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} role="radio" aria-checked={rating === n} aria-label={`${n} stars`} onClick={() => setRating(n)}
                className={n <= rating ? "text-gold-500" : "text-slate-300"}>★</button>
            ))}
          </div>
          <input className="h-control w-full rounded-md border border-line px-3" placeholder="Your name" value={f.user_name} onChange={(e) => setF({ ...f, user_name: e.target.value })} />
          <input className="h-control w-full rounded-md border border-line px-3" placeholder="Review headline" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <textarea className="h-28 w-full rounded-md border border-line p-3" placeholder="What did you like or dislike?" value={f.comment} onChange={(e) => setF({ ...f, comment: e.target.value })} />
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 3))} className="text-small" />
          <button disabled={busy} className="btn btn-cart" onClick={submit}>{busy ? "Submitting…" : "Submit review"}</button>
        </div>
      )}
      {msg && <p role="status" className="text-small text-slate-700">{msg}</p>}
    </div>
  );
}
