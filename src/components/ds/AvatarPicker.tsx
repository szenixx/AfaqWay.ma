"use client";

import { useEffect, useRef, useState } from "react";
import { Check, RefreshCcw, Trash2, Upload } from "lucide-react";
import { AnimatedModal, DialogCard, DialogFoot, DialogHead } from "@/components/ds";
import { UserAvatar } from "./UserAvatar";
import { squareCompress } from "@/lib/imagePrep";
import { newSeed, presetsFor, styleForGender, type AvatarPreset, type Gender } from "@/lib/avatarIdentity";

/* Change avatar.

   Four states, in priority order: an uploaded photo, a chosen preset, the
   generated default, and the plain fallback icon when a user has nothing.
   Presets always match the user's gender, never the opposite.

   Nothing is written until Done, so Cancel really cancels: the preview is
   local state and the caller only hears about a decision on save. */

export type AvatarChoice =
  | { kind: "preset"; seed: string; style: string }
  | { kind: "upload"; file: File }
  | { kind: "remove" };

export function AvatarPicker({ user, gender, currentSeed, currentStyle, currentUrl, onCancel, onSave }: {
  user: { id?: string | null; name?: string | null };
  gender: Gender | string | null | undefined;
  currentSeed?: string | null;
  currentStyle?: string | null;
  currentUrl?: string | null;
  onCancel: () => void;
  onSave: (choice: AvatarChoice) => Promise<void>;
}) {
  const presets = presetsFor(gender);
  const [seed, setSeed] = useState(currentSeed ?? presets[0].seed);
  const [style, setStyle] = useState(currentStyle ?? styleForGender((gender as Gender) ?? "prefer_not_to_say"));
  /** A photo chosen but not yet saved, previewed from an object URL. */
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Object URLs must be released or the tab leaks memory on every preview.
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const choosePreset = (p: AvatarPreset) => {
    setPhoto(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setRemoving(false);
    setSeed(p.seed);
    setStyle(p.style);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) { setError("Choose an image file."); return; }
    if (file.size > 8 * 1024 * 1024) { setError("Images must be 8 MB or smaller."); return; }
    try {
      // Cropped to a square and compressed before it ever leaves the browser.
      const prepared = await squareCompress(file);
      if (preview) URL.revokeObjectURL(preview);
      setPhoto(prepared);
      setPreview(URL.createObjectURL(prepared));
      setRemoving(false);
    } catch {
      setError("That image could not be processed. Try another one.");
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      if (removing) await onSave({ kind: "remove" });
      else if (photo) await onSave({ kind: "upload", file: photo });
      else await onSave({ kind: "preset", seed, style });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your avatar.");
      setBusy(false);
      return;
    }
    setBusy(false);
  };

  // What the preview shows right now, following the same priority as the app.
  const previewUser = {
    id: user.id, name: user.name,
    avatarUrl: removing ? null : preview ?? (photo ? null : currentUrl ?? null),
    avatarSeed: seed, avatarStyle: style, gender: gender as Gender,
  };

  return (
    <AnimatedModal open onClose={onCancel} className="dlg avp" ariaLabel="Change avatar">
      <DialogHead title="Change avatar">
        Pick one of the avatars below, or upload your own photo. Nothing is saved until you press Done.
      </DialogHead>

      <div className="dlg-body">
        <DialogCard tone="quiet">
          <div className="avp-preview">
            <UserAvatar size={96} user={previewUser} />
            <div className="avp-preview-text">
              <b>{removing ? "Default avatar" : photo ? "Your photo" : currentUrl && !photo ? "Your photo" : "Preset avatar"}</b>
              <span>
                {removing
                  ? "Your photo will be removed and the default avatar restored."
                  : photo
                    ? "Cropped to a square and compressed, ready to upload."
                    : "This is how you appear across the platform."}
              </span>
            </div>
          </div>
        </DialogCard>

        <DialogCard title="Choose an avatar">
          <div className="avp-grid" role="radiogroup" aria-label="Preset avatars">
            {presets.map((p) => {
              const active = !photo && !removing && p.seed === seed;
              return (
                <button
                  key={p.id} type="button" role="radio" aria-checked={active}
                  className={`avp-cell${active ? " active" : ""}`} onClick={() => choosePreset(p)}
                >
                  <UserAvatar size={56} user={{ id: p.id, avatarSeed: p.seed, avatarStyle: p.style }} />
                  {active && <span className="avp-tick"><Check size={12} /></span>}
                </button>
              );
            })}
          </div>
          <button
            type="button" className="rply-preview-btn" style={{ marginTop: 10 }}
            onClick={() => choosePreset({ id: "random", seed: newSeed(), style })}
          >
            <RefreshCcw size={14} />Surprise me with another
          </button>
        </DialogCard>

        <DialogCard title="Your own photo" hint="Square crop, compressed automatically. JPG, PNG or WebP up to 8 MB.">
          <div className="avp-actions">
            <button type="button" className="jr-btn jr-btn-outline" onClick={() => fileRef.current?.click()}>
              <Upload size={14} />{photo || currentUrl ? "Choose a different photo" : "Upload a photo"}
            </button>
            {(currentUrl || photo) && (
              <button
                type="button" className="jr-btn jr-btn-danger"
                onClick={() => { setRemoving(true); setPhoto(null); if (preview) URL.revokeObjectURL(preview); setPreview(null); }}
              >
                <Trash2 size={14} />Remove photo
              </button>
            )}
          </div>
          <input
            ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }}
            onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }}
          />
          {error && <p className="af-drop-error">{error}</p>}
        </DialogCard>
      </div>

      <DialogFoot>
        <button type="button" className="jr-btn jr-btn-quiet jr-btn-md" onClick={onCancel} disabled={busy}>Cancel</button>
        <button type="button" className="jr-btn jr-btn-primary jr-btn-md" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Done"}
        </button>
      </DialogFoot>
    </AnimatedModal>
  );
}

export default AvatarPicker;
