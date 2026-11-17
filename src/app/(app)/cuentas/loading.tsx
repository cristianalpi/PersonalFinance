import { CardsSkeleton } from "@/components/skeletons";

export default function Loading() {
  return <CardsSkeleton text="Trayendo tus cuentas…" count={3} />;
}
