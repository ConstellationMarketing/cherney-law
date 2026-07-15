interface LastUpdatedProps {
  value?: string;
  className?: string;
}

const formatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export default function LastUpdated({ value, className }: LastUpdatedProps) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return (
    <p className={className}>
      Last Updated: <time dateTime={value}>{formatter.format(date)}</time>
    </p>
  );
}
