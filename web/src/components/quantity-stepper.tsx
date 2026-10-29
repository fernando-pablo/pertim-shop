'use client';

/** Botões de menos e mais para a quantidade. */
export function QuantityStepper({
  value,
  max,
  onChange,
  label = 'Quantidade',
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  label?: string;
}) {
  return (
    <fieldset className="flex h-14 shrink-0 items-center rounded-store border border-line bg-surface">
      <legend className="sr-only">{label}</legend>
      <button
        type="button"
        aria-label="Diminuir"
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
        className="size-12 text-xl text-ink disabled:opacity-40"
      >
        −
      </button>
      <span aria-live="polite" className="w-6 text-center font-bold">
        {value}
      </span>
      <button
        type="button"
        aria-label="Aumentar"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className="size-12 text-xl text-primary disabled:opacity-40"
      >
        +
      </button>
    </fieldset>
  );
}
