import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { TestimonialsPageContent } from "@/lib/pageContentTypes";
import RichTextEditor from "@/components/admin/RichTextEditor";

interface Props {
  content: TestimonialsPageContent;
  onChange: (content: TestimonialsPageContent) => void;
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

export default function TestimonialsPageFieldEditor({ content, onChange }: Props) {
  const set = <S extends keyof TestimonialsPageContent>(section: S, updates: Partial<TestimonialsPageContent[S]>) => {
    onChange({ ...content, [section]: { ...content[section], ...updates } });
  };

  return (
    <Accordion type="multiple" defaultValue={["hero"]} className="space-y-2">

      {/* HERO */}
      <AccordionItem value="hero" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Hero Section</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <SectionGrid>
            <Field label="Section Label">
              <Input value={content.hero.sectionLabel} onChange={e => set("hero", { sectionLabel: e.target.value })} placeholder="TESTIMONIALS" />
            </Field>
            <Field label="Tagline">
              <Input value={content.hero.tagline} onChange={e => set("hero", { tagline: e.target.value })} />
            </Field>
          </SectionGrid>
        </AccordionContent>
      </AccordionItem>

      {/* GOOGLE REVIEWS */}
      <AccordionItem value="reviews" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Google Reviews Integration</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <Field label="Google Place ID" hint="Used to pull reviews from Google Maps">
            <Input value={content.reviews.placeId} onChange={e => set("reviews", { placeId: e.target.value })} placeholder="ChIJ..." />
          </Field>
          <Field label="Section Heading">
            <Input value={content.reviews.heading} onChange={e => set("reviews", { heading: e.target.value })} />
          </Field>
          <Field label="Subtext">
            <Input value={content.reviews.subtext} onChange={e => set("reviews", { subtext: e.target.value })} />
          </Field>
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
