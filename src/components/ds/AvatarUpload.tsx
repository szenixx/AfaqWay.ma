"use client";

/* Avatar upload — ported from reui's c-file-upload-2 (circular dashed-border
   preview, drag & drop, small remove badge, "Upload avatar"/"Avatar uploaded"
   label + size hint, destructive alert on a rejected file), hand-built on
   plain React + this platform's own upload pipeline instead of
   @reui/use-file-upload, and recoloured to AfaqWay's own DS tokens. */

import { useRef, useState, type DragEvent } from "react";
import { AlertCircle, Camera, X } from "lucide-react";
import { Loader } from "./Loader";
import { UserAvatar, type UserAvatarUser } from "./UserAvatar";

export type AvatarUploadProps = {
  user: UserAvatarUser;
  size?: number;
  accept?: string;
  maxSizeMb?: number;
  uploading?: boolean;
  progress?: number;
  onFile: (file: File) => void;
  onRemove?: () => void;
};

export function AvatarUpload({
  user, size = 96, accept = "image/png,image/jpeg,image/webp", maxSizeMb = 5,
  uploading = false, progress = 0, onFile, onRemove,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const hasPhoto = !!(localPreview || user.avatarUrl);

  function validate(file: File): string | null {
    const types = accept.split(",").map((t) => t.trim());
    if (!types.includes(file.type)) return `"${file.name}" isn't a supported image type.`;
    if (file.size > maxSizeMb * 1024 * 1024) return `"${file.name}" is larger than ${maxSizeMb}MB.`;
    return null;
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const problem = validate(file);
    if (problem) { setError(problem); return; }
    setError(null);
    setLocalPreview(URL.createObjectURL(file));
    onFile(file);
  }

  function handleRemove() {
    setLocalPreview(null);
    setError(null);
    onRemove?.();
  }

  return (
    <div className="af-avaup">
      <div
        className={`af-avaup-drop${dragging ? " dragging" : ""}${hasPhoto ? " filled" : ""}`}
        style={{ width: size, height: size }}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => { if (!uploading && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); inputRef.current?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragging(false); if (!uploading) handleFiles(e.dataTransfer.files); }}
        role="button" tabIndex={0} aria-label={hasPhoto ? "Change avatar" : "Upload avatar"}
      >
        {localPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={localPreview} alt="" className="af-avaup-img" style={{ width: size, height: size }} />
        ) : (
          <UserAvatar size={size} user={user} />
        )}
        {uploading ? (
          <span className="af-avaup-overlay"><Loader size={22} /></span>
        ) : (
          <span className="af-avaup-badge"><Camera size={15} /></span>
        )}
      </div>

      <input
        ref={inputRef} type="file" accept={accept} style={{ display: "none" }}
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
      />

      <div className="af-avaup-meta">
        <div className="af-avaup-label">{uploading ? `Uploading ${progress}%` : hasPhoto ? "Avatar uploaded" : "Upload avatar"}</div>
        <div className="af-avaup-hint">PNG, JPG or WEBP up to {maxSizeMb}MB</div>
        {hasPhoto && onRemove && !uploading && (
          <button type="button" className="af-avaup-remove" onClick={handleRemove}>
            <X size={13} />Remove photo
          </button>
        )}
        {error && (
          <div className="af-avaup-alert" role="alert">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default AvatarUpload;
