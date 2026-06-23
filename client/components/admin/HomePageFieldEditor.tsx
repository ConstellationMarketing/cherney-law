import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

function HeadingField({
  label,
  value,
  level = "2",
  onTextChange,
  onLevelChange,
  hint
}: {
  label: string
  value: string
  level?: string
  onTextChange: (v: string) => void
  onLevelChange: (v: string) => void
  hint?: string
}) {
  return (
    <div className="space-y-2">
      <Field label={label} hint={hint}>
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
  const featureBoxes = content.featureBoxes || {
    items: hero.featureBoxes || [],
  };

  const addFeatureBox = () =>
    set("featureBoxes", { items: [...featureBoxes.items, { icon: "", title: "", description: "" }] });
  const removeFeatureBox = (i: number) =>
    set("featureBoxes", { items: featureBoxes.items.filter((_, idx) => idx !== i) });
  const updateFeatureBox = (i: number, k: string, v: string) => {
    const boxes = featureBoxes.items.map((b, idx) => (idx === i ? { ...b, [k]: v } : b));
    set("featureBoxes", { items: boxes });
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

  // --- Firm Description ---
  const firmDescription = content.firmDescription;
  const addTrustReason = () =>
    set("firmDescription", {
      trustReasons: [...(firmDescription.trustReasons || []), ""],
    });
  const removeTrustReason = (i: number) =>
    set("firmDescription", {
      trustReasons: (firmDescription.trustReasons || []).filter((_, idx) => idx !== i),
    });
  const updateTrustReason = (i: number, value: string) => {
    const trustReasons = (firmDescription.trustReasons || []).map((reason, idx) =>
      idx === i ? value : reason,
    );
    set("firmDescription", { trustReasons });
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

  // --- Attorney Info ---
  const attorneyInfo = content.attorneyInfo;
  const addFeaturedLogo = () =>
    set("attorneyInfo", {
      featuredLogos: [...(attorneyInfo.featuredLogos || []), { image: "", alt: "" }],
    });
  const removeFeaturedLogo = (i: number) =>
    set("attorneyInfo", {
      featuredLogos: (attorneyInfo.featuredLogos || []).filter((_, idx) => idx !== i),
    });
  const updateFeaturedLogo = (i: number, k: "image" | "alt", v: string) => {
    const featuredLogos = (attorneyInfo.featuredLogos || []).map((logo, idx) =>
      idx === i ? { ...logo, [k]: v } : logo,
    );
    set("attorneyInfo", { featuredLogos });
  };

  // --- FAQ ---
  const faq = content.faq || { heading: "", items: [] };
  const setFaq = (k: string, v: unknown) => set("faq", { [k]: v } as any);
  const addFaqItem = () =>
    set("faq", { items: [...faq.items, { question: "", answer: "" }] });
  const removeFaqItem = (i: number) =>
    set("faq", { items: faq.items.filter((_, idx) => idx !== i) });
  const updateFaqItem = (i: number, k: string, v: string) => {
    const items = faq.items.map((item, idx) => (idx === i ? { ...item, [k]: v } : item));
    set("faq", { items });
  };

  return (
    <Accordion type="multiple" defaultValue={["hero"]} className="space-y-2">

      {/* ── HERO ── */}
      <AccordionItem value="hero" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Hero Section</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <Field label="H1 Title" hint="SEO page title rendered as an H1 below the headline (e.g. Experienced Bankruptcy Attorney in Marietta GA)">
            <Input value={hero.h1Title || ""} onChange={e => setHero("h1Title", e.target.value)} placeholder="Experienced Bankruptcy Attorney in Marietta GA" />
          </Field>
          <Field label="Highlighted Text" hint="Part of headline shown in green">
            <Input value={hero.highlightedText} onChange={e => setHero("highlightedText", e.target.value)} placeholder="Solutions" />
          </Field>
          <Field label="Headline">
            <Textarea value={hero.headline} onChange={e => setHero("headline", e.target.value)} rows={2} placeholder="Full headline text" />
          </Field>
          <GlobalPhoneNote />

          {/* Hero Background Image */}
          <Field label="Hero Background Image" hint="Full-width background photo behind the hero section">
            <ImageUploader
              value={(hero as any).heroBgImage || ""}
              onChange={v => setHero("heroBgImage", v)}
              folder="hero-backgrounds"
            />
          </Field>

          {/* Hero Attorney Image */}
          <Field label="Attorney Image (right side of hero)" hint="Displayed on the right side of the hero section">
            <ImageUploader
              value={(hero as any).heroImage || ""}
              onChange={v => setHero("heroImage", v)}
              folder="attorney"
            />
          </Field>

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

      {/* ── TESTIMONIALS ── */}
      <AccordionItem value="testimonials" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Testimonials</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <HeadingField
            label="Section Heading"
            hint="This is the heading tag (e.g. H2) for the section"
            value={content.testimonials.sectionLabel}
            level={String(content.testimonials.headingLevel || 2)}
            onTextChange={v => set("testimonials", { sectionLabel: v })}
            onLevelChange={v => set("testimonials", { headingLevel: Number(v) as 1 | 2 | 3 | 4 })}
          />
          <Field label="Section Text" hint="Displayed as paragraph text below the heading">
            <Input value={content.testimonials.heading} onChange={e => set("testimonials", { heading: e.target.value })} />
          </Field>
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            This section now uses dynamic Google reviews instead of manually entered CMS testimonials. The live section pulls the same Google reviews data used on the Testimonials page and outputs aggregate rating schema when reviews load.
          </div>
          <SectionGrid>
            <Field label="Google Place ID" hint="Used for the Google reviews link. Review data is loaded from the site's Google Reviews integration.">
              <Input
                value={content.testimonials.googlePlaceId || ""}
                onChange={e => set("testimonials", { googlePlaceId: e.target.value })}
                placeholder="0x88f513c2103ad111:0xf0c853b13f4aa2fc"
              />
            </Field>
            <Field label="Minimum Star Rating" hint="Only show reviews with this many stars or higher.">
              <Select
                value={String(content.testimonials.minimumRating ?? 0)}
                onValueChange={v => set("testimonials", { minimumRating: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All reviews</SelectItem>
                  <SelectItem value="5">5 stars only</SelectItem>
                  <SelectItem value="4">4 stars and up</SelectItem>
                  <SelectItem value="3">3 stars and up</SelectItem>
                  <SelectItem value="2">2 stars and up</SelectItem>
                  <SelectItem value="1">1 star and up</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Start Review Number" hint="Start the slider from this 1-based review number after the rating filter is applied.">
              <Input
                type="number"
                min="1"
                value={content.testimonials.reviewStartNumber || 1}
                onChange={e => set("testimonials", { reviewStartNumber: Number(e.target.value) || 1 })}
              />
            </Field>
            <Field label="Reviewer Name Display" hint="Choose whether to show the full name, first name only, initials, or hide the reviewer name.">
              <Select
                value={content.testimonials.reviewerNameDisplay || (content.testimonials.showReviewerName === false ? "hidden" : "full")}
                onValueChange={v => set("testimonials", {
                  reviewerNameDisplay: v as "full" | "firstName" | "initials" | "hidden",
                  showReviewerName: v !== "hidden",
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full name</SelectItem>
                  <SelectItem value="firstName">Hide last name only</SelectItem>
                  <SelectItem value="initials">Initials only</SelectItem>
                  <SelectItem value="hidden">Hide name</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </SectionGrid>
        </AccordionContent>
      </AccordionItem>

      {/* ── FEATURE BOXES ── */}
      <AccordionItem value="featureBoxes" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Feature Boxes Section</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            This section appears below the homepage testimonials and is managed separately from the hero so you can reorder it independently in the CMS.
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Feature Boxes</Label>
              <Button type="button" variant="outline" size="sm" onClick={addFeatureBox}>
                <Plus className="w-3 h-3 mr-1" /> Add Box
              </Button>
            </div>
            {featureBoxes.items.map((box, i) => (
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
                  <Textarea value={box.description || ""} onChange={e => updateFeatureBox(i, "description", e.target.value)} rows={2} />
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
          <HeadingField
            label="Section Heading"
            hint="This is the heading tag (e.g. H2) for the section"
            value={about.sectionLabel}
            level={String(about.headingLevel || 2)}
            onTextChange={v => setAbout("sectionLabel", v)}
            onLevelChange={v => setAbout("headingLevel", Number(v) as 1 | 2 | 3 | 4)}
          />
          <Field label="Section Text" hint="Displayed as paragraph text below the heading">
            <Input value={about.heading} onChange={e => setAbout("heading", e.target.value)} />
          </Field>
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
          <HeadingField
            label="Heading"
            value={firmDescription.heading}
            level={String(firmDescription.headingLevel || 2)}
            onTextChange={v => set("firmDescription", { heading: v })}
            onLevelChange={v => set("firmDescription", { headingLevel: Number(v) as 1 | 2 | 3 | 4 })}
          />
          <Field label="Body">
            <RichTextEditor value={firmDescription.body} onChange={v => set("firmDescription", { body: v })} />
          </Field>
          <Field label="Image" hint="Moved from the testimonials section and displayed on the right side of this block">
            <ImageUploader
              value={firmDescription.image || content.testimonials.backgroundImage || ""}
              onChange={v => set("firmDescription", { image: v })}
              folder="backgrounds"
            />
          </Field>
          <SectionGrid>
            <Field label="CTA Button Text">
              <Input
                value={firmDescription.ctaText || ""}
                onChange={e => set("firmDescription", { ctaText: e.target.value })}
                placeholder="Schedule a consultation"
              />
            </Field>
            <Field label="CTA Link">
              <Input
                value={firmDescription.ctaLink || ""}
                onChange={e => set("firmDescription", { ctaLink: e.target.value })}
                placeholder="/contact"
              />
            </Field>
          </SectionGrid>
          <HeadingField
            label="Trust Section Title"
            hint="Centered heading shown above the trust blurbs at the bottom of this section"
            value={firmDescription.trustHeading || ""}
            level={String(firmDescription.trustHeadingLevel || 3)}
            onTextChange={v => set("firmDescription", { trustHeading: v })}
            onLevelChange={v => set("firmDescription", { trustHeadingLevel: Number(v) as 1 | 2 | 3 | 4 })}
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Trust Reasons</Label>
              <Button type="button" variant="outline" size="sm" onClick={addTrustReason}>
                <Plus className="w-3 h-3 mr-1" /> Add Reason
              </Button>
            </div>
            {(firmDescription.trustReasons || []).map((reason, i) => (
              <ArrayCard key={i} onRemove={() => removeTrustReason(i)}>
                <Field label={`Reason ${i + 1}`} hint="Short blurb displayed with a check icon">
                  <Input
                    value={reason}
                    onChange={e => updateTrustReason(i, e.target.value)}
                    placeholder="Thousands of bankruptcy cases successfully handled"
                  />
                </Field>
              </ArrayCard>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ── PRACTICE AREAS INTRO ── */}
      <AccordionItem value="practiceAreasIntro" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Practice Areas Intro</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <HeadingField
            label="Section Heading"
            hint="This is the heading tag (e.g. H2) for the section"
            value={content.practiceAreasIntro.sectionLabel}
            level={String(content.practiceAreasIntro.headingLevel || 2)}
            onTextChange={v => set("practiceAreasIntro", { sectionLabel: v })}
            onLevelChange={v => set("practiceAreasIntro", { headingLevel: Number(v) as 1 | 2 | 3 | 4 })}
          />
          <Field label="Section Text" hint="Displayed as paragraph text below the heading">
            <Input value={content.practiceAreasIntro.heading} onChange={e => set("practiceAreasIntro", { heading: e.target.value })} />
          </Field>
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
          <HeadingField
            label="Section Heading"
            hint="This is the heading tag (e.g. H2) for the section"
            value={content.awardsCTA.sectionLabel}
            level={String(content.awardsCTA.headingLevel || 2)}
            onTextChange={v => set("awardsCTA", { sectionLabel: v })}
            onLevelChange={v => set("awardsCTA", { headingLevel: Number(v) as 1 | 2 | 3 | 4 })}
          />
          <Field label="Section Text" hint="Displayed as paragraph text below the heading">
            <Input value={content.awardsCTA.heading} onChange={e => set("awardsCTA", { heading: e.target.value })} />
          </Field>
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

      {/* ── ATTORNEY INFO ── */}
      <AccordionItem value="attorneyInfo" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Attorney Info Section</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <Field label="Heading">
            <Input value={attorneyInfo.heading} onChange={e => set("attorneyInfo", { heading: e.target.value })} />
          </Field>
          <SectionGrid>
            <Field label="Attorney Image">
              <ImageUploader value={attorneyInfo.image} onChange={v => set("attorneyInfo", { image: v })} folder="attorney" />
            </Field>
            <Field label="Stay Informed Image">
              <ImageUploader value={attorneyInfo.stayInformedImage} onChange={v => set("attorneyInfo", { stayInformedImage: v })} folder="general" />
            </Field>
          </SectionGrid>
          <SectionGrid>
            <Field label="Image Alt Text">
              <Input value={attorneyInfo.imageAlt} onChange={e => set("attorneyInfo", { imageAlt: e.target.value })} />
            </Field>
            <Field label="Stay Informed Image Alt">
              <Input value={attorneyInfo.stayInformedImageAlt} onChange={e => set("attorneyInfo", { stayInformedImageAlt: e.target.value })} />
            </Field>
          </SectionGrid>
          <Field label="Body">
            <RichTextEditor value={attorneyInfo.body} onChange={v => set("attorneyInfo", { body: v })} minHeight="150px" />
          </Field>
          <Field label="Stay Informed Heading">
            <Input value={attorneyInfo.stayInformedHeading} onChange={e => set("attorneyInfo", { stayInformedHeading: e.target.value })} />
          </Field>
          <Field label="Stay Informed Text">
            <RichTextEditor value={attorneyInfo.stayInformedText} onChange={v => set("attorneyInfo", { stayInformedText: v })} />
          </Field>
          <Field label="Stay Informed Caption">
            <Input value={attorneyInfo.stayInformedCaption} onChange={e => set("attorneyInfo", { stayInformedCaption: e.target.value })} />
          </Field>
          <HeadingField
            label="Featured In Heading"
            hint="Centered title shown above the logo slider at the bottom of this section"
            value={attorneyInfo.featuredInHeading || ""}
            level={String(attorneyInfo.featuredInHeadingLevel || 3)}
            onTextChange={v => set("attorneyInfo", { featuredInHeading: v })}
            onLevelChange={v => set("attorneyInfo", { featuredInHeadingLevel: Number(v) as 1 | 2 | 3 | 4 })}
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Featured Logos</Label>
              <Button type="button" variant="outline" size="sm" onClick={addFeaturedLogo}>
                <Plus className="w-3 h-3 mr-1" /> Add Logo
              </Button>
            </div>
            {(attorneyInfo.featuredLogos || []).map((logo, i) => (
              <ArrayCard key={i} onRemove={() => removeFeaturedLogo(i)}>
                <SectionGrid>
                  <Field label="Logo Image">
                    <ImageUploader
                      value={logo.image}
                      onChange={v => updateFeaturedLogo(i, "image", v)}
                      folder="logos"
                      compact
                      placeholder="Upload logo"
                    />
                  </Field>
                  <Field label="Logo Alt Text">
                    <Input
                      value={logo.alt}
                      onChange={e => updateFeaturedLogo(i, "alt", e.target.value)}
                      placeholder="Featured publication name"
                    />
                  </Field>
                </SectionGrid>
              </ArrayCard>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ── FAQ ── */}
      <AccordionItem value="faq" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">FAQ Section</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <Field label="Section Title" hint="Centered title shown above the FAQ accordions">
            <Input value={faq.heading} onChange={e => setFaq("heading", e.target.value)} placeholder="Frequently Asked Questions" />
          </Field>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Questions & Answers</Label>
              <Button type="button" variant="outline" size="sm" onClick={addFaqItem}>
                <Plus className="w-3 h-3 mr-1" /> Add FAQ
              </Button>
            </div>
            {faq.items.map((item, i) => (
              <ArrayCard key={i} onRemove={() => removeFaqItem(i)}>
                <Field label="Question">
                  <Input value={item.question} onChange={e => updateFaqItem(i, "question", e.target.value)} />
                </Field>
                <Field label="Answer">
                  <RichTextEditor value={item.answer} onChange={v => updateFaqItem(i, "answer", v)} minHeight="120px" />
                </Field>
              </ArrayCard>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ── CONTACT SECTION ── */}
      <AccordionItem value="contact" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Contact Section</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <SectionGrid>
            <HeadingField
              label="Section Heading"
              hint="This is the heading tag (e.g. H2) for the section"
              value={content.contact.sectionLabel}
              level={String((content.contact as any).headingLevel || 2)}
              onTextChange={v => set("contact", { sectionLabel: v })}
              onLevelChange={v => set("contact", { headingLevel: Number(v) as 1 | 2 | 3 | 4 })}
            />
            <Field label="Section Text" hint="Displayed as paragraph text below the heading">
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
