import React from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
}: Props) {
  return (
    <textarea
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={
        className ??
        "w-full min-h-[180px] border rounded-md p-3 text-sm leading-6"
      }
    />
  );
}
