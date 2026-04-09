import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Trash2 } from "lucide-react";
import type {
  PracticeAreaDetailPageContent,
  PracticeAreaContentSectionItem,
  PracticeAreaFaqItem,
  PracticeAreaTestimonialItem,
} from "@site/lib/cms/practiceAreaDetailPageTypes";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ImageUploader from "@/components/admin/ImageUploader";

interface Props {
  content: PracticeAreaDetailPageContent;
  onChange: (content: PracticeAreaDetailPageContent) => void;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
        {label}
      </Label>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      {children}
    </div>
  );
}

function ArrayCard({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: () => void;
}) {
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

function getPracticeSectionDiagnostics(contentSections: PracticeAreaContentSectionItem[]) {
  return contentSections.map((section, index) => ({
    index,
    image: section.image || "",
    imageAlt: section.imageAlt || "",
    hasImgInBody: /<img\b/i.test(section.body || ""),
    hasNoscriptInBody: /<noscript\b/i.test(section.body || ""),
  }));
}

export default function PracticeAreaDetailFieldEditor({
  content,
  onChange,
}: Props) {
  useEffect(() => {
    console.groupCollapsed('[practice-preview-diagnostic] editor content sections');
    console.log({
      hero: content.hero,
      sectionCount: content.contentSections.length,
      faq: content.faq,
      sections: getPracticeSectionDiagnostics(content.contentSections),
    });
    console.groupEnd();
  }, [content.contentSections, content.faq, content.hero]);

  const update = (patch: Partial<PracticeAreaDetailPageContent>) => {
    onChange({ ...content, ...patch });
  };

  const updateHero = (patch: Partial<PracticeAreaDetailPageContent["hero"]>) => {
    update({ hero: { ...content.hero, ...patch } });
  };

  const updateSocialProof = (
    patch: Partial<PracticeAreaDetailPageContent["socialProof"]>
  ) => {
    update({ socialProof: { ...content.socialProof, ...patch } });
  };

  const updateFaq = (patch: Partial<PracticeAreaDetailPageContent["faq"]>) => {
    update({ faq: { ...content.faq, ...patch } });
  };

  // Content sections helpers
  const updateSection = (
    index: number,
    patch: Partial<PracticeAreaContentSectionItem>
  ) => {
    const sections = [...content.contentSections];
    sections[index] = { ...sections[index], ...patch };
    update({ contentSections: sections });
  };

  const addSection = () => {
    update({
      contentSections: [
        ...content.contentSections,
        {
          body: "<p>Enter content here.</p>",
          image: "",
          imageAlt: "",
          imagePosition: "right",
          showCTAs: true,
        },
      ],
    });
  };

  const removeSection = (index: number) => {
    update({
      contentSections: content.contentSections.filter((_, i) => i !== index),
    });
  };

  // FAQ helpers
  const addFaqItem = () => {
    updateFaq({
      items: [...(content.faq.items || []), { question: "", answer: "" }],
    });
  };

  const updateFaqItem = (
    index: number,
    patch: Partial<PracticeAreaFaqItem>
  ) => {
    const items = [...(content.faq.items || [])];
    items[index] = { ...items[index], ...patch };
    updateFaq({ items });
  };

  const removeFaqItem = (index: number) => {
    updateFaq({
      items: (content.faq.items || []).filter((_, i) => i !== index),
    });
  };

  // Testimonial helpers
  const addTestimonial = () => {
    updateSocialProof({
      testimonials: [
        ...(content.socialProof.testimonials || []),
        { rating: "", text: "", author: "" },
      ],
    });
  };

  const updateTestimonial = (
    index: number,
    patch: Partial<PracticeAreaTestimonialItem>
  ) => {
    const items = [...(content.socialProof.testimonials || [])];
    items[index] = { ...items[index], ...patch };
    updateSocialProof({ testimonials: items });
  };

  const removeTestimonial = (index: number) => {
    updateSocialProof({
      testimonials: (content.socialProof.testimonials || []).filter(
        (_, i) => i !== index
      ),
    });
  };

  // Awards helpers
  const addAwardLogo = () => {
    const logos = [...(content.socialProof.awards?.logos || [])];
    logos.push({ src: "", alt: "" });
    updateSocialProof({ awards: { logos } });
  };

  const updateAwardLogo = (
    index: number,
    patch: Partial<{ src: string; alt: string }>
  ) => {
    const logos = [...(content.socialProof.awards?.logos || [])];
    logos[index] = { ...logos[index], ...patch };
    updateSocialProof({ awards: { logos } });
  };

  const removeAwardLogo = (index: number) => {
    const logos = (content.socialProof.awards?.logos || []).filter(
      (_, i) => i !== index
    );
    updateSocialProof({ awards: { logos } });
  };

  return (
    <Accordion type="multiple" defaultValue={["hero", "content-sections"]}>
      {/* HERO SECTION */}
      <AccordionItem value="hero" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">
          Hero Section
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <Field label="Section Label / H1">
            <Input
              value={content.hero.sectionLabel}
              onChange={(e) => updateHero({ sectionLabel: e.target.value })}
              placeholder="e.g., Personal Injury"
            />
          </Field>
          <Field label="Tagline">
            <Input
              value={content.hero.tagline}
              onChange={(e) => updateHero({ tagline: e.target.value })}
              placeholder="e.g., Fighting For Your Rights"
            />
          </Field>
          <Field label="Description">
            <Textarea
              value={content.hero.description}
              onChange={(e) => updateHero({ description: e.target.value })}
              placeholder="Brief description of this practice area"
              rows={3}
            />
          </Field>
          <Field label="Background Image (Optional)">
            <ImageUploader
              value={content.hero.backgroundImage || ""}
              onChange={(url) => updateHero({ backgroundImage: url })}
              folder="practice-areas"
            />
          </Field>
          <Field label="Background Image Alt Text">
            <Input
              value={content.hero.backgroundImageAlt || ""}
              onChange={(e) =>
                updateHero({ backgroundImageAlt: e.target.value })
              }
            />
          </Field>
          <p className="text-xs text-blue-600">
            Phone CTA is managed in Site Settings &gt; Contact Info
          </p>
        </AccordionContent>
      </AccordionItem>

      {/* SOCIAL PROOF SECTION */}
      <AccordionItem value="social-proof" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">
          Social Proof
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <Field label="Display Mode">
            <Select
              value={content.socialProof.mode}
              onValueChange={(v) =>
                updateSocialProof({
                  mode: v as "testimonials" | "awards" | "none",
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Hidden</SelectItem>
                <SelectItem value="awards">Awards / Logos</SelectItem>
                <SelectItem value="testimonials">Testimonials</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {content.socialProof.mode === "testimonials" && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-600">
                Testimonials
              </p>
              {(content.socialProof.testimonials || []).map((item, i) => (
                <ArrayCard key={i} onRemove={() => removeTestimonial(i)}>
                  <Field label="Rating Image (Optional)">
                    <ImageUploader
                      value={item.rating || ""}
                      onChange={(url) =>
                        updateTestimonial(i, { rating: url })
                      }
                      folder="testimonials"
                    />
                  </Field>
                  <Field label="Testimonial Text">
                    <RichTextEditor
                      value={item.text}
                      onChange={(v) => updateTestimonial(i, { text: v })}
                    />
                  </Field>
                  <Field label="Author">
                    <Input
                      value={item.author}
                      onChange={(e) =>
                        updateTestimonial(i, { author: e.target.value })
                      }
                    />
                  </Field>
                </ArrayCard>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTestimonial}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Testimonial
              </Button>
            </div>
          )}

          {content.socialProof.mode === "awards" && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-600">
                Award Logos
              </p>
              {(content.socialProof.awards?.logos || []).map((logo, i) => (
                <ArrayCard key={i} onRemove={() => removeAwardLogo(i)}>
                  <Field label="Logo Image">
                    <ImageUploader
                      value={logo.src}
                      onChange={(url) => updateAwardLogo(i, { src: url })}
                      folder="awards"
                    />
                  </Field>
                  <Field label="Alt Text">
                    <Input
                      value={logo.alt}
                      onChange={(e) =>
                        updateAwardLogo(i, { alt: e.target.value })
                      }
                    />
                  </Field>
                </ArrayCard>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAwardLogo}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Logo
              </Button>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* CONTENT SECTIONS */}
      <AccordionItem
        value="content-sections"
        className="border rounded-lg px-4"
      >
        <AccordionTrigger className="text-sm font-semibold">
          Content Sections ({content.contentSections.length})
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          {content.contentSections.map((section, i) => (
            <ArrayCard key={i} onRemove={() => removeSection(i)}>
              <p className="text-xs font-bold text-gray-500 mb-2">
                Section {i + 1}
              </p>
              <Field label="Body Content">
                <RichTextEditor
                  value={section.body}
                  onChange={(v) => updateSection(i, { body: v })}
                />
              </Field>
              <Field label="Image (Optional)">
                <ImageUploader
                  value={section.image || ""}
                  onChange={(url) => updateSection(i, { image: url })}
                  folder="practice-areas"
                />
              </Field>
              <Field label="Image Alt Text">
                <Input
                  value={section.imageAlt || ""}
                  onChange={(e) =>
                    updateSection(i, { imageAlt: e.target.value })
                  }
                />
              </Field>
              <Field label="Image Position">
                <Select
                  value={section.imagePosition || "right"}
                  onValueChange={(v) =>
                    updateSection(i, {
                      imagePosition: v as "left" | "right",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex items-center gap-2">
                <Switch
                  checked={section.showCTAs !== false}
                  onCheckedChange={(checked) =>
                    updateSection(i, { showCTAs: checked })
                  }
                />
                <Label className="text-sm">Show CTA Buttons</Label>
              </div>
            </ArrayCard>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSection}
          >
            <Plus className="w-4 h-4 mr-1" /> Add Content Section
          </Button>
        </AccordionContent>
      </AccordionItem>

      {/* FAQ SECTION */}
      <AccordionItem value="faq" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">
          FAQ Section
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={content.faq.enabled}
              onCheckedChange={(checked) => updateFaq({ enabled: checked })}
            />
            <Label className="text-sm">Enable FAQ Section</Label>
          </div>

          {content.faq.enabled && (
            <>
              <Field label="Heading">
                <Input
                  value={content.faq.heading}
                  onChange={(e) => updateFaq({ heading: e.target.value })}
                />
              </Field>
              <Field label="Description (Optional)">
                <Textarea
                  value={content.faq.description || ""}
                  onChange={(e) =>
                    updateFaq({ description: e.target.value })
                  }
                  rows={2}
                />
              </Field>

              <div className="space-y-3">
                {(content.faq.items || []).map((item, i) => (
                  <ArrayCard key={i} onRemove={() => removeFaqItem(i)}>
                    <Field label="Question">
                      <Input
                        value={item.question}
                        onChange={(e) =>
                          updateFaqItem(i, { question: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Answer">
                      <RichTextEditor
                        value={item.answer}
                        onChange={(v) => updateFaqItem(i, { answer: v })}
                      />
                    </Field>
                  </ArrayCard>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFaqItem}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add FAQ Item
                </Button>
              </div>
            </>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* HEADING TAGS (Advanced) */}
      <AccordionItem value="heading-tags" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">
          Heading Tags (Advanced)
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <p className="text-xs text-gray-500">
            Override the default heading tags (h1-h6) for SEO.
          </p>
          {["hero", "faq"].map((key) => (
            <Field key={key} label={`${key} heading tag`}>
              <Select
                value={content.headingTags?.[key] || ""}
                onValueChange={(v) =>
                  update({
                    headingTags: {
                      ...content.headingTags,
                      [key]: v || undefined,
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="h1">H1</SelectItem>
                  <SelectItem value="h2">H2</SelectItem>
                  <SelectItem value="h3">H3</SelectItem>
                  <SelectItem value="h4">H4</SelectItem>
                  <SelectItem value="h5">H5</SelectItem>
                  <SelectItem value="h6">H6</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
