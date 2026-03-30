// JSON/API parser — parses JSON strings with optional jsonPath extraction

import type { ParseResult, SourceColumn, SourceRecord } from './types';

/**
 * Parse a JSON string into source records.
 * Supports optional jsonPath to extract nested arrays.
 */
export function parseJson(jsonText: string, jsonPath?: string): ParseResult {
  const errors: string[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    return {
      records: [],
      columns: [],
      totalRows: 0,
      errors: [`Invalid JSON: ${e instanceof Error ? e.message : 'Parse error'}`],
    };
  }

  // Extract nested data using jsonPath if provided
  let data = parsed;
  if (jsonPath) {
    data = extractByPath(parsed, jsonPath);
    if (data === undefined) {
      return {
        records: [],
        columns: [],
        totalRows: 0,
        errors: [`JSON path "${jsonPath}" not found in data`],
      };
    }
  }

  // Ensure we have an array
  if (!Array.isArray(data)) {
    // If it's an object, try to find the first array property
    if (data && typeof data === 'object') {
      const arrayProp = Object.entries(data as Record<string, unknown>).find(
        ([, v]) => Array.isArray(v)
      );
      if (arrayProp) {
        errors.push(`Data is an object. Using array property "${arrayProp[0]}".`);
        data = arrayProp[1];
      } else {
        // Wrap single object in array
        data = [data];
        errors.push('Data is a single object. Wrapped in array.');
      }
    } else {
      return {
        records: [],
        columns: [],
        totalRows: 0,
        errors: ['Data is not an array or object'],
      };
    }
  }

  const arr = data as Record<string, unknown>[];
  if (arr.length === 0) {
    return { records: [], columns: [], totalRows: 0, errors: ['No records found in data'] };
  }

  // Flatten nested objects and convert all values to strings
  const records: SourceRecord[] = arr.map((item, i) => ({
    rowIndex: i,
    data: flattenObject(item),
  }));

  // Detect columns from all records
  const allKeys = new Set<string>();
  for (const r of records) {
    for (const k of Object.keys(r.data)) {
      allKeys.add(k);
    }
  }

  const columns: SourceColumn[] = Array.from(allKeys).map((name) => {
    const samples = records
      .slice(0, 5)
      .map((r) => r.data[name] ?? '')
      .filter(Boolean);

    return {
      name,
      sampleValues: samples,
      detectedType: detectType(samples),
    };
  });

  return { records, columns, totalRows: records.length, errors };
}

/**
 * Fetch JSON from an API URL (via server proxy to avoid CORS).
 */
export async function fetchApiJson(
  url: string,
  headers?: Record<string, string>,
  jsonPath?: string
): Promise<ParseResult> {
  try {
    const response = await fetch('/.netlify/functions/bulk-import-fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, headers }),
    });

    if (!response.ok) {
      return {
        records: [],
        columns: [],
        totalRows: 0,
        errors: [`API fetch failed: ${response.status} ${response.statusText}`],
      };
    }

    const text = await response.text();
    return parseJson(text, jsonPath);
  } catch (e) {
    return {
      records: [],
      columns: [],
      totalRows: 0,
      errors: [`API fetch error: ${e instanceof Error ? e.message : 'Unknown error'}`],
    };
  }
}

/**
 * Extract a value from a nested object using a dot-notation path.
 * Supports array indexing: "data.items[0].name"
 */
function extractByPath(obj: unknown, path: string): unknown {
  const segments = path.split(/\.|\[(\d+)\]/).filter(Boolean);
  let current: unknown = obj;

  for (const seg of segments) {
    if (current == null) return undefined;

    if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[seg];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Flatten a nested object into a single-level key-value map.
 * Nested keys are joined with dots: { a: { b: 1 } } → { "a.b": "1" }
 * Arrays are joined with commas unless they contain objects.
 */
function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value === null || value === undefined) {
      result[fullKey] = '';
    } else if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === 'object') {
        // Array of objects — flatten each with index
        value.forEach((item, i) => {
          if (typeof item === 'object' && item !== null) {
            Object.assign(result, flattenObject(item as Record<string, unknown>, `${fullKey}[${i}]`));
          } else {
            result[`${fullKey}[${i}]`] = String(item ?? '');
          }
        });
      } else {
        // Array of primitives — join
        result[fullKey] = value.map((v) => String(v ?? '')).join(', ');
      }
    } else if (typeof value === 'object') {
      Object.assign(result, flattenObject(value as Record<string, unknown>, fullKey));
    } else {
      result[fullKey] = String(value);
    }
  }

  return result;
}

/**
 * Detect column type from sample values.
 */
function detectType(samples: string[]): SourceColumn['detectedType'] {
  if (samples.length === 0) return 'unknown';

  const htmlPattern = /<[a-z][^>]*>/i;
  const urlPattern = /^https?:\/\//i;
  const datePattern = /^\d{4}-\d{2}-\d{2}/;

  let html = 0, url = 0, date = 0;
  for (const s of samples) {
    if (htmlPattern.test(s)) html++;
    else if (urlPattern.test(s)) url++;
    else if (datePattern.test(s)) date++;
  }

  const t = samples.length * 0.5;
  if (html >= t) return 'html';
  if (url >= t) return 'url';
  if (date >= t) return 'date';
  return 'text';
}
