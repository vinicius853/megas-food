import { RotateCcw, Trash2 } from "lucide-react";

import type { SizeOptionMatrixRow } from "../types/menu-management";
import { formatSlices, getSizeSlices } from "./pizza-pricing-helpers";

type Props = {
  size: SizeOptionMatrixRow;
  onChange: (patch: Partial<SizeOptionMatrixRow>) => void;
  onRemove: () => void;
  inactiveMode?: boolean;
};

export function PizzaSizeCard({
  size,
  onChange,
  onRemove,
  inactiveMode = false,
}: Props) {
  return (
    <article
      className={`min-w-0 rounded-2xl border p-4 transition ${
        size.isActive
          ? "border-slate-200 bg-white"
          : "border-slate-200 bg-slate-50 opacity-70"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <label className="text-xs font-black uppercase text-slate-500">
            Nome do tamanho
          </label>
          <input
            value={size.name}
            onChange={(event) => onChange({ name: event.target.value })}
            placeholder="Ex.: 30cm, Broto, Família"
            className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
          />
        </div>

        {inactiveMode ? (
          <button
            type="button"
            onClick={() => onChange({ isActive: true })}
            title="Reativar tamanho"
            className="mt-5 inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-black text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
          >
            <RotateCcw className="h-4 w-4" />
            Reativar
          </button>
        ) : (
          <button
            type="button"
            onClick={onRemove}
            title="Remover tamanho"
            className="mt-5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="min-w-0 text-xs font-black uppercase text-slate-500">
          Tipo
          <select
            value={size.type}
            onChange={(event) =>
              onChange({
                type: event.target.value as SizeOptionMatrixRow["type"],
              })
            }
            className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold normal-case text-slate-800 outline-none focus:border-orange-500"
          >
            <option value="CM">Redonda</option>
            <option value="SLICES">Quadrada</option>
          </select>
        </label>

        <label className="min-w-0 text-xs font-black uppercase text-slate-500">
          Fatias
          <input
            type="number"
            min={1}
            value={getSizeSlices(size)}
            onChange={(event) =>
              onChange({ subtitle: formatSlices(event.target.value) })
            }
            placeholder="8"
            className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold normal-case text-slate-800 outline-none focus:border-orange-500"
          />
        </label>

        <label className="min-w-0 text-xs font-black uppercase text-slate-500">
          Máx. sabores
          <input
            type="number"
            min={1}
            value={size.maxFlavors}
            onChange={(event) =>
              onChange({
                maxFlavors: event.target.value
                  ? Number(event.target.value)
                  : "",
              })
            }
            className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold normal-case text-slate-800 outline-none focus:border-orange-500"
          />
        </label>

        <div className="flex min-w-0 flex-col justify-end gap-2 pb-1">
          <Toggle
            label="Aceita borda"
            checked={size.allowBorder}
            onChange={(allowBorder) => onChange({ allowBorder })}
          />
          <Toggle
            label={size.isActive ? "Ativo" : "Inativo"}
            checked={size.isActive}
            onChange={(isActive) => onChange({ isActive })}
          />
        </div>
      </div>
    </article>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-600">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-orange-600"
      />
      {label}
    </label>
  );
}
