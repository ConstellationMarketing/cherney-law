import type { ReactNode } from "react";

interface DynamicHeadingProps {
  tag?: string;
  defaultTag?: string;
  children: ReactNode;
  className?: string;
}

const VALID_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

export default function DynamicHeading({
  tag,
  defaultTag = "h2",
  children,
  className = "",
}: DynamicHeadingProps) {
  const resolvedTag = tag && VALID_TAGS.has(tag) ? tag : defaultTag;
  const Tag = resolvedTag as keyof JSX.IntrinsicElements;
  return <Tag className={className}>{children}</Tag>;
}
