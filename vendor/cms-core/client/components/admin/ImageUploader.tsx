import { useState, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
const isPdfUrl = (url?: string) => !!url && url.toLowerCase().includes(".pdf");

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  bucket?: string;
  folder?: string;
  className?: string;
  placeholder?: string;
}

export default function ImageUploader({
  value,
  onChange,
  onRemove,
  bucket = "media",
  folder = "uploads",
  className,
  placeholder = "Drop an image here or click to upload",
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
  async (file: File) => {
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";

    if (!isImage && !isPdf) {
      setError("Please upload an image or PDF file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setError(null);
    setUploading(true);

    try {
        // Generate unique filename
        const ext = file.name.split(".").pop();
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const fileName = `${folder}/${timestamp}-${randomStr}.${ext}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
const { data: urlData } = supabase.storage
  .from(bucket)
  .getPublicUrl(fileName);

const publicUrl = urlData.publicUrl;

// Set the field value immediately (this is the important part for editors)
onChange(publicUrl);

// Best-effort: also register in media table so it appears in /admin/media
try {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;

  const uploadedBy = userData?.user?.id ?? null;

  const { error: mediaErr } = await supabase.from("media").insert({
    file_name: file.name,
    file_path: fileName,      // storage path like "uploads/123-abc.webp"
    public_url: publicUrl,
    file_size: file.size ?? null,
    mime_type: file.type ?? null,
    uploaded_by: uploadedBy,
  });

  if (mediaErr) {
    console.warn("[ImageUploader] Failed to insert media row:", mediaErr);
  }
} catch (e) {
  console.warn("[ImageUploader] Failed to register media row:", e);
};

      } catch (err) {
        console.error("Upload error:", err);
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [bucket, folder, onChange]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleUpload(e.dataTransfer.files[0]);
      }
    },
    [handleUpload]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        handleUpload(e.target.files[0]);
      }
    },
    [handleUpload]
  );

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleRemove = () => {
    onChange("");
    onRemove?.();
  };

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleChange}
        className="hidden"
      />

      {value ? (
        <div className="relative group">
          <div className="relative rounded-lg overflow-hidden border bg-gray-50">
  {isPdfUrl(value) ? (
    <div className="w-full h-48 flex flex-col items-center justify-center bg-gray-50">
      <p className="text-sm text-gray-600 font-medium">PDF Uploaded</p>
      <a
        href={value}
        target="_blank"
        rel="noreferrer"
        className="text-xs text-blue-600 underline mt-1"
      >
        Open PDF
      </a>
    </div>
  ) : (
    <img src={value} alt="Uploaded" className="w-full h-48 object-cover" />
  )}

  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
    ...
  </div>
</div>
          <p className="text-xs text-gray-500 mt-1 truncate">{value}</p>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            dragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50",
            uploading && "pointer-events-none opacity-50"
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <p className="text-sm text-gray-500">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-gray-100 rounded-full">
                <ImageIcon className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">{placeholder}</p>
              <p className="text-xs text-gray-400">
                PNG, JPG, GIF, WebP, PDF up to 10MB
              </p>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Manual URL input as fallback */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">or paste URL:</span>
        <Input
          type="url"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="text-xs h-8"
        />
      </div>
    </div>
  );
}
