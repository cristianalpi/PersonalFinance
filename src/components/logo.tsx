import { APP_NAME } from "@/lib/brand";

/** The mark is the product's signature gesture: what you have meeting what you owe. */
export function Logo({ size = "text-xl" }: { size?: string }) {
  return (
    <span className={`display inline-flex items-center gap-2 ${size}`}>
      <span
        aria-hidden="true"
        className="relative flex size-8 items-center gap-0.5 rounded-xl px-1.5 shadow-lg"
        style={{ background: "linear-gradient(135deg, #6d4aff, #9a34e6)" }}
      >
        <span className="h-1.5 w-[58%] rounded-l-full bg-white" />
        <span className="h-1.5 flex-1 rounded-r-full bg-white/55" />
        <span className="absolute left-1/2 top-2 h-4 w-px bg-white/80" />
      </span>
      {APP_NAME}
    </span>
  );
}
