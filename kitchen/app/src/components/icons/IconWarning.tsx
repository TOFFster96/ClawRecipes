type Props = {
  width?: number;
  height?: number;
  className?: string;
};

/** Warning/exclamation icon for destructive actions. */
export function IconWarning({ width = 24, height = 24, className }: Props) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
    </svg>
  );
}
