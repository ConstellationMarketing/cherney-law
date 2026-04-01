import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash2 } from "lucide-react";
import type { AreaPageContent, AreaFaqItem } from "@/lib/cms/areaPageTypes";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ImageUploader from "@/components/admin/ImageUploader";

interface Props {
  content: AreaPageContent;
  onChange: (content: AreaPageContent) => void;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{label}</Label>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      {children}
    </div>
  );
}

function HeadingField({
  label, value, level = "2", onTextChange, onLevelChange,
}: {
  label: string; value: string; level?: string;
  onTextChange: (v: string) => void; onLevelChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Field label={label}>
        <Input value={value} onChange={e => onTextChange(e.target.value)} placeholder="Enter heading text" />
      </Field>
      <Field label="Heading Level">
        <Select value={level} onValueChange={onLevelChange}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">H1 - Main Title</SelectItem>
            <SelectItem value="2">H2 - Section Title</SelectItem>
            <SelectItem value="3">H3 - Subsection</SelectItem>
            <SelectItem value="4">H4 - Minor Heading</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}

function SectionGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function ArrayCard({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <div className="border rounded-lg p-4 bg-gray-50 relative space-y-3">
      <Button type="button" variant="ghost" size="icon"
        className="absolute top-2 right-2 h-7 w-7 text-red-400 hover:text-red-600"
        onClick={onRemove}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
      {children}
    </div>
  );
}

/** Reusable text section editor with optional full-width image */
function TextSectionEditor({
  sectionKey, label, content, onChange,
}: {
  sectionKey: string; label: string;
  content: AreaPageContent['introSection'];
  onChange: (updates: Partial<AreaPageContent['introSection']>) => void;
}) {
  return (
    <AccordionItem value={sectionKey} className="border rounded-lg px-4">
      <AccordionTrigger className="text-sm font-semibold">{label}</AccordionTrigger>
      <AccordionContent className="space-y-4 pb-4">
        <HeadingField
          label="Heading"
          value={content.heading}
          level={String(content.headingLevel || 2)}
          onTextChange={(v) => onChange({ heading: v })}
          onLevelChange={(v) => onChange({ headingLevel: Number(v) as 1 | 2 | 3 | 4 })}
        />
        <Field label="Body Content (Rich Text)">
          <RichTextEditor
            value={content.body}
            onChange={(v) => onChange({ body: v })}
            minHeight="200px"
          />
        </Field>
        <Field label="Section Image (Optional)" hint="If provided, displays full-width below this section">
          <ImageUploader
            value={content.image || ""}
            onChange={(v) => onChange({ image: v })}
            folder="area-pages"
          />
        </Field>
        {content.image && (
          <Field label="Image Alt Text">
            <Input
              value={content.imageAlt || ""}
              onChange={(e) => onChange({ imageAlt: e.target.value })}
              placeholder="Descriptive alt text for image"
            />
          </Field>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

export default function AreaPageFieldEditor({ content, onChange }: Props) {
  const set = <S extends keyof AreaPageContent>(
    section: S,
    updates: Partial<AreaPageContent[S]>
  ) => {
    onChange({ ...content, [section]: { ...content[section], ...updates } });
  };

  const addFaqItem = () =>
    set("faq", { items: [...(content.faq?.items ?? []), { question: '', answer: '' }] });
  const removeFaqItem = (i: number) =>
    set("faq", { items: (content.faq?.items ?? []).filter((_, idx) => idx !== i) });
  const updateFaqItem = (i: number, k: keyof AreaFaqItem, v: string) => {
    const items = (content.faq?.items ?? []).map((item, idx) =>
      idx === i ? { ...item, [k]: v } : item
    );
    set("faq", { items });
  };

  return (
    <Accordion type="multiple" defaultValue={["hero"]} className="space-y-2">
      {/* HERO */}
      <AccordionItem value="hero" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Hero Section</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <SectionGrid>
            <Field label="Section Label">
              <Input
                value={content.hero.sectionLabel}
                onChange={(e) => set("hero", { sectionLabel: e.target.value })}
                placeholder="– Areas We Serve"
              />
            </Field>
            <Field label="Tagline">
              <Input
                value={content.hero.tagline}
                onChange={(e) => set("hero", { tagline: e.target.value })}
                placeholder="Comprehensive Bankruptcy Representation"
              />
            </Field>
          </SectionGrid>
        </AccordionContent>
      </AccordionItem>

      {/* INTRO SECTION */}
      <TextSectionEditor
        sectionKey="introSection"
        label="Intro Section"
        content={content.introSection}
        onChange={(updates) => set("introSection", updates)}
      />

      {/* WHY SECTION */}
      <TextSectionEditor
        sectionKey="whySection"
        label="Why Section"
        content={content.whySection}
        onChange={(updates) => set("whySection", updates)}
      />

      {/* CLOSING SECTION */}
      <TextSectionEditor
        sectionKey="closingSection"
        label="Closing Section"
        content={content.closingSection}
        onChange={(updates) => set("closingSection", updates)}
      />

      {/* FAQ SECTION */}
      <AccordionItem value="faq" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">FAQ Section</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <div className="flex items-center gap-3">
            <Switch
              checked={content.faq?.enabled ?? true}
              onCheckedChange={(v) => set("faq", { enabled: v })}
            />
            <Label className="text-sm">Enable FAQ Section</Label>
          </div>
          <Field label="Section Heading">
            <Input
              value={content.faq?.heading ?? 'Frequently Asked Questions'}
              onChange={(e) => set("faq", { heading: e.target.value })}
              placeholder="Frequently Asked Questions"
            />
          </Field>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">FAQ Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addFaqItem}>
                <Plus className="w-3 h-3 mr-1" /> Add Question
              </Button>
            </div>
            <div className="space-y-3">
              {(content.faq?.items ?? []).map((item, i) => (
                <ArrayCard key={i} onRemove={() => removeFaqItem(i)}>
                  <Field label="Question">
                    <Input
                      value={item.question}
                      onChange={(e) => updateFaqItem(i, 'question', e.target.value)}
                      placeholder="e.g., How does bankruptcy work?"
                    />
                  </Field>
                  <Field label="Answer">
                    <RichTextEditor
                      value={item.answer}
                      onChange={(v) => updateFaqItem(i, 'answer', v)}
                      minHeight="120px"
                    />
                  </Field>
                </ArrayCard>
              ))}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* CTA — Global (managed from hub page) */}
      <AccordionItem value="cta" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Call to Action (Global)</AccordionTrigger>
        <AccordionContent className="pb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-semibold mb-1">This section is managed globally.</p>
            <p>
              The sidebar CTA (image, heading, description, button) shown on all area pages is sourced from the{" "}
              <a href="/admin/pages" className="underline font-medium hover:text-blue-900">
                Areas We Serve hub page
              </a>
              . Edit it there and the change will apply to every area page automatically.
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* LOCATIONS SECTION — Global (managed from hub page) */}
      <AccordionItem value="locationsSection" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Locations Section (Global)</AccordionTrigger>
        <AccordionContent className="pb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-semibold mb-1">This section is managed globally.</p>
            <p>
              The locations grid shown on all area pages is sourced from the{" "}
              <a href="/admin/pages" className="underline font-medium hover:text-blue-900">
                Areas We Serve hub page
              </a>
              . Edit it there and the change will apply to every area page automatically.
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* MAP SECTION */}
      <AccordionItem value="mapSection" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Map Section (Full Width)</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <Field label="Heading (Optional)">
            <Input
              value={content.mapSection.heading || ""}
              onChange={(e) => set("mapSection", { heading: e.target.value })}
              placeholder="Our Service Area"
            />
          </Field>
          <Field label="Google Maps Embed URL" hint="Paste the src URL from a Google Maps embed iframe">
            <Input
              value={content.mapSection.embedUrl}
              onChange={(e) => set("mapSection", { embedUrl: e.target.value })}
              placeholder="https://www.google.com/maps/embed?pb=..."
            />
          </Field>
          {content.mapSection.embedUrl && (
            <div className="border rounded overflow-hidden">
              <iframe
                src={content.mapSection.embedUrl}
                width="100%"
                height="200"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Map preview"
              />
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
