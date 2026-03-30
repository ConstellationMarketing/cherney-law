import { useState } from 'react';
import ImportWizard from '@site/components/admin/importer/ImportWizard';
import ImportHistory from '@site/components/admin/importer/ImportHistory';
import MappingPresets from '@site/components/admin/importer/MappingPresets';
import RecipePresets from '@site/components/admin/importer/RecipePresets';

type Tab = 'import' | 'history' | 'mappings' | 'recipes';

export default function AdminBulkImport() {
  const [activeTab, setActiveTab] = useState<Tab>('import');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'import', label: 'New Import' },
    { key: 'history', label: 'History' },
    { key: 'mappings', label: 'Mapping Presets' },
    { key: 'recipes', label: 'Recipes' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bulk Import</h1>
        <p className="text-sm text-gray-500 mt-1">
          Import practice area pages and blog posts from CSV, JSON, or API feeds.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'import' && <ImportWizard />}
      {activeTab === 'history' && <ImportHistory />}
      {activeTab === 'mappings' && <MappingPresets />}
      {activeTab === 'recipes' && <RecipePresets />}
    </div>
  );
}
