import { ListSkeleton } from "@/components/skeletons";

export default function Loading() {
  return <ListSkeleton text="Preparando tu plan…" rows={4} />;
}
