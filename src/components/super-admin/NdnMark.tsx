import Image from "next/image";
import { brand } from "./brand";

export function NdnMark({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-2xl ${compact ? "h-12 w-12" : "h-11 w-11"}`}
      style={{ backgroundColor: brand.orangeSoft }}
    >
      <Image
        src="/short_logo.png"
        alt="NDN"
        width={compact ? 34 : 30}
        height={compact ? 34 : 30}
        className="h-auto w-auto object-contain"
        priority
      />
    </div>
  );
}
