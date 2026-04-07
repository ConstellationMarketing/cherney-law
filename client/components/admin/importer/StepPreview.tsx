import { useMemo, useState } from 'react';
import type { WizardState } from '@site/lib/importer/recipeTypes';
import type { TransformedRecord, TemplateType } from '@site/lib/importer/types';
import ImportDebugPanel from './ImportDebugPanel';

interface Props {
  state: WizardState;
  updateState: (u: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

// ─── Helper: strip HTML tags to plain text ───────────────────────────────────

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen).trimEnd() + '…';
}

// ─── Section type helpers ────────────────────────────────────────────────────

interface SectionPreview {
  label: string;
  heading?: string;
  bodyPreview?: string;
  note?: string;
  empty: boolean;
  itemCount?: number;
  firstItem?: string;
}

function getAreaSections(content: Record<string, unknown>): SectionPreview[] {
  const hero = content.hero as Record<string, unknown> | undefined;
  const intro = content.introSection as Record<string, unknown> | undefined;
  const why = content.whySection as Record<string, unknown> | undefined;
  const closing = content.closingSection as Record<string, unknown> | undefined;
  const faq = content.faq as { enabled?: boolean; items?: { question: string }[] } | undefined;

  const sections: SectionPreview[] = [];

  // Hero
  sections.push({
    label: 'Hero',
    heading: String(hero?.sectionLabel ?? hero?.tagline ?? ''),
    empty: !hero?.sectionLabel && !hero?.tagline,
  });

  // Intro
  const introBody = stripTags(String(intro?.body ?? ''));
  sections.push({
    label: 'Intro',
    heading: String(intro?.heading ?? ''),
    bodyPreview: truncate(introBody, 300),
    empty: !introBody,
  });

  // Why
  const whyBody = stripTags(String(why?.body ?? ''));
  sections.push({
    label: 'Why',
    heading: String(why?.heading ?? ''),
    bodyPreview: whyBody ? truncate(whyBody, 200) : undefined,
    empty: !whyBody,
  });

  // Closing
  const closingBody = stripTags(String(closing?.body ?? ''));
  sections.push({
    label: 'Closing',
    heading: String(closing?.heading ?? ''),
    bodyPreview: closingBody ? truncate(closingBody, 200) : undefined,
    empty: !closingBody,
  });

  // FAQ
  const faqItems = faq?.items ?? [];
  sections.push({
    label: 'FAQ',
    itemCount: faqItems.length,
    firstItem: faqItems[0]?.question,
    empty: !faqItems.length,
  });

  return sections;
}

function getPracticeSections(content: Record<string, unknown>): SectionPreview[] {
  const hero = content.hero as Record<string, unknown> | undefined;
  const contentSections = content.contentSections as Record<string, unknown>[] | undefined;
  const faq = content.faq as { enabled?: boolean; items?: { question: string }[] } | undefined;

  const sections: SectionPreview[] = [];

  // Hero
  sections.push({
    label: 'Hero',
    heading: String(hero?.tagline ?? ''),
    empty: !hero?.tagline,
  });

  // Content Sections
  const cs = contentSections ?? [];
  if (cs.length === 0) {
    sections.push({ label: 'Content', empty: true });
  } else {
    cs.slice(0, 3).forEach((s, i) => {
      const body = stripTags(String(s.body ?? ''));
      sections.push({
        label: `Content ${i + 1}`,
        bodyPreview: truncate(body, 200),
        empty: !body,
      });
    });
    if (cs.length > 3) {
      sections.push({ label: `+${cs.length - 3} more sections`, empty: false });
    }
  }

  // FAQ
  const faqItems = faq?.items ?? [];
  sections.push({
    label: 'FAQ',
    itemCount: faqItems.length,
    firstItem: faqItems[0]?.question,
    empty: !faqItems.length,
  });

  return sections;
}

