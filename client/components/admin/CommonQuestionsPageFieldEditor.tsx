import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash2 } from "lucide-react";
import type { CommonQuestionsPageContent, FaqItem } from "@/lib/cms/commonQuestionsPageTypes";
import RichTextEditor from "@/components/admin/RichTextEditor";

interface Props {
  content: CommonQuestionsPageContent;
  onChange: (content: CommonQuestionsPageContent) => void;
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

export default function CommonQuestionsPageFieldEditor({ content, onChange }: Props) {
  const set = <S extends keyof CommonQuestionsPageContent>(
    section: S,
    updates: Partial<CommonQuestionsPageContent[S]>
  ) => {
    onChange({ ...content, [section]: { ...content[section], ...updates } });
  };

  // FAQ Items
  const addFaqItem = () =>
    set("faqSection", { items: [...content.faqSection.items, { question: "", answer: "" }] });
  const removeFaqItem = (i: number) =>
    set("faqSection", { items: content.faqSection.items.filter((_, idx) => idx !== i) });
  const updateFaqItem = (i: number, k: keyof FaqItem, v: string) => {
    const items = content.faqSection.items.map((item, idx) =>
      idx === i ? { ...item, [k]: v } : item
    );
    set("faqSection", { items });
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
                placeholder="– Common Questions"
              />
            </Field>
            <Field label="Tagline">
              <Input
                value={content.hero.tagline}
                onChange={(e) => set("hero", { tagline: e.target.value })}
              />
            </Field>
          </SectionGrid>
        </AccordionContent>
      </AccordionItem>

      {/* FAQ SECTION */}
      <AccordionItem value="faqSection" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">FAQ Section</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <SectionGrid>
            <Field label="Section Label">
              <Input
                value={content.faqSection.sectionLabel}
                onChange={(e) =>
                  set("faqSection", { sectionLabel: e.target.value })
                }
              />
            </Field>
            <Field label="Heading">
              <Input
                value={content.faqSection.heading}
                onChange={(e) => set("faqSection", { heading: e.target.value })}
              />
            </Field>
          </SectionGrid>
          <Field label="Description (Intro Paragraph)">
            <RichTextEditor
              value={content.faqSection.description}
              onChange={(v) => set("faqSection", { description: v })}
              minHeight="150px"
            />
          </Field>

          {/* FAQ Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                FAQ Items
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={addFaqItem}>
                <Plus className="w-3 h-3 mr-1" /> Add FAQ
              </Button>
            </div>
            <div className="space-y-3">
              {content.faqSection.items.map((item, i) => (
                <ArrayCard key={i} onRemove={() => removeFaqItem(i)}>
                  <Field label="Question (H3)">
                    <Input
                      value={item.question}
                      onChange={(e) => updateFaqItem(i, "question", e.target.value)}
                      placeholder="Will I lose everything if I file for bankruptcy?"
                    />
                  </Field>
                  <Field label="Answer (Rich Text)">
                    <RichTextEditor
                      value={item.answer}
                      onChange={(v) => updateFaqItem(i, "answer", v)}
                      minHeight="120px"
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
          <Field label="Heading (H2)">
            <Input
              value={content.closingSection.heading}
              onChange={(e) =>
                set("closingSection", { heading: e.target.value })
              }
            />
          </Field>
          <Field label="Body Content">
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
            />
          </Field>
          <Field label="Description">
            <RichTextEditor
              value={content.cta.description}
              onChange={(v) => set("cta", { description: v })}
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
