import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash2 } from "lucide-react";
import type { AreasWeServePageContent, LocationItem } from "@/lib/cms/areasWeServePageTypes";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ImageUploader from "@/components/admin/ImageUploader";

interface Props {
  content: AreasWeServePageContent;
  onChange: (content: AreasWeServePageContent) => void;
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
  label,
  value,
  level = "2",
  onTextChange,
  onLevelChange,
}: {
  label: string
  value: string
  level?: string
  onTextChange: (v: string) => void
  onLevelChange: (v: string) => void
}) {
  return (
    <div className="space-y-2">
      <Field label={label}>
        <Input value={value} onChange={e => onTextChange(e.target.value)} placeholder="Enter heading text" />
      </Field>
      <Field label="Heading Level">
        <Select value={level} onValueChange={onLevelChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
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
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-7 w-7 text-red-400 hover:text-red-600"
        onClick={onRemove}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
      {children}
    </div>
  );
}

export default function AreasWeServePageFieldEditor({ content, onChange }: Props) {
  const set = <S extends keyof AreasWeServePageContent>(
    section: S,
    updates: Partial<AreasWeServePageContent[S]>
  ) => {
    onChange({ ...content, [section]: { ...content[section], ...updates } });
  };

  // Location Items
  const addLocation = () =>
    set("locationsSection", { items: [...content.locationsSection.items, { name: "", description: "", href: "" }] });
  const removeLocation = (i: number) =>
    set("locationsSection", { items: content.locationsSection.items.filter((_, idx) => idx !== i) });
  const updateLocation = (i: number, k: keyof LocationItem, v: string) => {
    const items = content.locationsSection.items.map((item, idx) =>
      idx === i ? { ...item, [k]: v } : item
    );
    set("locationsSection", { items });
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
                placeholder="Comprehensive Bankruptcy Representation Across Greater Atlanta"
              />
            </Field>
          </SectionGrid>
        </AccordionContent>
      </AccordionItem>

      {/* INTRO SECTION */}
      <AccordionItem value="introSection" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Intro Section</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <HeadingField
            label="Heading"
            value={content.introSection.heading}
            level={String(content.introSection.headingLevel || 2)}
            onTextChange={(v) => set("introSection", { heading: v })}
            onLevelChange={(v) => set("introSection", { headingLevel: Number(v) as 1 | 2 | 3 | 4 })}
          />
          <Field label="Body Content (Rich Text)">
            <RichTextEditor
              value={content.introSection.body}
              onChange={(v) => set("introSection", { body: v })}
              minHeight="200px"
            />
          </Field>
        </AccordionContent>
      </AccordionItem>

      {/* WHY SECTION */}
      <AccordionItem value="whySection" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Why Section</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <HeadingField
            label="Heading"
            value={content.whySection.heading}
            level={String(content.whySection.headingLevel || 2)}
            onTextChange={(v) => set("whySection", { heading: v })}
            onLevelChange={(v) => set("whySection", { headingLevel: Number(v) as 1 | 2 | 3 | 4 })}
          />
          <Field label="Body Content (Rich Text)">
            <RichTextEditor
              value={content.whySection.body}
              onChange={(v) => set("whySection", { body: v })}
              minHeight="200px"
            />
          </Field>
        </AccordionContent>
      </AccordionItem>

      {/* LOCATIONS SECTION */}
      <AccordionItem value="locationsSection" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Locations Section</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <Field label="Heading (H3)">
            <Input
              value={content.locationsSection.heading}
              onChange={(e) =>
                set("locationsSection", { heading: e.target.value })
              }
              placeholder="At Cherney Law Firm LLC, we are proud to serve..."
            />
          </Field>
          <Field label="Intro Text">
            <Textarea
              value={content.locationsSection.introText}
              onChange={(e) =>
                set("locationsSection", { introText: e.target.value })
              }
              placeholder="Intro text before locations list"
              rows={3}
            />
          </Field>

          {/* Location Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Locations
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={addLocation}>
                <Plus className="w-3 h-3 mr-1" /> Add Location
              </Button>
            </div>
            <div className="space-y-3">
              {content.locationsSection.items.map((item, i) => (
                <ArrayCard key={i} onRemove={() => removeLocation(i)}>
                  <Field label="Location Name">
                    <Input
                      value={item.name}
                      onChange={(e) => updateLocation(i, "name", e.target.value)}
                      placeholder="e.g., Atlanta"
                    />
                  </Field>
                  <Field label="Description (Optional)">
                    <Textarea
                      value={item.description || ""}
                      onChange={(e) => updateLocation(i, "description", e.target.value)}
                      placeholder="Optional location description"
                      rows={2}
                    />
                  </Field>
                  <Field label="Link (Optional)">
                    <Input
                      value={item.href || ""}
                      onChange={(e) => updateLocation(i, "href", e.target.value)}
                      placeholder="/atlanta (for future individual location pages)"
                    />
                  </Field>
                </ArrayCard>
              ))}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* CLOSING SECTION */}
      <AccordionItem value="closingSection" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Closing Section</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <HeadingField
            label="Heading"
            value={content.closingSection.heading}
            level={String(content.closingSection.headingLevel || 2)}
            onTextChange={(v) => set("closingSection", { heading: v })}
            onLevelChange={(v) => set("closingSection", { headingLevel: Number(v) as 1 | 2 | 3 | 4 })}
          />
          <Field label="Body Content (Rich Text)">
            <RichTextEditor
              value={content.closingSection.body}
              onChange={(v) => set("closingSection", { body: v })}
              minHeight="200px"
            />
          </Field>
        </AccordionContent>
      </AccordionItem>

      {/* CTA */}
      <AccordionItem value="cta" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Call to Action</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <Field label="Heading">
            <Input
              value={content.cta.heading}
              onChange={(e) => set("cta", { heading: e.target.value })}
              placeholder="Ready to Get Started?"
            />
          </Field>
          <Field label="Description">
            <RichTextEditor
              value={content.cta.description}
              onChange={(v) => set("cta", { description: v })}
              minHeight="100px"
            />
          </Field>
          <Field label="CTA Image (Optional)">
            <ImageUploader
              value={content.cta.image || ""}
              onChange={(v) => set("cta", { image: v })}
              folder="areas-we-serve"
            />
          </Field>
          <Field label="Image Alt Text">
            <Input
              value={content.cta.imageAlt || ""}
              onChange={(e) => set("cta", { imageAlt: e.target.value })}
              placeholder="Descriptive alt text for image"
            />
          </Field>
          <SectionGrid>
            <Field label="Button Text">
              <Input
                value={content.cta.secondaryButton.label}
                onChange={(e) =>
                  set("cta", {
                    secondaryButton: {
                      ...content.cta.secondaryButton,
                      label: e.target.value,
                    },
                  })
                }
                placeholder="Schedule Now"
              />
            </Field>
            <Field label="Button Sublabel">
              <Input
                value={content.cta.secondaryButton.sublabel}
                onChange={(e) =>
                  set("cta", {
                    secondaryButton: {
                      ...content.cta.secondaryButton,
                      sublabel: e.target.value,
                    },
                  })
                }
                placeholder="Free Consultation"
              />
            </Field>
          </SectionGrid>
          <Field label="Button Link">
            <Input
              value={content.cta.secondaryButton.href}
              onChange={(e) =>
                set("cta", {
                  secondaryButton: {
                    ...content.cta.secondaryButton,
                    href: e.target.value,
                  },
                })
              }
              placeholder="/contact"
            />
          </Field>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
