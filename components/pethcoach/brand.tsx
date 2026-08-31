import Image from "next/image";
import Link from "next/link";
import { PawPrint } from "lucide-react";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function Brand({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label={`${brand.name}, página inicial`}
      className={cn(
        "inline-flex shrink-0 items-center gap-2.5 text-xl font-semibold tracking-[-0.05em] text-foreground",
        className,
      )}
    >
      {brand.logo ? (
        <Image
          src={brand.logo.src}
          width={brand.logo.width}
          height={brand.logo.height}
          alt={brand.name}
          className="h-9 w-auto max-w-44 object-contain"
        />
      ) : (
        <>
          <span className="flex size-9 items-center justify-center rounded-[11px] bg-primary text-primary-foreground">
            <PawPrint className="size-5" strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span>
            {brand.name}
            <span className="text-primary">.</span>
          </span>
        </>
      )}
    </Link>
  );
}
