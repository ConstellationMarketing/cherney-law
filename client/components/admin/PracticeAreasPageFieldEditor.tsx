import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash2 } from "lucide-react";
import type { PracticeAreasPageContent } from "@site/lib/cms/practiceAreasPageTypes";
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

  const addTab = () =>
    onChange({ ...content, tabs: [...content.tabs, { title: "", content: "" }] });
  const removeTab = (index: number) =>
    onChange({ ...content, tabs: content.tabs.filter((_, currentIndex) => currentIndex !== index) });
  const updateTab = (index: number, patch: Partial<PracticeAreasPageContent["tabs"][number]>) => {
    const tabs = content.tabs.map((tab, currentIndex) => (currentIndex === index ? { ...tab, ...patch } : tab));
    onChange({ ...content, tabs });
  };

  const addArea = () =>
    set("grid", {
      areas: [...content.grid.areas, { title: "", description: "", icon: "", image: "", link: "" }],
    });
  const removeArea = (index: number) =>
    set("grid", { areas: content.grid.areas.filter((_, currentIndex) => currentIndex !== index) });
  const updateArea = (index: number, patch: Partial<PracticeAreasPageContent["grid"]["areas"][number]>) => {
    const areas = content.grid.areas.map((area, currentIndex) => (currentIndex === index ? { ...area, ...patch } : area));
    set("grid", { areas });
  };

  const addFaq = () =>
    set("faq", { items: [...content.faq.items, { question: "", answer: "" }] });
  const removeFaq = (index: number) =>
    set("faq", { items: content.faq.items.filter((_, currentIndex) => currentIndex !== index) });
  const updateFaq = (index: number, patch: Partial<PracticeAreasPageContent["faq"]["items"][number]>) => {
    const items = content.faq.items.map((item, currentIndex) => (currentIndex === index ? { ...item, ...patch } : item));
    set("faq", { items });
  };

  return (
    <Accordion type="multiple" defaultValue={["hero"]} className="space-y-2">
      <AccordionItem value="hero" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Hero Section</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <SectionGrid>
            <Field label="Section Label">
              <Input value={content.hero.sectionLabel} onChange={(event) => set("hero", { sectionLabel: event.target.value })} placeholder="– Practice Areas" />
            </Field>
            <Field label="Tagline">
              <Input value={content.hero.tagline} onChange={(event) => set("hero", { tagline: event.target.value })} />
            </Field>
          </SectionGrid>
          <Field label="Subtext">
            <Textarea value={content.hero.subtext} onChange={(event) => set("hero", { subtext: event.target.value })} rows={3} />
          </Field>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="tabs" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Content Tabs</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={addTab}>
              <Plus className="w-3 h-3 mr-1" /> Add Tab
            </Button>
          </div>
          {content.tabs.map((tab, index) => (
            <ArrayCard key={index} onRemove={() => removeTab(index)} title={tab.title || `Tab ${index + 1}`}>
              <Field label="Title">
                <Input value={tab.title} onChange={(event) => updateTab(index, { title: event.target.value })} placeholder="What Is Bankruptcy?" />
              </Field>
              <Field label="Content">
                <RichTextEditor value={tab.content} onChange={(value) => updateTab(index, { content: value })} minHeight="120px" />
              </Field>
            </ArrayCard>
          ))}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="grid" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Practice Areas Grid</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <SectionGrid>
            <Field label="Heading">
              <Input value={content.grid.heading} onChange={(event) => set("grid", { heading: event.target.value })} />
            </Field>
            <div />
          </SectionGrid>
          <Field label="Description">
            <Textarea value={content.grid.description} onChange={(event) => set("grid", { description: event.target.value })} rows={2} />
          </Field>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Practice Area Cards</Label>
              <Button type="button" variant="outline" size="sm" onClick={addArea}>
                <Plus className="w-3 h-3 mr-1" /> Add Area
              </Button>
            </div>
            {content.grid.areas.map((area, index) => (
              <ArrayCard key={index} onRemove={() => removeArea(index)} title={area.title || `Area ${index + 1}`}>
                <SectionGrid>
                  <Field label="Title">
                    <Input value={area.title} onChange={(event) => updateArea(index, { title: event.target.value })} />
                  </Field>
                  <Field label="Icon">
                    <Input value={area.icon || ""} onChange={(event) => updateArea(index, { icon: event.target.value })} />
                  </Field>
                </SectionGrid>
                <Field label="Link">
                  <Input value={area.link || ""} onChange={(event) => updateArea(index, { link: event.target.value })} placeholder="/practice-areas/car-accidents" />
                </Field>
                <Field label="Description">
                  <Textarea value={area.description} onChange={(event) => updateArea(index, { description: event.target.value })} rows={2} />
                </Field>
                <Field label="Background Image">
                  <ImageUploader value={area.image || ""} onChange={(value) => updateArea(index, { image: value })} folder="practice-areas" />
                </Field>
              </ArrayCard>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="cta" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Call to Action</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <Field label="Heading">
            <Input value={content.cta.heading} onChange={(event) => set("cta", { heading: event.target.value })} />
          </Field>
          <Field label="Content">
            <RichTextEditor value={content.cta.content} onChange={(value) => set("cta", { content: value })} />
          </Field>
          <SectionGrid>
            <Field label="Button Label">
              <Input value={content.cta.buttonLabel} onChange={(event) => set("cta", { buttonLabel: event.target.value })} />
            </Field>
            <Field label="Button Link">
              <Input value={content.cta.buttonLink} onChange={(event) => set("cta", { buttonLink: event.target.value })} placeholder="/contact/" />
            </Field>
          </SectionGrid>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="faq" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">FAQ Section</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <Field label="Section Heading">
            <Input value={content.faq.heading} onChange={(event) => set("faq", { heading: event.target.value })} />
          </Field>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">FAQ Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addFaq}>
                <Plus className="w-3 h-3 mr-1" /> Add FAQ
              </Button>
            </div>
            {content.faq.items.map((item, index) => (
              <ArrayCard key={index} onRemove={() => removeFaq(index)} title={item.question || `FAQ ${index + 1}`}>
                <Field label="Question">
                  <Input value={item.question} onChange={(event) => updateFaq(index, { question: event.target.value })} />
                </Field>
                <Field label="Answer">
                  <RichTextEditor value={item.answer} onChange={(value) => updateFaq(index, { answer: value })} minHeight="80px" />
                </Field>
              </ArrayCard>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
