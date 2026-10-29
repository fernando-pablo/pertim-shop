/** "Esqueleto" do painel, enquanto os dados chegam da API. */
export function PanelSkeleton({ label }: { label: string }) {
  const block = 'animate-pulse rounded-xl bg-ink/10';
  return (
    <div aria-busy="true" aria-label={label} className="flex flex-col gap-3">
      <div className={`h-8 w-40 ${block}`} />
      <div className={`h-10 ${block}`} />
      <div className={`h-28 ${block}`} />
      <div className={`h-28 ${block}`} />
      <div className={`h-28 ${block}`} />
    </div>
  );
}
