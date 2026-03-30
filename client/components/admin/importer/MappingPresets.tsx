import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { MappingPreset } from '@site/lib/importer/types';

export default function MappingPresets() {
  const [presets, setPresets] = useState<MappingPreset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPresets();
  }, []);

  async function loadPresets() {
    setLoading(true);
    const { data } = await supabase
      .from('mapping_presets')
      .select('*')
      .order('created_at', { ascending: false });

    setPresets((data as MappingPreset[]) ?? []);
    setLoading(false);
  }

  async function deletePreset(id: string) {
    if (!confirm('Delete this mapping preset?')) return;
    await supabase.from('mapping_presets').delete().eq('id', id);
    setPresets((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Mapping Presets</h2>
      <p className="text-sm text-gray-500">Saved field mapping configurations that can be reused across imports.</p>

      {presets.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No mapping presets saved yet.</p>
          <p className="text-sm text-gray-400 mt-1">Presets are created during the Field Mapping step of an import.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {presets.map((preset) => (
            <div key={preset.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
              <div>
                <div className="font-medium text-gray-900">{preset.name}</div>
                <div className="text-sm text-gray-500">
                  {preset.template_type} &middot;{' '}
                  {preset.mapping_json.mappings?.length ?? 0} field(s) mapped &middot;{' '}
                  {new Date(preset.created_at).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => deletePreset(preset.id)}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
