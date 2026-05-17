export function GajianAmanMark({
  className,
  variant = 'light',
}: {
  className?: string;
  variant?: 'light' | 'dark';
}) {
  return (
    <img
      src={variant === 'light' ? '/light-logo.png' : '/dark-logo.png'}
      alt="Gajian Aman"
      className={className}
    />
  );
}
