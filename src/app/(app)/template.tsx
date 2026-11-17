import { ViewTransition } from "react";

/**
 * Re-mounted on every navigation, so each screen fades in as the previous one
 * fades out. Cards keep their own named transition and morph into their detail.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-fade" exit="page-fade" default="none">
      <div className="flex flex-col gap-6 sm:gap-8">{children}</div>
    </ViewTransition>
  );
}
