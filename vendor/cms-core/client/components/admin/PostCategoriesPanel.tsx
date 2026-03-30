import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Trash2, Plus, Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  onClose: () => void;
}

export default function PostCategoriesPanel({ onClose }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("post_categories")
      .select("id, name, slug")
      .order("name");
    setCategories((data as Category[]) || []);
    setLoading(false);
  };

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);

    const { error } = await supabase
      .from("post_categories")
      .insert({ name: newName.trim(), slug: generateSlug(newName) } as Record<string, unknown>);

    if (error) {
      alert("Failed to create category: " + error.message);
    } else {
      setNewName("");
      fetchCategories();
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? Posts in this category will be uncategorized.")) return;
    await supabase.from("post_categories").delete().eq("id", id);
    fetchCategories();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-xl p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Post Categories</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Create */}
        <div className="flex gap-2 mb-6">
          <Input
            placeholder="New category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <Button onClick={handleCreate} disabled={creating} size="sm">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : categories.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No categories yet</p>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-3 border rounded"
              >
                <div>
                  <p className="font-medium text-sm">{cat.name}</p>
                  <p className="text-xs text-gray-400">{cat.slug}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-400 hover:text-red-600"
                  onClick={() => handleDelete(cat.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
