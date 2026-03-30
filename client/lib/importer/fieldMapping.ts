// Field mapping — Apply mapping config to transform source records into mapped records

import type { MappedRecord, MappingConfig, SourceRecord } from './types';

/**
 * Apply field mapping to transform source records using the mapping configuration.
 * Source column values are copied to their mapped target field keys.
 */
export function applyFieldMapping(
  records: SourceRecord[],
  config: MappingConfig
): MappedRecord[] {
  return records.map((record) => ({
    rowIndex: record.rowIndex,
    sourceData: { ...record.data },
    mappedData: mapRecordData(record.data, config),
  }));
}

/**
 * Map a single record's data using the mapping configuration.
 */
function mapRecordData(
  data: Record<string, string>,
  config: MappingConfig
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const mapping of config.mappings) {
    const value = data[mapping.sourceColumn];
    if (value !== undefined) {
      result[mapping.targetField] = value;
    }
  }

  return result;
}

/**
 * Apply field mapping to a single record.
 */
export function applyFieldMappingSingle(
  record: SourceRecord,
  config: MappingConfig
): MappedRecord {
  return {
    rowIndex: record.rowIndex,
    sourceData: { ...record.data },
    mappedData: mapRecordData(record.data, config),
  };
}
