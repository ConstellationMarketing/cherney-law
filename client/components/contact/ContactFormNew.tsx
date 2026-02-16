import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import type { ContactFormSettings } from "@site/lib/cms/contactPageTypes";

const contactFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  message: z.string().min(1, "Message is required"),
  preferredContact: z
    .array(z.enum(["phone", "email", "text"]))
    .min(1, "Please select at least one contact method"),
  consent: z.literal(true, {
    errorMap: () => ({ message: "You must agree to continue" }),
  }),
  honeypot: z.string().max(0, "Bot detected"),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

interface ContactFormNewProps {
  settings: ContactFormSettings;
}

export default function ContactFormNew({ settings }: ContactFormNewProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      message: "",
      preferredContact: [],
      consent: undefined,
      honeypot: "",
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Form submitted:", data);
      toast.success("Thank you! We will contact you soon.");
      reset();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="bg-law-dark border border-law-border p-[24px] md:p-[32px]">
      {/* Header */}
      <h3 className="font-playfair text-[26px] md:text-[30px] leading-tight text-white mb-[8px]">
        {settings.heading}
      </h3>
      {settings.subtext && (
        <p className="font-outfit text-[14px] md:text-[16px] text-white/70 mb-[24px]">
          {settings.subtext}
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-[18px]">
        {/* First Name */}
        <FormField error={errors.firstName?.message}>
          <Input
            {...register("firstName")}
            type="text"
            placeholder="First Name *"
            className="bg-white border-white text-black h-[50px] text-[15px] placeholder:text-gray-400"
            aria-invalid={errors.firstName ? "true" : "false"}
          />
        </FormField>

        {/* Last Name */}
        <FormField error={errors.lastName?.message}>
          <Input
            {...register("lastName")}
            type="text"
            placeholder="Last Name *"
            className="bg-white border-white text-black h-[50px] text-[15px] placeholder:text-gray-400"
            aria-invalid={errors.lastName ? "true" : "false"}
          />
        </FormField>

        {/* Email */}
        <FormField error={errors.email?.message}>
          <Input
            {...register("email")}
            type="email"
            placeholder="Email Address *"
            className="bg-white border-white text-black h-[50px] text-[15px] placeholder:text-gray-400"
            aria-invalid={errors.email ? "true" : "false"}
          />
        </FormField>

        {/* Phone */}
        <FormField error={errors.phone?.message}>
          <Input
            {...register("phone")}
            type="tel"
            placeholder="Phone Number *"
            className="bg-white border-white text-black h-[50px] text-[15px] placeholder:text-gray-400"
            aria-invalid={errors.phone ? "true" : "false"}
          />
        </FormField>

        {/* Message */}
        <FormField error={errors.message?.message}>
          <Textarea
            {...register("message")}
            placeholder="Message *"
            className="bg-white border-white text-black min-h-[140px] text-[15px] placeholder:text-gray-400 resize-y"
            aria-invalid={errors.message ? "true" : "false"}
          />
        </FormField>

        {/* Preferred Contact Method */}
        <div>
          <p className="font-outfit text-[14px] md:text-[15px] text-white/90 mb-[10px]">
            How would you like us to reach you? *
          </p>
          <Controller
            control={control}
            name="preferredContact"
            render={({ field }) => (
              <div className="flex flex-wrap gap-x-[20px] gap-y-[10px]">
                {(["phone", "email", "text"] as const).map((method) => {
                  const isChecked = field.value.includes(method);
                  return (
                    <label
                      key={method}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            field.onChange([...field.value, method]);
                          } else {
                            field.onChange(
                              field.value.filter((v) => v !== method)
                            );
                          }
                        }}
                        className="border-white/50 data-[state=checked]:bg-law-accent data-[state=checked]:border-law-accent"
                      />
                      <span className="font-outfit text-[14px] text-white/90 capitalize">
                        {method}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          />
          {errors.preferredContact && (
            <p className="text-red-400 text-[13px] mt-1">
              {errors.preferredContact.message}
            </p>
          )}
        </div>

        {/* Consent Checkbox */}
        <div>
          <Controller
            control={control}
            name="consent"
            render={({ field }) => (
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={field.value === true}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true ? true : undefined)
                  }
                  className="border-white/50 data-[state=checked]:bg-law-accent data-[state=checked]:border-law-accent mt-0.5 shrink-0"
                />
                <span className="font-outfit text-[13px] md:text-[14px] text-white/70 leading-[20px]">
                  {settings.consentText}
                </span>
              </label>
            )}
          />
          {errors.consent && (
            <p className="text-red-400 text-[13px] mt-1">
              {errors.consent.message}
            </p>
          )}
        </div>

        {/* Privacy / Terms links */}
        <p className="font-outfit text-[13px] text-white/50">
          <a
            href={settings.privacyPolicyUrl}
            className="underline hover:text-white/80 transition-colors"
          >
            Privacy Policy
          </a>
          {" – "}
          <a
            href={settings.termsOfServiceUrl}
            className="underline hover:text-white/80 transition-colors"
          >
            Terms of Service
          </a>
        </p>

        {/* Honeypot */}
        <div className="absolute invisible" aria-hidden="true">
          <label htmlFor="contact-hp">
            Leave empty
            <Input
              {...register("honeypot")}
              type="text"
              id="contact-hp"
              tabIndex={-1}
              autoComplete="off"
            />
          </label>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-law-accent text-black border-law-accent font-outfit text-[18px] md:text-[20px] h-[50px] hover:bg-law-accent-dark hover:text-white transition-all duration-500"
        >
          {isSubmitting
            ? "SUBMITTING..."
            : settings.submitButtonText || "SUBMIT"}
        </Button>
      </form>
    </div>
  );
}

function FormField({
  children,
  error,
}: {
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      {children}
      {error && <p className="text-red-400 text-[13px] mt-1">{error}</p>}
    </div>
  );
}
