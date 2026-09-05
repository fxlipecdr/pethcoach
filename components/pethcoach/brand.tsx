import Image from "next/image";
import Link from "next/link";
import { PawPrint } from "lucide-react";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function Brand({ className }: { className?: string }) {
  const logo = brand.logo;
  return (
    <Link
      href="/"
      aria-label={`${brand.name}, página inicial`}
      className={cn(
        "inline-flex shrink-0 items-center gap-2.5 text-xl font-semibold tracking-[-0.05em] text-foreground",
        className,
      )}
    >
      {logo ? (
        <span
          className="relative block h-10 shrink-0 overflow-hidden"
          style={{ aspectRatio: `${logo.crop.width} / ${logo.crop.height}` }}
        >
          <Image
            src={logo.src}
            width={logo.width}
            height={logo.height}
            sizes="160px"
            alt={brand.name}
            className="absolute max-w-none mix-blend-multiply"
            style={{
              left: `${(-logo.crop.x / logo.crop.width) * 100}%`,
              top: `${(-logo.crop.y / logo.crop.height) * 100}%`,
              width: `${(logo.width / logo.crop.width) * 100}%`,
              height: "auto",
            }}
          />
        </span>
      ) : (
        <>
          <span className="flex size-9 items-center justify-center rounded-[11px] bg-primary text-primary-foreground">
            <PawPrint className="size-5" strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span>
            {brand.name}
            <span className="text-primary-strong">.</span>
          </span>
        </>
      )}
    </Link>
  );
}
