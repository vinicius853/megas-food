type ConfiguratorSelectionFooterProps = {
  selectedCount: number;
  minSelections: number;
  maxSelections: number;
  onContinue: () => void;
};

export function ConfiguratorSelectionFooter({
  selectedCount,
  minSelections,
  maxSelections,
  onContinue,
}: ConfiguratorSelectionFooterProps) {
  const canContinue = selectedCount >= minSelections;
  const remaining = Math.max(maxSelections - selectedCount, 0);

  let message = `Escolha pelo menos ${minSelections} opção/sabor.`;

  if (canContinue && selectedCount >= maxSelections) {
    message = `${selectedCount}/${maxSelections} selecionados · limite atingido.`;
  } else if (canContinue) {
    message = `${selectedCount}/${maxSelections} selecionados · você pode adicionar mais ${remaining} se quiser.`;
  }

  return (
    <footer className="shrink-0 border-t border-slate-200 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_24px_rgba(15,23,42,0.08)]">
      <p
        className={`mb-2 text-center text-xs font-bold ${
          canContinue ? "text-slate-600" : "text-amber-700"
        }`}
      >
        {message}
      </p>
      <button
        type="button"
        disabled={!canContinue}
        onClick={onContinue}
        className="h-12 w-full rounded-2xl bg-red-700 text-sm font-black text-white shadow-lg transition disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
      >
        Continuar
      </button>
    </footer>
  );
}