function getPostSections(preparedData: Record<string, unknown>): SectionPreview[] {
  const body = stripTags(String(preparedData.body ?? ''));
  const excerpt = String(preparedData.excerpt ?? '');
  const excerptSource = String(preparedData.excerpt_source ?? '');
  const status = String(preparedData.status ?? 'draft');
  const publishedAt = String(preparedData.published_at ?? '');
  const categoryName = String(preparedData.category_name ?? '');
  const categorySlug = String(preparedData.category_slug ?? '');

  return [
    {
      label: 'Status',
      heading: status || 'draft',
      note: publishedAt
        ? `Publish date: ${publishedAt}`
        : status === 'published'
          ? 'Publish date will default to import time'
          : 'No publish date provided',
      empty: false,
    },
    {
      label: 'Category',
      heading: categoryName || categorySlug || undefined,
      note: categoryName && categorySlug ? `Slug: ${categorySlug}` : undefined,
      empty: !categoryName && !categorySlug,
    },
    {
      label: excerptSource === 'mapped' ? 'Excerpt (Source)' : 'Excerpt',
      bodyPreview: excerpt ? truncate(excerpt, 200) : undefined,
      note: excerpt
        ? excerptSource === 'mapped'
          ? 'Using source excerpt'
          : 'Generated fallback excerpt'
        : undefined,
      empty: !excerpt,
    },
    {
      label: 'Body',
      bodyPreview: body ? truncate(body, 300) : undefined,
      empty: !body,
    },
  ];
}

// ─── ContentPreviewCard ───────────────────────────────────────────────────────

interface ContentPreviewCardProps {
  record: TransformedRecord;
  templateType: TemplateType;
}

