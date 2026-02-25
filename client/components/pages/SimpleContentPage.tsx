/**
 * SimpleContentPage Component
 * Presentational component for rendering simple pages like Privacy Policy, Terms, etc.
 */

import SafeHtml from "@site/components/SafeHtml";
import type { SimplePageContent } from "@site/lib/cms/simplePageTypes";

interface SimpleContentPageProps {
  content: SimplePageContent;
  isLoading?: boolean;
}

export default function SimpleContentPage({
  content,
  isLoading = false,
}: SimpleContentPageProps) {
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-law-accent py-12 md:py-16">
        <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%]">
          <h1 className="font-outfit text-[18px] md:text-[24px] leading-tight md:leading-[36px] text-white mb-[10px]">
            – Legal Information
          </h1>
          <p className="font-playfair text-[clamp(2.5rem,7vw,68.8px)] font-light leading-[1.2] text-black">
            {content.title}
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 md:py-16">
        <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%]">
          <div className="max-w-[900px]">
            <SafeHtml
              html={content.body}
              className="prose prose-lg max-w-none font-outfit text-gray-700 leading-relaxed"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
