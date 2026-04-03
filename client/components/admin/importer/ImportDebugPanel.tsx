import { useState } from 'react';
import type { TransformedRecord, TemplateType } from '@site/lib/importer/types';

interface Props {
  record: TransformedRecord;
  templateType: TemplateType;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function countWords(html: string): number {
  const text = stripTags(html);
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

/** Structured debug panel showing normalized content stats, segmentation, and pipeline log */
export default function ImportDebugPanel({ record, templateType }: Props) {
  const [open, setOpen] = useState(false);

  const content = record.preparedData.content as Record<string, unknown> | undefined;
  const log = record.transformationLog ?? [];
  const nc = record.normalizedContent;
  const previewParityEntry = log.find((entry) => entry.field === 'previewBatchParity');
  const pipelineAiSplitEntry = log.find((entry) => entry.field === 'pipelineAiSplit');

  // Compute stats — prefer normalizedContent if available
  const stats = nc
    ? {
        totalWords: nc.stats.totalWordCount,
        sectionCount: nc.stats.sectionBlockCount,
        faqCount: nc.stats.faqItemCount,
        imageCount: nc.stats.imageCount,
        sections: nc.sectionBlocks.map((b, i) => ({
          label: b.classification ? b.classification.charAt(0).toUpperCase() + b.classification.slice(1) : `Block ${i + 1}`,
          words: b.wordCount,
          heading: b.heading,
          hasImage: b.images.length > 0,
          classification: b.classification,
        })),
      }
    : computeStats(record, templateType, content);

  return (
    <div className="border-t border-gray-200 mt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-3 py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 flex items-center gap-1"
      >
        <span>{open ? '▼' : '▶'}</span>
        <span className="font-medium">Debug Info</span>
        <span className="text-gray-400 ml-1">
          ({stats.totalWords}w, {stats.sectionCount} sections, {stats.faqCount} FAQ, {stats.imageCount} img)
        </span>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3 text-xs">
          {/* Stats */}
          <div>
            <h5 className="font-semibold text-gray-700 mb-1">Stats</h5>
            <div className="grid grid-cols-4 gap-2">
              <StatBadge label="Words" value={stats.totalWords} />
              <StatBadge label="Sections" value={stats.sectionCount} />
              <StatBadge label="FAQ Items" value={stats.faqCount} />
              <StatBadge label="Images" value={stats.imageCount} />
            </div>
          </div>

          {/* Segmentation info from normalizedContent */}
          {nc && (
            <div>
              <h5 className="font-semibold text-gray-700 mb-1">Segmentation</h5>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded font-mono">
                  {nc.segmentation.method}
                </span>
                <span className="text-gray-500">
                  H2s: {nc.stats.h2Count}
                </span>
                <span className="text-gray-500">
                  Pre-H2: {nc.segmentation.preH2ContentLength} chars
                </span>
                <span className="text-gray-500">
                  FAQ detection: {nc.segmentation.faqDetectionMethod}
                </span>
              </div>
            </div>
          )}

          {(previewParityEntry || pipelineAiSplitEntry) && (
            <div>
              <h5 className="font-semibold text-gray-700 mb-1">Shared Pipeline</h5>
              <div className="space-y-1 rounded bg-gray-50 p-2">
                {pipelineAiSplitEntry && <DebugRow label="pipelineAiSplit" value={pipelineAiSplitEntry.action} />}
                {previewParityEntry && <DebugRow label="previewBatchParity" value={previewParityEntry.action} />}
              </div>
            </div>
          )}

          {nc && (
            <div>
              <h5 className="font-semibold text-gray-700 mb-1">Title Resolution</h5>
              <div className="space-y-1 rounded bg-gray-50 p-2">
                <DebugRow label="chosenTitle" value={nc.chosenTitle} />
                <DebugRow label="titleSource" value={nc.titleSource} />
                <DebugRow label="earlyPreservedHeading" value={nc.earlyPreservedHeading} />
                <DebugRow label="earlyPreservedH1" value={nc.earlyPreservedH1} />
                <DebugRow label="earlyPreservedH2" value={nc.earlyPreservedH2} />
                <DebugRow label="earlyHadH1" value={nc.earlyHadH1BeforeStrip ? 'true' : 'false'} />
                <DebugRow label="latePreservedHeading" value={nc.latePreservedHeading} />
                <DebugRow label="latePreservedH1" value={nc.latePreservedH1} />
                <DebugRow label="latePreservedH2" value={nc.latePreservedH2} />
                <DebugRow label="hadH1BeforeStrip" value={nc.hadH1BeforeStrip ? 'true' : 'false'} />
                <DebugRow label="mainContentDroppedH1" value={nc.mainContentDroppedEarlyH1 ? 'true' : 'false'} />
                <DebugRow label="extractedH1" value={nc.extractedH1} />
                <DebugRow label="rawMetaTitle" value={nc.rawMetaTitle} />
                <DebugRow label="cleanedMetaTitle" value={nc.cleanedMetaTitle} />
              </div>
            </div>
          )}

          {nc && (
            <div>
              <h5 className="font-semibold text-gray-700 mb-1">Hero Mapping</h5>
              <div className="space-y-1 rounded bg-gray-50 p-2">
                <DebugRow label="heroTagline" value={nc.heroTagline} />
                <DebugRow label="heroTaglineSource" value={nc.heroTaglineSource} />
                <DebugRow label="earlyHeroTagline" value={nc.earlyHeroTagline} />
                <DebugRow label="heroDescription" value={nc.heroDescription} />
              </div>
            </div>
          )}

          {templateType === 'area' && nc?.allocationDebug && (
            <div>
              <h5 className="font-semibold text-gray-700 mb-1">Area Allocation</h5>
              <div className="space-y-1 rounded bg-gray-50 p-2">
                <DebugRow label="leadHtmlLength" value={String(nc.allocationDebug.leadHtmlLength)} />
                <DebugRow label="rawOrderedNonFaqBlocks" value={formatIndexes(nc.allocationDebug.rawOrderedNonFaqBlockIndexes)} />
                <DebugRow label="introSource" value={nc.allocationDebug.introSource} />
                <DebugRow label="introFallback" value={`${nc.allocationDebug.fallbackRan ? 'ran' : 'skipped'} — ${nc.allocationDebug.fallbackReason}`} />
                <DebugRow label="intro" value={formatIndexes(nc.allocationDebug.allocationLog.intro)} />
                <DebugRow label="why" value={formatIndexes(nc.allocationDebug.allocationLog.why)} />
                <DebugRow label="closing" value={formatIndexes(nc.allocationDebug.allocationLog.closing)} />
                <DebugRow label="allocatedLengths" value={`intro=${nc.allocationDebug.introBodyLength}, why=${nc.allocationDebug.whyBodyLength}, closing=${nc.allocationDebug.closingBodyLength}`} />
              </div>
              {nc.allocationDebug.sectionBlocks.length > 0 && (
                <div className="mt-2 space-y-1">
                  {nc.allocationDebug.sectionBlocks.map((block) => (
                    <div key={block.index} className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1 text-gray-600">
                      <span className="font-medium text-gray-700 w-14">#{block.index}</span>
                      <span>{block.wordCount} words</span>
                      <span className="text-gray-400">class={block.classification}</span>
                      {block.heading && <span className="truncate text-gray-500 max-w-[220px]">H2: {block.heading}</span>}
                      {block.hasImages && <span className="text-blue-500">has image</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section Breakdown (area/practice only) */}
          {stats.sections.length > 0 && (
            <div>
              <h5 className="font-semibold text-gray-700 mb-1">Section Breakdown</h5>
              <div className="space-y-1">
                {stats.sections.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1">
                    <span className={`inline-block w-2 h-2 rounded-full ${s.words > 0 ? 'bg-green-400' : 'bg-gray-300'}`} />
                    <span className="font-medium text-gray-700 w-20">{s.label}</span>
                    <span className="text-gray-500">{s.words} words</span>
                    {s.heading && (
                      <span className="text-gray-400 truncate max-w-[200px]">
                        H2: {s.heading}
                      </span>
                    )}
                    {s.hasImage && (
                      <span className="text-blue-500">has image</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transformation Log */}
          {log.length > 0 && (
            <div>
              <h5 className="font-semibold text-gray-700 mb-1">Pipeline Log ({log.length} entries)</h5>
              <div className="space-y-0.5 max-h-40 overflow-y-auto">
                {log.map((entry, i) => (
                  <div key={i} className="flex items-start gap-2 text-gray-600">
                    <span className={`shrink-0 px-1 py-0.5 rounded text-[10px] font-mono ${
                      entry.stage === 'recipe_rules' ? 'bg-purple-100 text-purple-700' :
                      entry.stage === 'prepare_records' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {entry.stage}
                    </span>
                    {entry.field && (
                      <span className="font-medium text-gray-700">{entry.field}:</span>
                    )}
                    <span className="text-gray-500">{entry.action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center bg-gray-50 rounded px-2 py-1">
      <div className="font-bold text-gray-800">{value}</div>
      <div className="text-gray-500">{label}</div>
    </div>
  );
}

function DebugRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex gap-2">
      <span className="font-medium text-gray-700 min-w-28">{label}:</span>
      <span className="text-gray-500 break-all">{value || '—'}</span>
    </div>
  );
}

function formatIndexes(indexes: number[]): string {
  return indexes.length > 0 ? `[${indexes.join(', ')}]` : '[]';
}

interface SectionInfo {
  label: string;
  words: number;
  heading?: string;
  hasImage: boolean;
}

function computeStats(
  record: TransformedRecord,
  templateType: TemplateType,
  content?: Record<string, unknown>
) {
  let totalWords = 0;
  let sectionCount = 0;
  let faqCount = 0;
  let imageCount = 0;
  const sections: SectionInfo[] = [];

  if (templateType === 'area' && content) {
    const intro = content.introSection as Record<string, unknown> | undefined;
    const why = content.whySection as Record<string, unknown> | undefined;
    const closing = content.closingSection as Record<string, unknown> | undefined;
    const faq = content.faq as { items?: unknown[] } | undefined;

    const introWords = countWords(String(intro?.body ?? ''));
    const whyWords = countWords(String(why?.body ?? ''));
    const closingWords = countWords(String(closing?.body ?? ''));

    totalWords = introWords + whyWords + closingWords;
    sectionCount = [introWords, whyWords, closingWords].filter((w) => w > 0).length;
    faqCount = faq?.items?.length ?? 0;

    sections.push({
      label: 'Intro',
      words: introWords,
      heading: String(intro?.heading ?? ''),
      hasImage: !!intro?.image,
    });
    sections.push({
      label: 'Why',
      words: whyWords,
      heading: String(why?.heading ?? ''),
      hasImage: !!why?.image,
    });
    sections.push({
      label: 'Closing',
      words: closingWords,
      heading: String(closing?.heading ?? ''),
      hasImage: !!closing?.image,
    });

    // Count images across sections
    imageCount = [intro, why, closing].filter((s) => s?.image).length;
  } else if (templateType === 'practice' && content) {
    const cs = (content.contentSections as Record<string, unknown>[]) ?? [];
    const faq = content.faq as { items?: unknown[] } | undefined;

    for (let i = 0; i < cs.length; i++) {
      const words = countWords(String(cs[i].body ?? ''));
      totalWords += words;
      sections.push({
        label: `Section ${i + 1}`,
        words,
        hasImage: !!cs[i].image,
      });
    }
    sectionCount = cs.length;
    faqCount = faq?.items?.length ?? 0;
    imageCount = cs.filter((s) => s.image).length;
  } else {
    // post
    const body = String(record.preparedData.body ?? '');
    totalWords = countWords(body);
    sectionCount = 1;
    const faqItems = record.faqItems ?? [];
    faqCount = faqItems.length;
  }

  return { totalWords, sectionCount, faqCount, imageCount, sections };
}
