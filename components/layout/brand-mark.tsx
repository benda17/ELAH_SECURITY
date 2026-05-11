import Image from "next/image";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: 28,
  md: 36,
  lg: 44,
} as const;

export function BrandMark({
  size = "md",
  className,
  alt = "ELAH Bank",
}: {
  size?: keyof typeof SIZES;
  className?: string;
  alt?: string;
}) {
  const px = SIZES[size];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        className,
      )}
      style={{ width: px, height: px }}
    >
      <Image
        src="/elah-logo.png"
        alt={alt}
        width={px}
        height={px}
        priority
        className="h-full w-full object-contain"
      />
    </span>
  );
}
