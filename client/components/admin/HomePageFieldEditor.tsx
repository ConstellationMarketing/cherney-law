import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash2, Phone } from "lucide-react";
import type { HomePageContent } from "@/lib/pageContentTypes";
import ImageUploader from "@/components/admin/ImageUploader";
import RichTextEditor from "@/components/admin/RichTextEditor";

interface Props {
  content: HomePageContent;
  onChange: (content: HomePageContent) => void;
}

// ---- small helpers ----
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

function GlobalPhoneNote() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
      <Phone className="w-3.5 h-3.5 flex-shrink-0" />
      <span>Phone number and label are managed globally in <strong>Site Settings → Phone</strong>. Changes apply site-wide.</span>
    </div>
  );
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

export default function HomePageFieldEditor({ content, onChange }: Props) {
  const set = <S extends keyof HomePageContent>(section: S, updates: Partial<HomePageContent[S]>) => {
    onChange({ ...content, [section]: { ...content[section], ...updates } });
  };

  // --- Hero ---
  const hero = content.hero;
  const setHero = (k: string, v: unknown) => set("hero", { [k]: v } as any);

  const addFeatureBox = () =>
    set("hero", { featureBoxes: [...hero.featureBoxes, { icon: "", title: "", description: "" }] });
  const removeFeatureBox = (i: number) =>
    set("hero", { featureBoxes: hero.featureBoxes.filter((_, idx) => idx !== i) });
  const updateFeatureBox = (i: number, k: string, v: string) => {
    const boxes = hero.featureBoxes.map((b, idx) => (idx === i ? { ...b, [k]: v } : b));
    set("hero", { featureBoxes: boxes });
  };

  const addButton = () =>
    set("hero", { buttons: [...hero.buttons, { icon: "", label: "", href: "" }] });
  const removeButton = (i: number) =>
    set("hero", { buttons: hero.buttons.filter((_, idx) => idx !== i) });
  const updateButton = (i: number, k: string, v: string) => {
    const btns = hero.buttons.map((b, idx) => (idx === i ? { ...b, [k]: v } : b));
    set("hero", { buttons: btns });
  };

  // --- About ---
  const about = content.about;
  const setAbout = (k: string, v: unknown) => set("about", { [k]: v } as any);

  const addFeature = () =>
    set("about", { features: [...about.features, { icon: "", title: "", description: "" }] });
  const removeFeature = (i: number) =>
    set("about", { features: about.features.filter((_, idx) => idx !== i) });
  const updateFeature = (i: number, k: string, v: string) => {
    const feats = about.features.map((f, idx) => (idx === i ? { ...f, [k]: v } : f));
    set("about", { features: feats });
  };

  const addStat = () => set("about", { stats: [...about.stats, { value: "", label: "" }] });
  const removeStat = (i: number) =>
    set("about", { stats: about.stats.filter((_, idx) => idx !== i) });
  const updateStat = (i: number, k: string, v: string) => {
    const stats = about.stats.map((s, idx) => (idx === i ? { ...s, [k]: v } : s));
    set("about", { stats });
  };

  // --- Practice Areas ---
  const addArea = () =>
    onChange({ ...content, practiceAreas: [...content.practiceAreas, { title: "", description: "", icon: "", href: "" }] });
  const removeArea = (i: number) =>
    onChange({ ...content, practiceAreas: content.practiceAreas.filter((_, idx) => idx !== i) });
  const updateArea = (i: number, k: string, v: string) => {
    const areas = content.practiceAreas.map((a, idx) => (idx === i ? { ...a, [k]: v } : a));
    onChange({ ...content, practiceAreas: areas });
  };

  // --- Testimonials ---
  const addTestimonial = () =>
    set("testimonials", { items: [...content.testimonials.items, { quote: "", author: "", location: "" }] });
  const removeTestimonial = (i: number) =>
    set("testimonials", { items: content.testimonials.items.filter((_, idx) => idx !== i) });
  const updateTestimonial = (i: number, k: string, v: string) => {
    const items = content.testimonials.items.map((t, idx) => (idx === i ? { ...t, [k]: v } : t));
    set("testimonials", { items });
  };

  return (
    <Accordion type="multiple" defaultValue={["hero"]} className="space-y-2">

      {/* ── HERO ── */}
      <AccordionItem value="hero" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Hero Section</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <SectionGrid>
            <Field label="H1 Title" hint="Small uppercase label shown below headline">
              <Input value={hero.h1Title} onChange={e => setHero("h1Title", e.target.value)} placeholder="ATLANTA PERSONAL INJURY ATTORNEY" />
            </Field>
            <Field label="Highlighted Text" hint="Part of headline shown in white">
              <Input value={hero.highlightedText} onChange={e => setHero("highlightedText", e.target.value)} placeholder="Fighting for Justice" />
            </Field>
          </SectionGrid>
          <Field label="Headline">
            <Textarea value={hero.headline} onChange={e => setHero("headline", e.target.value)} rows={2} placeholder="Full headline text" />
          </Field>
          <GlobalPhoneNote />

          <Field label="Syndications Label" hint="Text shown above the attorney image in the About section (Homepage 2 only)">
            <Input value={(hero as any).syndicationsLabel || ""} onChange={e => setHero("syndicationsLabel", e.target.value)} placeholder="Featured in the following syndications:" />
          </Field>

          {/* Feature Boxes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Feature Boxes</Label>
              <Button type="button" variant="outline" size="sm" onClick={addFeatureBox}>
                <Plus className="w-3 h-3 mr-1" /> Add Box
              </Button>
            </div>
            {hero.featureBoxes.map((box, i) => (
              <ArrayCard key={i} onRemove={() => removeFeatureBox(i)}>
                <SectionGrid>
                  <Field label="Title">
                    <Input value={box.title} onChange={e => updateFeatureBox(i, "title", e.target.value)} />
                  </Field>
                  <Field label="Icon (lucide name)" hint="e.g. Scale, Briefcase">
                    <Input value={box.icon || ""} onChange={e => updateFeatureBox(i, "icon", e.target.value)} />
                  </Field>
                </SectionGrid>
                <Field label="Description">
                  <RichTextEditor value={box.description} onChange={v => updateFeatureBox(i, "description", v)} />
                </Field>
              </ArrayCard>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">CTA Buttons</Label>
              <Button type="button" variant="outline" size="sm" onClick={addButton}>
                <Plus className="w-3 h-3 mr-1" /> Add Button
              </Button>
            </div>
            {hero.buttons.map((btn, i) => (
              <ArrayCard key={i} onRemove={() => removeButton(i)}>
                <SectionGrid>
                  <Field label="Label">
                    <Input value={(btn as any).label || (btn as any).text || ""} onChange={e => updateButton(i, "label", e.target.value)} />
                  </Field>
                  <Field label="Link (href)">
                    <Input value={btn.href} onChange={e => updateButton(i, "href", e.target.value)} placeholder="/contact" />
                  </Field>
                </SectionGrid>
                <Field label="Icon (lucide name)" hint="e.g. Scale, Calendar, Briefcase">
                  <Input value={(btn as any).icon || ""} onChange={e => updateButton(i, "icon", e.target.value)} />
                </Field>
              </ArrayCard>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ── ABOUT ── */}
      <AccordionItem value="about" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">About Section</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <SectionGrid>
            <Field label="Section Label">
              <Input value={about.sectionLabel} onChange={e => setAbout("sectionLabel", e.target.value)} placeholder="ABOUT US" />
            </Field>
            <Field label="Heading">
              <Input value={about.heading} onChange={e => setAbout("heading", e.target.value)} />
            </Field>
          </SectionGrid>
          <Field label="Description">
            <RichTextEditor value={about.description} onChange={v => setAbout("description", v)} />
          </Field>
          <GlobalPhoneNote />
          <SectionGrid>
            <Field label="Contact Label">
              <Input value={about.contactLabel} onChange={e => setAbout("contactLabel", e.target.value)} />
            </Field>
            <Field label="Contact Text">
              <Input value={about.contactText} onChange={e => setAbout("contactText", e.target.value)} />
            </Field>
          </SectionGrid>
          <Field label="Attorney Image">
            <ImageUploader value={about.attorneyImage} onChange={v => setAbout("attorneyImage", v)} folder="attorney" />
          </Field>
          <Field label="Attorney Image Alt Text">
            <Input value={(about as any).attorneyImageAlt || ""} onChange={e => setAbout("attorneyImageAlt", e.target.value)} />
          </Field>

          {/* Features */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Features</Label>
              <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                <Plus className="w-3 h-3 mr-1" /> Add Feature
              </Button>
            </div>
            {about.features.map((f, i) => (
              <ArrayCard key={i} onRemove={() => removeFeature(i)}>
                <SectionGrid>
                  <Field label="Title">
                    <Input value={f.title} onChange={e => updateFeature(i, "title", e.target.value)} />
                  </Field>
                  <Field label="Icon">
                    <Input value={f.icon || ""} onChange={e => updateFeature(i, "icon", e.target.value)} />
                  </Field>
                </SectionGrid>
                <Field label="Description">
                  <RichTextEditor value={f.description} onChange={v => updateFeature(i, "description", v)} />
                </Field>
              </ArrayCard>
            ))}
          </div>

          {/* Stats */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Stats</Label>
              <Button type="button" variant="outline" size="sm" onClick={addStat}>
                <Plus className="w-3 h-3 mr-1" /> Add Stat
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {about.stats.map((s, i) => (
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
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ── FIRM DESCRIPTION ── */}
      <AccordionItem value="firmDescription" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Firm Description</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <Field label="Heading">
            <Input value={content.firmDescription.heading} onChange={e => set("firmDescription", { heading: e.target.value })} />
          </Field>
          <Field label="Body">
            <RichTextEditor value={content.firmDescription.body} onChange={v => set("firmDescription", { body: v })} />
          </Field>
        </AccordionContent>
      </AccordionItem>

      {/* ── PRACTICE AREAS INTRO ── */}
      <AccordionItem value="practiceAreasIntro" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Practice Areas Intro</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <SectionGrid>
            <Field label="Section Label">
              <Input value={content.practiceAreasIntro.sectionLabel} onChange={e => set("practiceAreasIntro", { sectionLabel: e.target.value })} />
            </Field>
            <Field label="Heading">
              <Input value={content.practiceAreasIntro.heading} onChange={e => set("practiceAreasIntro", { heading: e.target.value })} />
            </Field>
          </SectionGrid>
          <Field label="Description">
            <RichTextEditor value={content.practiceAreasIntro.description} onChange={v => set("practiceAreasIntro", { description: v })} />
          </Field>
        </AccordionContent>
      </AccordionItem>

      {/* ── PRACTICE AREAS ── */}
      <AccordionItem value="practiceAreas" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Practice Areas Grid</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={addArea}>
              <Plus className="w-3 h-3 mr-1" /> Add Area
            </Button>
          </div>
          {content.practiceAreas.map((a, i) => (
            <ArrayCard key={i} onRemove={() => removeArea(i)}>
              <SectionGrid>
                <Field label="Title">
                  <Input value={a.title} onChange={e => updateArea(i, "title", e.target.value)} />
                </Field>
                <Field label="Icon">
                  <Input value={a.icon || ""} onChange={e => updateArea(i, "icon", e.target.value)} />
                </Field>
              </SectionGrid>
              <Field label="Link (href)">
                <Input value={a.href || ""} onChange={e => updateArea(i, "href", e.target.value)} placeholder="/practice-areas" />
              </Field>
              <Field label="Description">
                <Textarea value={a.description} onChange={e => updateArea(i, "description", e.target.value)} rows={2} />
              </Field>
              <Field label="Background Image">
                <ImageUploader value={a.image || ""} onChange={v => updateArea(i, "image", v)} folder="practice-areas" />
              </Field>
            </ArrayCard>
          ))}
        </AccordionContent>
      </AccordionItem>

      {/* ── AWARDS CTA ── */}
      <AccordionItem value="awardsCTA" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Awards / CTA Section</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <SectionGrid>
            <Field label="Section Label">
              <Input value={content.awardsCTA.sectionLabel} onChange={e => set("awardsCTA", { sectionLabel: e.target.value })} />
            </Field>
            <Field label="Heading">
              <Input value={content.awardsCTA.heading} onChange={e => set("awardsCTA", { heading: e.target.value })} />
            </Field>
          </SectionGrid>
          <Field label="Description">
            <RichTextEditor value={content.awardsCTA.description} onChange={v => set("awardsCTA", { description: v })} />
          </Field>
          <SectionGrid>
            <Field label="CTA Button Text">
              <Input value={content.awardsCTA.ctaText} onChange={e => set("awardsCTA", { ctaText: e.target.value })} />
            </Field>
            <Field label="CTA Link">
              <Input value={content.awardsCTA.ctaLink} onChange={e => set("awardsCTA", { ctaLink: e.target.value })} placeholder="/contact" />
            </Field>
          </SectionGrid>
        </AccordionContent>
      </AccordionItem>

      {/* ── TESTIMONIALS ── */}
      <AccordionItem value="testimonials" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Testimonials</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <SectionGrid>
            <Field label="Section Label">
              <Input value={content.testimonials.sectionLabel} onChange={e => set("testimonials", { sectionLabel: e.target.value })} />
            </Field>
            <Field label="Heading">
              <Input value={content.testimonials.heading} onChange={e => set("testimonials", { heading: e.target.value })} />
            </Field>
          </SectionGrid>
          <Field label="Background Image">
            <ImageUploader value={content.testimonials.backgroundImage} onChange={v => set("testimonials", { backgroundImage: v })} folder="backgrounds" />
          </Field>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Testimonial Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addTestimonial}>
                <Plus className="w-3 h-3 mr-1" /> Add Testimonial
              </Button>
            </div>
            {content.testimonials.items.map((t, i) => (
              <ArrayCard key={i} onRemove={() => removeTestimonial(i)}>
                <Field label="Quote">
                  <Textarea value={t.quote} onChange={e => updateTestimonial(i, "quote", e.target.value)} rows={3} />
                </Field>
                <SectionGrid>
                  <Field label="Author Name">
                    <Input value={t.author} onChange={e => updateTestimonial(i, "author", e.target.value)} />
                  </Field>
                  <Field label="Location">
                    <Input value={t.location || ""} onChange={e => updateTestimonial(i, "location", e.target.value)} />
                  </Field>
                </SectionGrid>
              </ArrayCard>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ── ATTORNEY INFO ── */}
      <AccordionItem value="attorneyInfo" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Attorney Info Section</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <Field label="Heading">
            <Input value={content.attorneyInfo.heading} onChange={e => set("attorneyInfo", { heading: e.target.value })} />
          </Field>
          <SectionGrid>
            <Field label="Attorney Image">
              <ImageUploader value={content.attorneyInfo.image} onChange={v => set("attorneyInfo", { image: v })} folder="attorney" />
            </Field>
            <Field label="Stay Informed Image">
              <ImageUploader value={content.attorneyInfo.stayInformedImage} onChange={v => set("attorneyInfo", { stayInformedImage: v })} folder="general" />
            </Field>
          </SectionGrid>
          <SectionGrid>
            <Field label="Image Alt Text">
              <Input value={content.attorneyInfo.imageAlt} onChange={e => set("attorneyInfo", { imageAlt: e.target.value })} />
            </Field>
            <Field label="Stay Informed Image Alt">
              <Input value={content.attorneyInfo.stayInformedImageAlt} onChange={e => set("attorneyInfo", { stayInformedImageAlt: e.target.value })} />
            </Field>
          </SectionGrid>
          <Field label="Body">
            <RichTextEditor value={content.attorneyInfo.body} onChange={v => set("attorneyInfo", { body: v })} minHeight="150px" />
          </Field>
          <Field label="Stay Informed Heading">
            <Input value={content.attorneyInfo.stayInformedHeading} onChange={e => set("attorneyInfo", { stayInformedHeading: e.target.value })} />
          </Field>
          <Field label="Stay Informed Text">
            <RichTextEditor value={content.attorneyInfo.stayInformedText} onChange={v => set("attorneyInfo", { stayInformedText: v })} />
          </Field>
          <Field label="Stay Informed Caption">
            <Input value={content.attorneyInfo.stayInformedCaption} onChange={e => set("attorneyInfo", { stayInformedCaption: e.target.value })} />
          </Field>
        </AccordionContent>
      </AccordionItem>

      {/* ── CONTACT SECTION ── */}
      <AccordionItem value="contact" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Contact Section</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <SectionGrid>
            <Field label="Section Label">
              <Input value={content.contact.sectionLabel} onChange={e => set("contact", { sectionLabel: e.target.value })} />
            </Field>
            <Field label="Heading">
              <Input value={content.contact.heading} onChange={e => set("contact", { heading: e.target.value })} />
            </Field>
          </SectionGrid>
          <Field label="Description">
            <RichTextEditor value={content.contact.description} onChange={v => set("contact", { description: v })} />
          </Field>
          <GlobalPhoneNote />
          <Field label="Address">
            <Input value={content.contact.address} onChange={e => set("contact", { address: e.target.value })} />
          </Field>
          <Field label="Form Heading">
            <Input value={content.contact.formHeading} onChange={e => set("contact", { formHeading: e.target.value })} />
          </Field>
          <Field label="Attorney Image">
            <ImageUploader value={content.contact.attorneyImage} onChange={v => set("contact", { attorneyImage: v })} folder="attorney" />
          </Field>
        </AccordionContent>
      </AccordionItem>

    </Accordion>
  );
}
