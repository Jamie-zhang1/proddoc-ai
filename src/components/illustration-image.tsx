import Image from "next/image";
import { cn } from "@/lib/utils";

type IllustrationImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  imageClassName?: string;
};

export function IllustrationImage({
  src,
  alt,
  width = 320,
  height = 260,
  className,
  imageClassName,
}: IllustrationImageProps) {
  return (
    <div className={cn("flex justify-center", className)}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={cn("h-auto max-w-full object-contain", imageClassName)}
        style={{ width: "auto", height: "auto" }}
        loading="lazy"
      />
    </div>
  );
}
