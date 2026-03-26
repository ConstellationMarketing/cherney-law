import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Media } from "@/lib/database.types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Image as ImageIcon, Search } from "lucide-react";

interface MediaPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
}

export default function MediaPickerDialog({
  open,
  onOpenChange,
  onSelect,
}: MediaPickerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from("media")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          // images only
          setMediaItems(data.filter((m) => m.mime_type?.startsWith("image/")));
        }
        setLoading(false);
      });
  }, [open]);

  const filtered = mediaItems.filter(
    (m) =>
      m.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.alt_text ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (url: string) => {
    onSelect(url);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Pick from Media Library</DialogTitle>
        </DialogHeader>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by filename or alt text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <ImageIcon className="h-10 w-10 mb-3" />
              <p className="text-sm">
                {searchQuery
                  ? "No images match your search"
                  : "No images in the media library yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {filtered.map((media) => (
                <button
                  key={media.id}
                  onClick={() => handleSelect(media.public_url)}
                  className="group relative bg-gray-100 rounded-lg overflow-hidden aspect-square border hover:border-blue-500 focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <img
                    src={media.public_url}
                    alt={media.alt_text || media.file_name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                    <p className="text-white text-xs truncate px-2 py-1 w-full">
                      {media.file_name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
