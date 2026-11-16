export default function Loading() {
  return (
    <div className="flex flex-col gap-5 pt-4" role="status" aria-label="Cargando">
      <div className="skeleton h-16 w-64" />
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-40 w-full" />
      <div className="skeleton h-64 w-full" />
    </div>
  );
}
