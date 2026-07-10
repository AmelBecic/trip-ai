/**
 * The one horizontal rhythm every page and every shell slot shares: centered,
 * width-capped, and padded so content never touches the viewport edge.
 */
export function Container({
  className,
  children,
}: Readonly<{
  className?: string;
  children: React.ReactNode;
}>) {
  const base = "mx-auto w-full max-w-6xl px-4 sm:px-6 md:px-8 lg:px-12";

  return <div className={className ? `${base} ${className}` : base}>{children}</div>;
}
