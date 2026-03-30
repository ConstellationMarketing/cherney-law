// CSV parser — parses CSV files into SourceRecord[]

import type { ParseResult, SourceColumn, SourceRecord } from './types';

/**
 * Parse a CSV string into an array of source records.
 * Handles quoted fields, escaped quotes, and multi-line values.
 */
export function parseCsv(csvText: string, delimiter = ','): ParseResult {
  const errors: string[] = [];

  const lines = splitCsvLines(csvText);
  if (lines.length < 2) {
    return { records: [], columns: [], totalRows: 0, errors: ['CSV must have a header row and at least one data row'] };
  }

  const headers = parseCsvRow(lines[0], delimiter);
  if (headers.length === 0) {
    return { records: [], columns: [], totalRows: 0, errors: ['No columns detected in header row'] };
  }

  // Detect duplicate headers and make unique
  const uniqueHeaders = makeUniqueHeaders(headers);

  const records: SourceRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCsvRow(line, delimiter);
    const data: Record<string, string> = {};

    for (let j = 0; j < uniqueHeaders.length; j++) {
      data[uniqueHeaders[j]] = (values[j] ?? '').trim();
    }

    // Add extra values as numbered columns
    for (let j = uniqueHeaders.length; j < values.length; j++) {
      if (values[j]?.trim()) {
        data[`_extra_${j}`] = values[j].trim();
        if (i === 1) errors.push(`Row ${i}: extra value in column ${j + 1} beyond header count`);
      }
    }

    records.push({ rowIndex: i - 1, data });
  }

  const columns = detectColumns(uniqueHeaders, records);

  return { records, columns, totalRows: records.length, errors };
}

/**
 * Parse a CSV file (from File input) into source records.
 */
export async function parseCsvFile(file: File, delimiter?: string): Promise<ParseResult> {
  const text = await file.text();

  // Auto-detect delimiter if not provided
  const detectedDelimiter = delimiter ?? detectDelimiter(text);
  return parseCsv(text, detectedDelimiter);
}

/**
 * Split CSV text into logical lines (respecting quoted multi-line values).
 */
function splitCsvLines(text: string): string[] {
  const lines: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (ch === '"') {
      if (insideQuotes && text[i + 1] === '"') {
        current += '""';
        i++;
      } else {
        insideQuotes = !insideQuotes;
        current += ch;
      }
    } else if ((ch === '\n' || ch === '\r') && !insideQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      lines.push(current);
      current = '';
    } else {
      current += ch;
    }
  }

  if (current.trim()) {
    lines.push(current);
  }

  return lines;
}

/**
 * Parse a single CSV row, handling quoted fields.
 */
function parseCsvRow(row: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const ch = row[i];

    if (ch === '"') {
      if (insideQuotes && row[i + 1] === '"') {
        current += '"';
        i++;
      } else if (insideQuotes) {
        insideQuotes = false;
      } else {
        insideQuotes = true;
      }
    } else if (ch === delimiter && !insideQuotes) {
      values.push(current);
      current = '';
    } else {
      current += ch;
    }
  }

  values.push(current);
  return values;
}

/**
 * Auto-detect the CSV delimiter by checking frequency in the first line.
 */
function detectDelimiter(text: string): string {
  const firstLine = text.split('\n')[0] ?? '';
  const candidates = [',', '\t', ';', '|'];
  let best = ',';
  let bestCount = 0;

  for (const delim of candidates) {
    const count = (firstLine.match(new RegExp(delim === '|' ? '\\|' : delim, 'g')) ?? []).length;
    if (count > bestCount) {
      bestCount = count;
      best = delim;
    }
  }

  return best;
}

/**
 * Make duplicate header names unique by appending _2, _3, etc.
 */
function makeUniqueHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>();
  return headers.map((h) => {
    const clean = h.trim() || 'column';
    const count = seen.get(clean) ?? 0;
    seen.set(clean, count + 1);
    return count > 0 ? `${clean}_${count + 1}` : clean;
  });
}

/**
 * Detect column metadata from parsed records.
 */
function detectColumns(headers: string[], records: SourceRecord[]): SourceColumn[] {
  return headers.map((name) => {
    const sampleValues = records
      .slice(0, 5)
      .map((r) => r.data[name] ?? '')
      .filter(Boolean);

    return {
      name,
      sampleValues,
      detectedType: detectColumnType(sampleValues),
    };
  });
}

/**
 * Detect the data type of a column from sample values.
 */
function detectColumnType(samples: string[]): SourceColumn['detectedType'] {
  if (samples.length === 0) return 'unknown';

  const htmlPattern = /<[a-z][^>]*>/i;
  const urlPattern = /^https?:\/\//i;
  const datePattern = /^\d{4}-\d{2}-\d{2}|^\d{1,2}\/\d{1,2}\/\d{2,4}/;
  const numberPattern = /^-?\d+(\.\d+)?$/;

  let htmlCount = 0, urlCount = 0, dateCount = 0, numberCount = 0;

  for (const s of samples) {
    if (htmlPattern.test(s)) htmlCount++;
    else if (urlPattern.test(s)) urlCount++;
    else if (datePattern.test(s)) dateCount++;
    else if (numberPattern.test(s)) numberCount++;
  }

  const threshold = samples.length * 0.5;
  if (htmlCount >= threshold) return 'html';
  if (urlCount >= threshold) return 'url';
  if (dateCount >= threshold) return 'date';
  if (numberCount >= threshold) return 'number';
  return 'text';
}
