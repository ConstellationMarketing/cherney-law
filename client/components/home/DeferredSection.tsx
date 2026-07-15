import type { CSSProperties, ReactNode } from "react";

interface DeferredSectionProps {
  children: ReactNode;
  intrinsicBlockSize?: number | string;
}

export default function DeferredSection({
  children,
  intrinsicBlockSize = 800,
}: DeferredSectionProps) {
  const blockSize =
    typeof intrinsicBlockSize === "number"
      ? `${intrinsicBlockSize}px`
      : intrinsicBlockSize;
  const style: CSSProperties = {
    contentVisibility: "auto",
    containIntrinsicSize: `auto ${blockSize}`,
  };

  return <div style={style}>{children}</div>;
}
