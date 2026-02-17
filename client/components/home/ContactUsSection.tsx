import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Scale } from "lucide-react";
import { toast } from "sonner";
import type { ContactContent } from "@site/lib/cms/homePageTypes";

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

interface ContactUsSectionProps {
  content?: ContactContent;
}

const defaultContent: ContactContent = {
  sectionLabel: "– Contact Us",
  heading: "Get your FREE case evaluation today.",
  description:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut.",
  phone: "404-555-5555",
  phoneLabel: "Call Us 24/7",
  address: "4120 Presidential Parkway, Suite 200, Atlanta, GA 30340",
  formHeading: "Contact Us Today To Schedule a Consultation",
  attorneyImage: "/images/team/attorney-2.png",
  attorneyImageAlt: "Contact Us",
};

export default function ContactUsSection({ content }: ContactUsSectionProps) {
  const data = content || defaultContent;

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

  const onSubmit = async (formData: ContactFormData) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Form submitted:", formData);
      toast.success("Thank you! We will contact you soon.");
      reset();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="bg-white pt-[30px] md:pt-[54px] relative">
      <div className="max-w-[1600px] mx-auto w-[95%] md:w-[85%] lg:w-[80%] relative flex flex-col lg:flex-row gap-8 lg:gap-[3%]">
        {/* Left Side */}
        <div className="lg:w-[65.667%] relative">
          {/* Top Heading Section */}
          <div className="py-[4.2415%] relative w-full">
            <div className="relative w-full">
              <div className="mb-[10px]">
                <p className="font-outfit text-[18px] md:text-[24px] leading-tight md:leading-[36px] text-law-accent">
                  {data.sectionLabel}
                </p>
              </div>
              <div>
                <h2 className="font-playfair text-[32px] md:text-[48px] lg:text-[54px] leading-tight md:leading-[54px] text-black pb-[10px]">
                  {data.heading}
                </h2>
                <div
                  className="font-outfit text-[16px] md:text-[18px] leading-[24px] md:leading-[28px] text-black [&_a]:underline [&_p]:mb-2 [&_p:last-child]:mb-0"
                  dangerouslySetInnerHTML={{ __html: data.description }}
                />
              </div>
            </div>
          </div>

          {/* Background Image Section with Two Parts */}
          <div
            className="relative w-full flex flex-col sm:flex-row pr-0 sm:pr-[20px]"
            style={{
              backgroundImage: "url(/images/backgrounds/contact-us-bg.jpg)",
              backgroundPosition: "50% 50%",
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
            }}
          >
            {/* Left Image */}
            <div className="sm:w-[45.758%] sm:mr-[8.483%] relative ml-auto text-right self-end">
              <div className="relative inline-block">
                <img
                  src={data.attorneyImage || "/images/team/attorney-2.png"}
                  alt={data.attorneyImageAlt || "Contact Us"}
                  width={338}
                  height={462}
                  loading="lazy"
                  className="max-w-full w-[338px] block"
                  style={{
                    maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                  }}
                />
              </div>
            </div>

            {/* Right Overlay Box */}
            <div
              className="sm:w-[45.758%] relative p-[30px] ml-auto bg-law-dark/54"
            >
              <div className="relative mb-[10px]">
                <div className="table w-full mx-auto max-w-full">
                  <div className="table-cell w-[32px] leading-[0] mb-[30px]">
                    <span className="m-auto">
                      <span
                        className="inline-block opacity-0 bg-[#baea0] p-[20px_30px] text-[30px] leading-[30px] font-black"
                        style={{ fontFamily: "FontAwesome" }}
                      ></span>
                    </span>
                  </div>
                  <div className="table-cell align-top pl-[15px]"></div>
                </div>
              </div>

              <div className="relative">
                <div className="mx-auto max-w-full w-full text-center">
                  <div className="text-left">
                    <h4 className="font-playfair text-[22px] md:text-[28px] leading-tight md:leading-[36.4px] text-white pb-[10px]">
                      {data.formHeading}
                    </h4>
                    <div>
                      <p className="font-outfit text-[16px] md:text-[18px] leading-[24px] md:leading-[28px] text-white font-light">
                        Our intake team is available 24 hours a day, seven days
                        a week
                      </p>
                    </div>
                    <div className="mt-[20px] md:mt-[30px] flex justify-start">
                      <div className="bg-law-accent p-[15px] inline-block">
                        <Scale
                          className="w-[40px] h-[40px] md:w-[50px] md:h-[50px] text-black"
                          strokeWidth={1.5}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="lg:w-[31.3333%] relative p-[30px] pt-[30px] shadow-[0px_7px_29px_0px_rgba(100,100,111,0.2)]">
          <div className="relative">
            <form onSubmit={handleSubmit(onSubmit)} className="p-[5px] mx-auto">
              <div className="space-y-[20px]">
                {/* First Name */}
                <div className="relative">
                  <Input
                    {...register("firstName")}
                    type="text"
                    placeholder="First Name *"
                    className="w-full h-[50px] bg-[#f7f7f7] border-[0.8px] border-[#c4c4c4] text-[#6b6b6b] text-[16px] px-[12px] py-[12px] rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    aria-invalid={errors.firstName ? "true" : "false"}
                  />
                  {errors.firstName && (
                    <p className="text-red-600 text-sm mt-1">{errors.firstName.message}</p>
                  )}
                </div>

                {/* Last Name */}
                <div className="relative">
                  <Input
                    {...register("lastName")}
                    type="text"
                    placeholder="Last Name *"
                    className="w-full h-[50px] bg-[#f7f7f7] border-[0.8px] border-[#c4c4c4] text-[#6b6b6b] text-[16px] px-[12px] py-[12px] rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    aria-invalid={errors.lastName ? "true" : "false"}
                  />
                  {errors.lastName && (
                    <p className="text-red-600 text-sm mt-1">{errors.lastName.message}</p>
                  )}
                </div>

                {/* Email */}
                <div className="relative">
                  <Input
                    {...register("email")}
                    type="email"
                    placeholder="Email Address *"
                    className="w-full h-[50px] bg-[#f7f7f7] border-[0.8px] border-[#c4c4c4] text-[#6b6b6b] text-[16px] px-[12px] py-[12px] rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    aria-invalid={errors.email ? "true" : "false"}
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="relative">
                  <Input
                    {...register("phone")}
                    type="tel"
                    placeholder="Phone Number *"
                    className="w-full h-[50px] bg-[#f7f7f7] border-[0.8px] border-[#c4c4c4] text-[#6b6b6b] text-[16px] px-[12px] py-[12px] rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    aria-invalid={errors.phone ? "true" : "false"}
                  />
                  {errors.phone && (
                    <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>
                  )}
                </div>

                {/* Message */}
                <div className="relative">
                  <Textarea
                    {...register("message")}
                    placeholder="Message *"
                    className="w-full h-[200px] bg-[#f7f7f7] border-[0.8px] border-[#c4c4c4] text-[#6b6b6b] text-[16px] px-[12px] py-[12px] rounded-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    aria-invalid={errors.message ? "true" : "false"}
                  />
                  {errors.message && (
                    <p className="text-red-600 text-sm mt-1">{errors.message.message}</p>
                  )}
                </div>

                {/* Preferred Contact Method */}
                <div>
                  <p className="font-outfit text-[13px] text-[#6b6b6b] mb-[8px]">
                    How would you like us to reach you? *
                  </p>
                  <Controller
                    control={control}
                    name="preferredContact"
                    render={({ field }) => (
                      <div className="flex flex-wrap gap-x-[16px] gap-y-[8px]">
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
                                className="border-[#c4c4c4] data-[state=checked]:bg-law-accent data-[state=checked]:border-law-accent"
                              />
                              <span className="font-outfit text-[13px] text-[#6b6b6b] capitalize">
                                {method}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  />
                  {errors.preferredContact && (
                    <p className="text-red-600 text-sm mt-1">
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
                      <label className="flex items-start gap-2 cursor-pointer">
                        <Checkbox
                          checked={field.value === true}
                          onCheckedChange={(checked) =>
                            field.onChange(checked === true ? true : undefined)
                          }
                          className="border-[#c4c4c4] data-[state=checked]:bg-law-accent data-[state=checked]:border-law-accent mt-0.5 shrink-0"
                        />
                        <span className="font-outfit text-[12px] text-[#6b6b6b] leading-[18px]">
                          I agree to receive marketing messaging from this law firm at the phone number provided above. Data rates may apply. Reply STOP to opt out.
                        </span>
                      </label>
                    )}
                  />
                  {errors.consent && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.consent.message}
                    </p>
                  )}
                </div>

                {/* Privacy / Terms links */}
                <p className="font-outfit text-[12px] text-[#999]">
                  <a
                    href="/privacy-policy"
                    className="underline hover:text-[#6b6b6b] transition-colors"
                  >
                    Privacy Policy
                  </a>
                  {" – "}
                  <a
                    href="/terms-of-service"
                    className="underline hover:text-[#6b6b6b] transition-colors"
                  >
                    Terms of Service
                  </a>
                </p>

                {/* Submit Button */}
                <div className="relative">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-law-accent text-black border-law-accent font-outfit text-[22px] h-[50px] hover:bg-law-accent-dark hover:text-white transition-all duration-500 rounded-none"
                  >
                    {isSubmitting ? "SUBMITTING..." : "SUBMIT"}
                  </Button>
                </div>
              </div>

              {/* Honeypot Field */}
              <div className="absolute invisible" aria-hidden="true">
                <label htmlFor="honeypot-field-contactus">
                  If you are a human seeing this field, please leave it empty.
                  <Input
                    {...register("honeypot")}
                    type="text"
                    id="honeypot-field-contactus"
                    tabIndex={-1}
                    autoComplete="off"
                    className="bg-white border-[0.8px] border-[#bbbbbb] text-[#4e4e4e] text-[13.3333px] p-[2px] invisible"
                  />
                </label>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
