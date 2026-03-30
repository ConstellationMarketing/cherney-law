import { useState, useCallback } from 'react';
import type { WizardState } from '@site/lib/importer/recipeTypes';
import type { SourceType } from '@site/lib/importer/types';
import { parseCsvFile } from '@site/lib/importer/csvParser';
import { parseJson, fetchApiJson } from '@site/lib/importer/apiParser';

interface Props {
  state: WizardState;
  updateState: (u: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepSourceSelect({ state, updateState, onNext, onBack }: Props) {
  const [sourceType, setSourceType] = useState<SourceType>(state.sourceType ?? 'csv');
  const [jsonText, setJsonText] = useState('');
  const [jsonPath, setJsonPath] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCsvUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const result = await parseCsvFile(file);
      if (result.errors.length > 0 && result.records.length === 0) {
        setError(result.errors.join('\n'));
        return;
      }

      updateState({
        sourceType: 'csv',
        sourceRecords: result.records,
        sourceColumns: result.columns,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV');
    } finally {
      setLoading(false);
    }
  }, [updateState]);

  const handleJsonParse = useCallback(() => {
    setError('');
    const result = parseJson(jsonText, jsonPath || undefined);
    if (result.errors.length > 0 && result.records.length === 0) {
      setError(result.errors.join('\n'));
      return;
    }

    updateState({
      sourceType: 'json',
      sourceRecords: result.records,
      sourceColumns: result.columns,
    });
  }, [jsonText, jsonPath, updateState]);

  const handleApiFetch = useCallback(async () => {
    if (!apiUrl) return;
    setLoading(true);
    setError('');

    try {
      const result = await fetchApiJson(apiUrl, undefined, jsonPath || undefined);
      if (result.errors.length > 0 && result.records.length === 0) {
        setError(result.errors.join('\n'));
        return;
      }

      updateState({
        sourceType: 'api',
        sourceRecords: result.records,
        sourceColumns: result.columns,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch API');
    } finally {
      setLoading(false);
    }
  }, [apiUrl, jsonPath, updateState]);

  const hasData = state.sourceRecords.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Source Data</h2>
        <p className="text-sm text-gray-500 mt-1">Upload CSV, paste JSON, or enter an API feed URL.</p>
      </div>

      {/* Source type tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(['csv', 'json', 'api'] as SourceType[]).map((type) => (
          <button
            key={type}
            onClick={() => setSourceType(type)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              sourceType === type ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {type === 'csv' ? 'CSV File' : type === 'json' ? 'JSON Paste' : 'API Feed'}
          </button>
        ))}
      </div>

      {/* Source input */}
      {sourceType === 'csv' && (
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Upload CSV File</span>
            <input
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={handleCsvUpload}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </label>
        </div>
      )}

      {sourceType === 'json' && (
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Paste JSON Data</span>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={8}
              placeholder='[{"title": "Page 1", "content": "<p>...</p>"}, ...]'
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">JSON Path (optional)</span>
            <input
              type="text"
              value={jsonPath}
              onChange={(e) => setJsonPath(e.target.value)}
              placeholder="e.g., data.posts"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </label>
          <button
            onClick={handleJsonParse}
            disabled={!jsonText.trim()}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            Parse JSON
          </button>
        </div>
      )}

      {sourceType === 'api' && (
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">API Feed URL</span>
            <input
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://api.example.com/posts"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">JSON Path (optional)</span>
            <input
              type="text"
              value={jsonPath}
              onChange={(e) => setJsonPath(e.target.value)}
              placeholder="e.g., data.results"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </label>
          <button
            onClick={handleApiFetch}
            disabled={!apiUrl.trim() || loading}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Fetching...' : 'Fetch Data'}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Preview */}
      {hasData && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {state.sourceRecords.length} records
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {state.sourceColumns.length} columns
            </span>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">#</th>
                  {state.sourceColumns.slice(0, 6).map((col) => (
                    <th key={col.name} className="px-3 py-2 text-left font-medium text-gray-500 max-w-[200px] truncate">
                      {col.name}
                    </th>
                  ))}
                  {state.sourceColumns.length > 6 && (
                    <th className="px-3 py-2 text-left font-medium text-gray-400">+{state.sourceColumns.length - 6} more</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {state.sourceRecords.slice(0, 5).map((record) => (
                  <tr key={record.rowIndex}>
                    <td className="px-3 py-2 text-gray-400">{record.rowIndex + 1}</td>
                    {state.sourceColumns.slice(0, 6).map((col) => (
                      <td key={col.name} className="px-3 py-2 text-gray-700 max-w-[200px] truncate">
                        {record.data[col.name]?.substring(0, 80)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {state.sourceRecords.length > 5 && (
            <p className="text-xs text-gray-400">Showing first 5 of {state.sourceRecords.length} records</p>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button onClick={onBack} className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium">
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!hasData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
