import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash2 } from "lucide-react";
import type { PracticeAreasPageContent } from "@/lib/pageContentTypes";
import ImageUploader from "@/components/admin/ImageUploader";
import RichTextEditor from "@/components/admin/RichTextEditor";

interface Props {
  content: PracticeAreasPageContent;
  onChange: (content: PracticeAreasPageContent) => void;
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

function SectionGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function ArrayCard({ children, onRemove, title }: { children: React.ReactNode; onRemove: () => void; title?: string }) {
  return (
    <div className="border rounded-lg p-4 bg-gray-50 relative space-y-3">
      {title && <p className="text-xs font-semibold text-gray-500 uppercase pr-8">{title}</p>}
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

export default function PracticeAreasPageFieldEditor({ content, onChange }: Props) {
  const set = <S extends keyof PracticeAreasPageContent>(section: S, updates: Partial<PracticeAreasPageContent[S]>) => {
    onChange({ ...content, [section]: { ...content[section], ...updates } });
  };

  // Tabs
  const addTab = () =>
    onChange({ ...content, tabs: [...content.tabs, { tabLabel: "", heading: "", content: "", image: "", imageAlt: "" }] });
  const removeTab = (i: number) =>
    onChange({ ...content, tabs: content.tabs.filter((_, idx) => idx !== i) });
  const updateTab = (i: number, k: string, v: string) => {
    const tabs = content.tabs.map((t, idx) => (idx === i ? { ...t, [k]: v } : t));
    onChange({ ...content, tabs });
  };

  // Grid areas
  const addArea = () =>
    set("grid", { areas: [...content.grid.areas, { title: "", description: "", icon: "", href: "" }] });
  const removeArea = (i: number) =>
    set("grid", { areas: content.grid.areas.filter((_, idx) => idx !== i) });
  const updateArea = (i: number, k: string, v: string) => {
    const areas = content.grid.areas.map((a, idx) => (idx === i ? { ...a, [k]: v } : a));
    set("grid", { areas });
  };

  // FAQ items
  const addFaq = () =>
    set("faq", { items: [...content.faq.items, { question: "", answer: "" }] });
  const removeFaq = (i: number) =>
    set("faq", { items: content.faq.items.filter((_, idx) => idx !== i) });
  const updateFaq = (i: number, k: string, v: string) => {
    const items = content.faq.items.map((f, idx) => (idx === i ? { ...f, [k]: v } : f));
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
              <Input value={content.hero.sectionLabel} onChange={e => set("hero", { sectionLabel: e.target.value })} placeholder="PRACTICE AREAS" />
            </Field>
            <Field label="Tagline">
              <Input value={content.hero.tagline} onChange={e => set("hero", { tagline: e.target.value })} />
            </Field>
          </SectionGrid>
          <Field label="Subtext">
            <Textarea value={content.hero.subtext} onChange={e => set("hero", { subtext: e.target.value })} rows={2} />
          </Field>
        </AccordionContent>
      </AccordionItem>

      {/* TABS */}
      <AccordionItem value="tabs" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Content Tabs</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={addTab}>
              <Plus className="w-3 h-3 mr-1" /> Add Tab
            </Button>
          </div>
          {content.tabs.map((tab, i) => (
            <ArrayCard key={i} onRemove={() => removeTab(i)} title={tab.tabLabel || `Tab ${i + 1}`}>
              <SectionGrid>
                <Field label="Tab Label">
                  <Input value={tab.tabLabel} onChange={e => updateTab(i, "tabLabel", e.target.value)} placeholder="Car Accidents" />
                </Field>
                <Field label="Heading">
                  <Input value={tab.heading} onChange={e => updateTab(i, "heading", e.target.value)} />
                </Field>
              </SectionGrid>
              <Field label="Content">
                <RichTextEditor value={tab.content} onChange={v => updateTab(i, "content", v)} minHeight="120px" />
              </Field>
              <Field label="Tab Image">
                <ImageUploader value={tab.image || ""} onChange={v => updateTab(i, "image", v)} folder="practice-areas" />
              </Field>
              <Field label="Image Alt Text">
                <Input value={tab.imageAlt || ""} onChange={e => updateTab(i, "imageAlt", e.target.value)} />
              </Field>
            </ArrayCard>
          ))}
        </AccordionContent>
      </AccordionItem>

      {/* GRID */}
      <AccordionItem value="grid" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Practice Areas Grid</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <SectionGrid>
            <Field label="Heading">
              <Input value={content.grid.heading} onChange={e => set("grid", { heading: e.target.value })} />
            </Field>
            <div />
          </SectionGrid>
          <Field label="Description">
            <Textarea value={content.grid.description} onChange={e => set("grid", { description: e.target.value })} rows={2} />
          </Field>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Practice Area Cards</Label>
              <Button type="button" variant="outline" size="sm" onClick={addArea}>
                <Plus className="w-3 h-3 mr-1" /> Add Area
              </Button>
            </div>
            {content.grid.areas.map((area, i) => (
              <ArrayCard key={i} onRemove={() => removeArea(i)}>
                <SectionGrid>
                  <Field label="Title">
                    <Input value={area.title} onChange={e => updateArea(i, "title", e.target.value)} />
                  </Field>
                  <Field label="Icon">
                    <Input value={area.icon || ""} onChange={e => updateArea(i, "icon", e.target.value)} />
                  </Field>
                </SectionGrid>
                <Field label="Link (href)">
                  <Input value={area.href || ""} onChange={e => updateArea(i, "href", e.target.value)} placeholder="/practice-areas/car-accidents" />
                </Field>
                <Field label="Description">
                  <Textarea value={area.description} onChange={e => updateArea(i, "description", e.target.value)} rows={2} />
                </Field>
                <Field label="Background Image">
                  <ImageUploader value={area.image || ""} onChange={v => updateArea(i, "image", v)} folder="practice-areas" />
                </Field>
              </ArrayCard>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* CTA */}
      <AccordionItem value="cta" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Call to Action</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <Field label="Heading">
            <Input value={content.cta.heading} onChange={e => set("cta", { heading: e.target.value })} />
          </Field>
          <Field label="Content">
            <RichTextEditor value={content.cta.content} onChange={v => set("cta", { content: v })} />
          </Field>
          <SectionGrid>
            <Field label="Button Label">
              <Input value={content.cta.buttonLabel} onChange={e => set("cta", { buttonLabel: e.target.value })} />
            </Field>
            <Field label="Button Link">
              <Input value={content.cta.buttonLink} onChange={e => set("cta", { buttonLink: e.target.value })} placeholder="/contact" />
            </Field>
          </SectionGrid>
        </AccordionContent>
      </AccordionItem>

      {/* FAQ */}
      <AccordionItem value="faq" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">FAQ Section</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <Field label="Section Heading">
            <Input value={content.faq.heading} onChange={e => set("faq", { heading: e.target.value })} />
          </Field>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">FAQ Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addFaq}>
                <Plus className="w-3 h-3 mr-1" /> Add FAQ
              </Button>
            </div>
            {content.faq.items.map((item, i) => (
              <ArrayCard key={i} onRemove={() => removeFaq(i)}>
                <Field label="Question">
                  <Input value={item.question} onChange={e => updateFaq(i, "question", e.target.value)} />
                </Field>
                <Field label="Answer">
                  <RichTextEditor value={item.answer} onChange={v => updateFaq(i, "answer", v)} minHeight="80px" />
                </Field>
              </ArrayCard>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

    </Accordion>
  );
}
