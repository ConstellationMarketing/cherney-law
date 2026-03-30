import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Save, Plus, Trash2, Loader2 } from "lucide-react";
import ImageUploader from "./ImageUploader";

interface AwardImage {
  src: string;
  alt: string;
}

interface SidebarSettings {
  id: string;
  attorney_image: string;
  award_images: AwardImage[];
}

interface Props {
  onClose: () => void;
}

export default function BlogSidebarSettingsPanel({ onClose }: Props) {
  const [settings, setSettings] = useState<SidebarSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("blog_sidebar_settings")
      .select("*")
      .limit(1)
      .single();

    if (data) {
      setSettings({
        id: data.id,
        attorney_image: data.attorney_image || "",
        award_images: Array.isArray(data.award_images) ? data.award_images : [],
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);

    const { error } = await supabase
      .from("blog_sidebar_settings")
      .update({
        attorney_image: settings.attorney_image,
        award_images: settings.award_images,
      } as Record<string, unknown>)
      .eq("id", settings.id);

    if (error) {
      alert("Failed to save: " + error.message);
    } else {
      alert("Sidebar settings saved!");
    }
    setSaving(false);
  };

  const addAward = () => {
    if (!settings) return;
    setSettings({
      ...settings,
      award_images: [...settings.award_images, { src: "", alt: "" }],
    });
  };

  const updateAward = (i: number, patch: Partial<AwardImage>) => {
    if (!settings) return;
    const imgs = [...settings.award_images];
    imgs[i] = { ...imgs[i], ...patch };
    setSettings({ ...settings, award_images: imgs });
  };

  const removeAward = (i: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      award_images: settings.award_images.filter((_, idx) => idx !== i),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-xl p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Blog Sidebar Settings</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : settings ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Attorney Image</Label>
              <ImageUploader
                value={settings.attorney_image}
                onChange={(url) =>
                  setSettings({ ...settings, attorney_image: url })
                }
                folder="blog"
              />
            </div>

            <div className="space-y-3">
              <Label>Award Images</Label>
              {settings.award_images.map((img, i) => (
                <div key={i} className="border rounded p-3 space-y-2 relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-7 w-7 text-red-400"
                    onClick={() => removeAward(i)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <ImageUploader
                    value={img.src}
                    onChange={(url) => updateAward(i, { src: url })}
                    folder="awards"
                  />
                  <Input
                    placeholder="Alt text"
                    value={img.alt}
                    onChange={(e) => updateAward(i, { alt: e.target.value })}
                  />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addAward}>
                <Plus className="w-4 h-4 mr-1" /> Add Award Image
              </Button>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Settings
            </Button>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No sidebar settings found.</p>
        )}
      </div>
    </div>
  );
}
