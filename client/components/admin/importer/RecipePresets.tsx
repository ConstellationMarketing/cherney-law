import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { RecipePreset } from '@site/lib/importer/recipeTypes';

export default function RecipePresets() {
  const [presets, setPresets] = useState<RecipePreset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPresets();
  }, []);

  async function loadPresets() {
    setLoading(true);
    const { data } = await supabase
      .from('import_recipes')
      .select('*')
      .order('created_at', { ascending: false });

    setPresets((data as RecipePreset[]) ?? []);
    setLoading(false);
  }

  async function deletePreset(id: string) {
    if (!confirm('Delete this recipe?')) return;
    await supabase.from('import_recipes').delete().eq('id', id);
    setPresets((prev) => prev.filter((p) => p.id !== id));
  }

  async function toggleActive(id: string, active: boolean) {
    await supabase.from('import_recipes').update({ is_active: active }).eq('id', id);
    setPresets((prev) => prev.map((p) => (p.id === id ? { ...p, is_active: active } : p)));
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Recipes</h2>
      <p className="text-sm text-gray-500">Saved transformation recipes with rules for processing imported data.</p>

      {presets.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No recipes saved yet.</p>
          <p className="text-sm text-gray-400 mt-1">Recipes are created during the Build Recipe step of an import.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {presets.map((preset) => (
            <div key={preset.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{preset.name}</span>
                  {!preset.is_active && (
                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">Inactive</span>
                  )}
                  <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded">v{preset.version}</span>
                </div>
                <div className="text-sm text-gray-500 mt-0.5">
                  {preset.template_type} &middot;{' '}
                  {preset.recipe_json.rules?.length ?? 0} rule(s) &middot;{' '}
                  threshold: {Math.round(preset.confidence_threshold * 100)}% &middot;{' '}
                  {new Date(preset.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(preset.id, !preset.is_active)}
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  {preset.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => deletePreset(preset.id)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
