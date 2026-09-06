import type { ReactNode, SVGProps } from "react";

type Kind = "home" | "visit" | "walk" | "care" | "photos" | "trust" | "contract" | "payment" | "message";
export default function CalmCategoryIcon({ kind, className = "" }: { kind: Kind; className?: string }) {
  const props: SVGProps<SVGSVGElement> = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", className };
  const paths: Record<Kind, ReactNode> = {
    home: <><path d="m3 11 9-7 9 7" /><path d="M5 10v9h14v-9" /><path d="M9 19v-5h6v5" /><path d="M18.5 5.5v3" /></>,
    visit: <><path d="M12 21s7-5.1 7-12a7 7 0 1 0-14 0c0 6.9 7 12 7 12Z" /><circle cx="12" cy="9" r="2.2" /></>,
    walk: <><circle cx="7" cy="17" r="2.5" /><path d="M9.5 17c2.8 0 2.5-6.5 6-7.4 1.7-.4 2.8.9 2.8 2.3" /><path d="M17 6.5c1 0 1.8.8 1.8 1.8" /><path d="M3.5 17H2" /></>,
    care: <><path d="M12 21s-7-4.6-7-11.2A4.2 4.2 0 0 1 12 6.7a4.2 4.2 0 0 1 7 3.1C19 16.4 12 21 12 21Z" /><path d="M12 9v5" /><path d="M9.5 11.5h5" /></>,
    photos: <><rect x="3" y="6" width="18" height="13" rx="2" /><path d="m8 6 1-2h6l1 2" /><circle cx="12" cy="12.5" r="3" /></>,
    trust: <><path d="M12 3 5 6v5c0 4.8 3 8.2 7 10 4-1.8 7-5.2 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    contract: <><path d="M7 3h8l4 4v14H7z" /><path d="M15 3v5h5" /><path d="M10 12h5M10 16h5" /></>,
    payment: <><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /><path d="M7 15h3" /></>,
    message: <><path d="M20 11.5a7.5 7.5 0 0 1-10.8 6.7L4 20l1.8-5.2A7.5 7.5 0 1 1 20 11.5Z" /><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" /></>,
  };
  return <svg {...props} aria-hidden="true">{paths[kind]}</svg>;
}