function ContentPreviewCard({ record, templateType }: ContentPreviewCardProps) {
  const [expanded, setExpanded] = useState(false);

  const title = String(record.preparedData.title ?? record.normalizedContent?.chosenTitle ?? '');
  const slug = record.slug;

  const content = record.preparedData.content as Record<string, unknown> | undefined;

  const sections: SectionPreview[] = useMemo(() => {
    if (templateType === 'area' && content) return getAreaSections(content);
    if (templateType === 'practice' && content) return getPracticeSections(content);
    return getPostSections(record.preparedData);
  }, [templateType, content, record.preparedData]);

  function sectionBorderClass(s: SectionPreview): string {
    if (s.empty) return 'border-dashed border-gray-300 bg-gray-50';
    const hasContent = s.bodyPreview || s.itemCount || s.heading;
    if (hasContent && (s.bodyPreview?.length ?? 0) < 60 && !s.itemCount) {
      return 'border-yellow-300 bg-yellow-50';
    }
    return 'border-green-300 bg-green-50';
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Card header */}
      <button
        className="w-full flex items-start justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
          <p className="text-xs text-gray-500 font-mono truncate mt-0.5">{slug}</p>
        </div>
        <span className="text-gray-400 text-xs ml-3 mt-0.5 shrink-0">
          {expanded ? '▲ hide' : '▼ preview'}
        </span>
      </button>

      {/* Sections grid */}
      {expanded && (
        <>
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white">
            {sections.map((s, i) => (
              <div
                key={i}
                className={`border rounded p-2 text-xs ${sectionBorderClass(s)}`}
              >
                <p className="font-semibold text-gray-700 mb-1">{s.label}</p>
                {s.empty ? (
                  <p className="text-gray-400 italic">Empty — not imported</p>
                ) : (
                  <>
                    {s.heading && (
                      <p className="text-gray-800 font-medium mb-1 truncate">{s.heading}</p>
                    )}
                    {s.bodyPreview && (
                      <p className="text-gray-600 leading-snug">{s.bodyPreview}</p>
                    )}
                    {s.note && (
                      <p className="text-gray-500 mt-1 leading-snug">{s.note}</p>
                    )}
                    {s.itemCount !== undefined && (
                      <p className="text-gray-700">
                        {s.itemCount} item{s.itemCount !== 1 ? 's' : ''}
                        {s.firstItem && (
                          <span className="text-gray-500"> — {truncate(s.firstItem, 80)}</span>
                        )}
                      </p>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
          <ImportDebugPanel record={record} templateType={templateType} />
        </>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StepPreview({ state, updateState, onNext, onBack }: Props) {
  const importReady = useMemo(
    () => state.transformedRecords.filter((r) => r.status === 'approved'),
    [state.transformedRecords]
  );

  const skipped = state.transformedRecords.filter((r) => r.status === 'skipped').length;
  const excluded = state.transformedRecords.filter((r) => r.status === 'excluded' as string).length;

  // Pick up to 3 random sample records (skip the Build Recipe sample page)
  const sampleRecords = useMemo(() => {
    const chosenSampleIndex = state.sampleRowIndex ?? 0;
    const pool = importReady.filter((r) => r.rowIndex !== chosenSampleIndex);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(3, shuffled.length));
  }, [importReady]);

  function handleExclude(rowIndex: number) {
    const updated = state.transformedRecords.map((r) =>
      r.rowIndex === rowIndex ? { ...r, status: 'skipped' as const } : r
    );
    updateState({ transformedRecords: updated });
  }

  const templateLabel =
    state.templateType === 'practice'
      ? 'practice area page(s)'
      : state.templateType === 'area'
      ? 'area page(s)'
      : 'blog post(s)';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
        <p className="text-sm text-gray-500 mt-1">
          Final review before import.{' '}
          <span className="font-medium text-gray-700">{importReady.length}</span> record(s) will be imported.
          {skipped > 0 && (
            <span className="ml-1 text-gray-400">{skipped} skipped.</span>
          )}
          {excluded > 0 && (
            <span className="ml-1 text-orange-500">{excluded} excluded by you.</span>
          )}
        </p>
      </div>

      {/* Content sample cards */}
      {sampleRecords.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">
            Content Sample ({sampleRecords.length} of {importReady.length} page{importReady.length !== 1 ? 's' : ''})
          </h3>
          <p className="text-xs text-gray-500">
            Click a card to expand and verify sections before importing.
          </p>
          {sampleRecords.map((record) => (
            <ContentPreviewCard
              key={record.rowIndex}
              record={record}
              templateType={state.templateType}
            />
          ))}
        </div>
      )}

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500">#</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Title</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Slug</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Status</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Confidence</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Issues</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Exclude</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {importReady.map((record) => {
              const title = String(record.preparedData.title ?? record.normalizedContent?.chosenTitle ?? '');
              const cmsStatus = String(record.preparedData.status ?? 'draft');
              return (
                <tr key={record.rowIndex} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-400">{record.rowIndex + 1}</td>
                  <td className="px-3 py-2 text-gray-900 font-medium max-w-[200px] truncate">{title}</td>
                  <td className="px-3 py-2 text-gray-600 font-mono max-w-[220px] truncate">{record.slug}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
                      Ready · {cmsStatus}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-xs font-medium ${
                      record.confidence.overall >= 0.8 ? 'text-green-600' :
                      record.confidence.overall >= 0.5 ? 'text-yellow-600' : 'text-red-500'
                    }`}>
                      {Math.round(record.confidence.overall * 100)}%
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-500">
                    {record.validation.warningCount > 0 && (
                      <span className="text-yellow-600">{record.validation.warningCount}w</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => handleExclude(record.rowIndex)}
                      title="Exclude from import"
                      className="text-gray-400 hover:text-red-500 transition-colors text-base leading-none font-bold"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
            {importReady.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-400">
                  All records have been excluded. Go back to adjust.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
        Clicking "Start Import" will import {importReady.length} {templateLabel} using each record&apos;s mapped CMS status.
        Records will be sent to the server in batches of 15.
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium">Back</button>
        <button
          onClick={onNext}
          disabled={importReady.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Import
        </button>
      </div>
    </div>
  );
}
