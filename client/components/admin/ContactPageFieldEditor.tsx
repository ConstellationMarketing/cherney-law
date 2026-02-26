import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash2 } from "lucide-react";
import type { ContactPageContent } from "@/lib/pageContentTypes";
import RichTextEditor from "@/components/admin/RichTextEditor";

interface Props {
  content: ContactPageContent;
  onChange: (content: ContactPageContent) => void;
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

export default function ContactPageFieldEditor({ content, onChange }: Props) {
  const set = <S extends keyof ContactPageContent>(section: S, updates: Partial<ContactPageContent[S]>) => {
    onChange({ ...content, [section]: { ...content[section], ...updates } });
  };

  // Offices
  const addOffice = () =>
    onChange({
      ...content,
      offices: [...content.offices, { name: "", heading: "", content: "", address: "", phone: "", phoneDisplay: "", mapEmbedUrl: "", directions: "" }],
    });
  const removeOffice = (i: number) =>
    onChange({ ...content, offices: content.offices.filter((_, idx) => idx !== i) });
  const updateOffice = (i: number, k: string, v: string) => {
    const offices = content.offices.map((o, idx) => (idx === i ? { ...o, [k]: v } : o));
    onChange({ ...content, offices });
  };

  // Process steps
  const addStep = () =>
    set("process", { steps: [...content.process.steps, { stepNumber: "", title: "", description: "" }] });
  const removeStep = (i: number) =>
    set("process", { steps: content.process.steps.filter((_, idx) => idx !== i) });
  const updateStep = (i: number, k: string, v: string) => {
    const steps = content.process.steps.map((s, idx) => (idx === i ? { ...s, [k]: v } : s));
    set("process", { steps });
  };

  return (
    <Accordion type="multiple" defaultValue={["hero"]} className="space-y-2">

      {/* HERO */}
      <AccordionItem value="hero" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Hero Section</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <SectionGrid>
            <Field label="Section Label">
              <Input value={content.hero.sectionLabel} onChange={e => set("hero", { sectionLabel: e.target.value })} placeholder="CONTACT US" />
            </Field>
            <Field label="Tagline">
              <Input value={content.hero.tagline} onChange={e => set("hero", { tagline: e.target.value })} />
            </Field>
          </SectionGrid>
          <Field label="Description">
            <RichTextEditor value={content.hero.description} onChange={v => set("hero", { description: v })} />
          </Field>
        </AccordionContent>
      </AccordionItem>

      {/* OFFICES */}
      <AccordionItem value="offices" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Office Locations</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={addOffice}>
              <Plus className="w-3 h-3 mr-1" /> Add Office
            </Button>
          </div>
          {content.offices.map((office, i) => (
            <ArrayCard key={i} onRemove={() => removeOffice(i)} title={(office as any).name || `Office ${i + 1}`}>
              <Field label="Tab Label">
                <Input value={(office as any).name || ""} onChange={e => updateOffice(i, "name", e.target.value)} placeholder="Atlanta" />
              </Field>
              <Field label="Heading (displayed in office tab)">
                <Input value={(office as any).heading || ""} onChange={e => updateOffice(i, "heading", e.target.value)} placeholder="Contact an Atlanta Bankruptcy Attorney" />
              </Field>
              <Field label="Body Text (rich text)">
                <RichTextEditor value={(office as any).content || ""} onChange={v => updateOffice(i, "content", v)} />
              </Field>
              <Field label="Address">
                <Textarea value={(office as any).address || ""} onChange={e => updateOffice(i, "address", e.target.value)} rows={2} placeholder="123 Main St, Suite 100, City, State 12345" />
              </Field>
              <SectionGrid>
                <Field label="Phone (tel: value)">
                  <Input value={(office as any).phone || ""} onChange={e => updateOffice(i, "phone", e.target.value)} placeholder="770-485-4141" hint="Phone number for tel: links" />
                </Field>
                <Field label="Phone Display (formatted for display)">
                  <Input value={(office as any).phoneDisplay || ""} onChange={e => updateOffice(i, "phoneDisplay", e.target.value)} placeholder="(770) 485-4141" hint="Formatted phone shown to users" />
                </Field>
              </SectionGrid>
              <Field label="Google Maps Embed URL" hint="Paste the src URL from Google Maps embed code">
                <Input value={(office as any).mapEmbedUrl || ""} onChange={e => updateOffice(i, "mapEmbedUrl", e.target.value)} placeholder="https://www.google.com/maps/embed?..." />
              </Field>
              <Field label="Driving Directions (rich text)">
                <RichTextEditor value={(office as any).directions || ""} onChange={v => updateOffice(i, "directions", v)} />
              </Field>
            </ArrayCard>
          ))}
        </AccordionContent>
      </AccordionItem>

      {/* FORM SETTINGS */}
      <AccordionItem value="formSettings" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Contact Form Settings</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <Field label="Form Heading">
            <Input value={content.formSettings.heading} onChange={e => set("formSettings", { heading: e.target.value })} />
          </Field>
          <Field label="Subtext">
            <Textarea value={content.formSettings.subtext} onChange={e => set("formSettings", { subtext: e.target.value })} rows={2} />
          </Field>
          <Field label="Submit Button Text">
            <Input value={content.formSettings.submitButtonText} onChange={e => set("formSettings", { submitButtonText: e.target.value })} placeholder="Send Message" />
          </Field>
          <Field label="Consent / Disclaimer Text">
            <Textarea value={content.formSettings.consentText} onChange={e => set("formSettings", { consentText: e.target.value })} rows={3} />
          </Field>
          <SectionGrid>
            <Field label="Privacy Policy URL">
              <Input value={content.formSettings.privacyPolicyUrl} onChange={e => set("formSettings", { privacyPolicyUrl: e.target.value })} placeholder="/privacy-policy" />
            </Field>
            <Field label="Terms of Service URL">
              <Input value={content.formSettings.termsOfServiceUrl} onChange={e => set("formSettings", { termsOfServiceUrl: e.target.value })} placeholder="/terms" />
            </Field>
          </SectionGrid>
        </AccordionContent>
      </AccordionItem>

      {/* PROCESS STEPS */}
      <AccordionItem value="process" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Process Steps</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <SectionGrid>
            <Field label="Section Label">
              <Input value={content.process.sectionLabel} onChange={e => set("process", { sectionLabel: e.target.value })} />
            </Field>
            <Field label="Heading">
              <Input value={content.process.heading} onChange={e => set("process", { heading: e.target.value })} />
            </Field>
          </SectionGrid>
          <Field label="Subtitle">
            <Input value={content.process.subtitle} onChange={e => set("process", { subtitle: e.target.value })} />
          </Field>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Steps</Label>
              <Button type="button" variant="outline" size="sm" onClick={addStep}>
                <Plus className="w-3 h-3 mr-1" /> Add Step
              </Button>
            </div>
            {content.process.steps.map((step, i) => (
              <ArrayCard key={i} onRemove={() => removeStep(i)}>
                <SectionGrid>
                  <Field label="Step Number / Label">
                    <Input value={step.stepNumber} onChange={e => updateStep(i, "stepNumber", e.target.value)} placeholder="01" />
                  </Field>
                  <Field label="Title">
                    <Input value={step.title} onChange={e => updateStep(i, "title", e.target.value)} />
                  </Field>
                </SectionGrid>
                <Field label="Description">
                  <Textarea value={step.description} onChange={e => updateStep(i, "description", e.target.value)} rows={2} />
                </Field>
              </ArrayCard>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

    </Accordion>
  );
}
