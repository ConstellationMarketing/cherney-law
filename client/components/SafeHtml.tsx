/**
 * SafeHtml Component
 * Safely renders HTML content or wraps plain text in a paragraph
 */

interface SafeHtmlProps {
  html: string | null | undefined;
  className?: string;
}

export default function SafeHtml({ html, className = "" }: SafeHtmlProps) {
  if (!html || !html.trim()) {
    return null;
  }

  const trimmed = html.trim();
  
  // Detect if content is HTML (contains HTML tags)
  const isHtml = /<[^>]+>/.test(trimmed);

  if (isHtml) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: trimmed }}
      />
    );
  }

  // Plain text: wrap in paragraph
  return <p className={className}>{trimmed}</p>;
}
