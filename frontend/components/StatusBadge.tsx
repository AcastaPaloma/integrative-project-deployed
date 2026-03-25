type Props = {
  value: string;
};

function toneForValue(value: string) {
  switch (value.toLowerCase()) {
    case "completed":
    case "ready":
    case "compatible":
      return "success";
    case "running":
      return "primary";
    case "warning":
    case "queued":
      return "warning";
    case "failed":
    case "incompatible":
    case "error":
      return "danger";
    case "cancelled":
      return "muted";
    default:
      return "neutral";
  }
}

export default function StatusBadge({ value }: Props) {
  return (
    <span className="status-badge" data-tone={toneForValue(value)}>
      {value}
    </span>
  );
}
