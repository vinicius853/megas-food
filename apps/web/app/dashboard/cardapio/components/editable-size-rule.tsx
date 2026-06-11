import { Trash2 } from "lucide-react";

import {
  type SizeOptionMatrixRow,
  type SizeOptionMatrixSetter,
} from "../types/menu-management";
import { isNewSizeDraft } from "../hooks/menu-management-drafts";

export function EditableSizeRule({
  size,
  setSizes,
  onRemove,
}: {
  size: SizeOptionMatrixRow;
  setSizes: SizeOptionMatrixSetter;
  onRemove: (sizeId: string) => void;
}) {
  function updateField(
    field: keyof SizeOptionMatrixRow,
    value: SizeOptionMatrixRow[keyof SizeOptionMatrixRow],
  ) {
    setSizes((prev) =>
      prev.map((item) =>
        item.id === size.id
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  }

  function updateMaxFlavors(value: string) {
    const onlyNumbers = value.replace(/\D/g, "");
    const withoutLeadingZeros = onlyNumbers.replace(/^0+/, "");

    updateField(
      "maxFlavors",
      withoutLeadingZeros === ""
        ? ""
        : Math.min(Number(withoutLeadingZeros), 4),
    );
  }

  return (
    <div
      className={`rounded-3xl border p-4 transition ${
        size.isActive
          ? "border-orange-200 bg-orange-50/40"
          : "border-slate-200 bg-slate-50 opacity-60"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <input
          autoFocus={isNewSizeDraft(size)}
          value={size.name}
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="Ex: 30cm, Grande, 8 Fatias"
          className="min-w-0 flex-1 bg-transparent text-sm font-black text-slate-950 outline-none"
        />

        <button
          type="button"
          onClick={() => onRemove(size.id)}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 grid gap-2">
        <div>
          <p className="mb-1 text-xs font-bold text-slate-400">
            Texto abaixo do tamanho
          </p>

          <input
            value={size.subtitle ?? ""}
            onChange={(event) => updateField("subtitle", event.target.value)}
            placeholder="Ex: 8 fatias, Individual, Familia"
            className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="mb-1 text-xs font-bold text-slate-400">
              Sabores aceitos
            </p>

            <input
              type="text"
              inputMode="numeric"
              value={String(size.maxFlavors ?? "")}
              onChange={(event) => updateMaxFlavors(event.target.value)}
              onBlur={() => {
                if (!size.maxFlavors) {
                  updateField("maxFlavors", 1);
                  return;
                }

                if (Number(size.maxFlavors) > 4) {
                  updateField("maxFlavors", 4);
                }
              }}
              className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black outline-none"
            />
          </div>

          <div>
            <p className="mb-1 text-xs font-bold text-slate-400">Tipo</p>

            <div className="flex h-10 items-center rounded-2xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-500">
              {size.type === "CM" ? "Redonda" : "Quadrada"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500">
            <input
              type="checkbox"
              checked={size.isActive}
              onChange={(event) =>
                updateField("isActive", event.target.checked)
              }
            />

            {size.isActive ? "Ativo" : "Inativo"}
          </label>

          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500">
            <input
              type="checkbox"
              checked={size.allowBorder}
              onChange={(event) =>
                updateField("allowBorder", event.target.checked)
              }
            />
            Aceita borda
          </label>
        </div>
      </div>
    </div>
  );
}
