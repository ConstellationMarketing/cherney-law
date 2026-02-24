import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash2 } from "lucide-react";
import type { AboutPageContent } from "@/lib/pageContentTypes";
import ImageUploader from "@/components/admin/ImageUploader";
import RichTextEditor from "@/components/admin/RichTextEditor";

interface Props {
  content: AboutPageContent;
  onChange: (content: AboutPageContent) => void;
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

export default function AboutPageFieldEditor({ content, onChange }: Props) {
  const set = <S extends keyof AboutPageContent>(section: S, updates: Partial<AboutPageContent[S]>) => {
    onChange({ ...content, [section]: { ...content[section], ...updates } });
  };

  // Story badges
  const addBadge = () =>
    set("story", { badges: [...content.story.badges, { image: "", alt: "" }] });
  const removeBadge = (i: number) =>
    set("story", { badges: content.story.badges.filter((_, idx) => idx !== i) });
  const updateBadge = (i: number, k: string, v: string) => {
    const badges = content.story.badges.map((b, idx) => (idx === i ? { ...b, [k]: v } : b));
    set("story", { badges });
  };

  // Feature boxes
  const addFeatureBox = () =>
    onChange({ ...content, featureBoxes: [...content.featureBoxes, { icon: "", title: "", description: "" }] });
  const removeFeatureBox = (i: number) =>
    onChange({ ...content, featureBoxes: content.featureBoxes.filter((_, idx) => idx !== i) });
  const updateFeatureBox = (i: number, k: string, v: string) => {
    const boxes = content.featureBoxes.map((b, idx) => (idx === i ? { ...b, [k]: v } : b));
    onChange({ ...content, featureBoxes: boxes });
  };

  // Stats
  const addStat = () =>
    set("stats", { stats: [...content.stats.stats, { value: "", label: "" }] });
  const removeStat = (i: number) =>
    set("stats", { stats: content.stats.stats.filter((_, idx) => idx !== i) });
  const updateStat = (i: number, k: string, v: string) => {
    const stats = content.stats.stats.map((s, idx) => (idx === i ? { ...s, [k]: v } : s));
    set("stats", { stats });
  };

  // Why Choose Us items
  const addWhyItem = () =>
    set("whyChooseUs", { items: [...content.whyChooseUs.items, { icon: "", title: "", description: "" }] });
  const removeWhyItem = (i: number) =>
    set("whyChooseUs", { items: content.whyChooseUs.items.filter((_, idx) => idx !== i) });
  const updateWhyItem = (i: number, k: string, v: string) => {
    const items = content.whyChooseUs.items.map((item, idx) => (idx === i ? { ...item, [k]: v } : item));
    set("whyChooseUs", { items });
  };

  return (
    <Accordion type="multiple" defaultValue={["hero"]} className="space-y-2">

      {/* HERO */}
      <AccordionItem value="hero" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Hero Section</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <SectionGrid>
            <Field label="Section Label">
              <Input value={content.hero.sectionLabel} onChange={e => set("hero", { sectionLabel: e.target.value })} placeholder="ABOUT US" />
            </Field>
            <Field label="Tagline">
              <Input value={content.hero.tagline} onChange={e => set("hero", { tagline: e.target.value })} />
            </Field>
          </SectionGrid>
        </AccordionContent>
      </AccordionItem>

      {/* STORY */}
      <AccordionItem value="story" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Our Story</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <SectionGrid>
            <Field label="Section Label">
              <Input value={content.story.sectionLabel} onChange={e => set("story", { sectionLabel: e.target.value })} />
            </Field>
            <Field label="Heading">
              <Input value={content.story.heading} onChange={e => set("story", { heading: e.target.value })} />
            </Field>
          </SectionGrid>
          <Field label="Left Column Content">
            <RichTextEditor value={content.story.leftContent} onChange={v => set("story", { leftContent: v })} minHeight="150px" />
          </Field>
          <Field label="Right Column Content">
            <RichTextEditor value={content.story.rightContent} onChange={v => set("story", { rightContent: v })} minHeight="150px" />
          </Field>
          <Field label="Story Image">
            <ImageUploader value={content.story.image} onChange={v => set("story", { image: v })} folder="about" />
          </Field>
          <Field label="Image Alt Text">
            <Input value={content.story.imageAlt} onChange={e => set("story", { imageAlt: e.target.value })} />
          </Field>

          {/* Badges */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Award / Credential Badges</Label>
              <Button type="button" variant="outline" size="sm" onClick={addBadge}>
                <Plus className="w-3 h-3 mr-1" /> Add Badge
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {content.story.badges.map((badge, i) => (
                <ArrayCard key={i} onRemove={() => removeBadge(i)}>
                  <Field label="Badge Image">
                    <ImageUploader value={badge.image} onChange={v => updateBadge(i, "image", v)} folder="badges" />
                  </Field>
                  <Field label="Alt Text">
                    <Input value={badge.alt} onChange={e => updateBadge(i, "alt", e.target.value)} />
                  </Field>
                </ArrayCard>
              ))}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* MISSION & VISION */}
      <AccordionItem value="missionVision" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Mission & Vision</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mission</p>
            <Field label="Heading">
              <Input value={content.missionVision.mission.heading} onChange={e => set("missionVision", { mission: { ...content.missionVision.mission, heading: e.target.value } })} />
            </Field>
            <Field label="Text">
              <RichTextEditor value={content.missionVision.mission.text} onChange={v => set("missionVision", { mission: { ...content.missionVision.mission, text: v } })} />
            </Field>
          </div>
          <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vision</p>
            <Field label="Heading">
              <Input value={content.missionVision.vision.heading} onChange={e => set("missionVision", { vision: { ...content.missionVision.vision, heading: e.target.value } })} />
            </Field>
            <Field label="Text">
              <RichTextEditor value={content.missionVision.vision.text} onChange={v => set("missionVision", { vision: { ...content.missionVision.vision, text: v } })} />
            </Field>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* FEATURE BOXES */}
      <AccordionItem value="featureBoxes" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Feature Boxes</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={addFeatureBox}>
              <Plus className="w-3 h-3 mr-1" /> Add Box
            </Button>
          </div>
          {content.featureBoxes.map((box, i) => (
            <ArrayCard key={i} onRemove={() => removeFeatureBox(i)}>
              <SectionGrid>
                <Field label="Title">
                  <Input value={box.title} onChange={e => updateFeatureBox(i, "title", e.target.value)} />
                </Field>
                <Field label="Icon">
                  <Input value={box.icon || ""} onChange={e => updateFeatureBox(i, "icon", e.target.value)} />
                </Field>
              </SectionGrid>
              <Field label="Description">
                <Textarea value={box.description} onChange={e => updateFeatureBox(i, "description", e.target.value)} rows={2} />
              </Field>
            </ArrayCard>
          ))}
        </AccordionContent>
      </AccordionItem>

      {/* STATS */}
      <AccordionItem value="stats" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Statistics</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={addStat}>
              <Plus className="w-3 h-3 mr-1" /> Add Stat
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {content.stats.stats.map((s, i) => (
              <ArrayCard key={i} onRemove={() => removeStat(i)}>
                <Field label="Value">
                  <Input value={s.value} onChange={e => updateStat(i, "value", e.target.value)} placeholder="500+" />
                </Field>
                <Field label="Label">
                  <Input value={s.label} onChange={e => updateStat(i, "label", e.target.value)} placeholder="Cases Won" />
                </Field>
              </ArrayCard>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* WHY CHOOSE US */}
      <AccordionItem value="whyChooseUs" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Why Choose Us</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <SectionGrid>
            <Field label="Section Label">
              <Input value={content.whyChooseUs.sectionLabel} onChange={e => set("whyChooseUs", { sectionLabel: e.target.value })} />
            </Field>
            <Field label="Heading">
              <Input value={content.whyChooseUs.heading} onChange={e => set("whyChooseUs", { heading: e.target.value })} />
            </Field>
          </SectionGrid>
          <Field label="Description">
            <RichTextEditor value={content.whyChooseUs.description} onChange={v => set("whyChooseUs", { description: v })} />
          </Field>
          <Field label="Section Image">
            <ImageUploader value={content.whyChooseUs.image} onChange={v => set("whyChooseUs", { image: v })} folder="about" />
          </Field>
          <Field label="Image Alt Text">
            <Input value={content.whyChooseUs.imageAlt} onChange={e => set("whyChooseUs", { imageAlt: e.target.value })} />
          </Field>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addWhyItem}>
                <Plus className="w-3 h-3 mr-1" /> Add Item
              </Button>
            </div>
            {content.whyChooseUs.items.map((item, i) => (
              <ArrayCard key={i} onRemove={() => removeWhyItem(i)}>
                <SectionGrid>
                  <Field label="Title">
                    <Input value={item.title} onChange={e => updateWhyItem(i, "title", e.target.value)} />
                  </Field>
                  <Field label="Icon">
                    <Input value={item.icon || ""} onChange={e => updateWhyItem(i, "icon", e.target.value)} />
                  </Field>
                </SectionGrid>
                <Field label="Description">
                  <Textarea value={item.description} onChange={e => updateWhyItem(i, "description", e.target.value)} rows={2} />
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
          <Field label="Description">
            <RichTextEditor value={content.cta.description} onChange={v => set("cta", { description: v })} />
          </Field>
          <SectionGrid>
            <Field label="Button Text">
              <Input value={content.cta.secondaryButton.text} onChange={e => set("cta", { secondaryButton: { ...content.cta.secondaryButton, text: e.target.value } })} />
            </Field>
            <Field label="Button Link">
              <Input value={content.cta.secondaryButton.href} onChange={e => set("cta", { secondaryButton: { ...content.cta.secondaryButton, href: e.target.value } })} placeholder="/contact" />
            </Field>
          </SectionGrid>
        </AccordionContent>
      </AccordionItem>

    </Accordion>
  );
}
