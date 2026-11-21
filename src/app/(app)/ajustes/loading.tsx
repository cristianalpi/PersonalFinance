import { ListSkeleton } from "@/components/skeletons";

export default function Loading() {
  return <ListSkeleton text="Abriendo ajustes…" rows={4} />;
}
