import Image from "next/image";
import { brand } from "./brand";

export function NdnMark({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-sm p-1 ${compact ? "h-8 w-8" : "h-6 w-6"}`}
      style={{ backgroundColor: brand.mist }}
    >
      <Image
        src="/short_logo.png"
        alt="NDN"
        width={compact ? 34 : 30}
        height={compact ? 34 : 30}
        className="h-auto w-auto object-contain"
        unoptimized
        priority
      />
    </div>
  );
}
