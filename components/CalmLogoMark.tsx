import Image from "next/image";

export default function CalmLogoMark({ size = 44 }: { size?: number }) {
  return <span className="relative block shrink-0 overflow-hidden rounded-full" style={{ width: size, height: size }}><Image src="/calm-logo-maison.png" alt="CALM by Angèle" fill sizes="64px" className="object-cover object-top scale-[1.28]" priority /></span>;
}
