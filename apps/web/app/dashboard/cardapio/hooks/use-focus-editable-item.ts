"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";

export function useFocusEditableItem(
  itemId: string | null,
  setItemId: Dispatch<SetStateAction<string | null>>,
  inputIdPrefix: string,
) {
  useEffect(() => {
    if (!itemId) return undefined;

    const frame = window.requestAnimationFrame(() => {
      const input = document.getElementById(`${inputIdPrefix}-${itemId}`);

      if (input instanceof HTMLElement) {
        input.scrollIntoView({ behavior: "smooth", block: "center" });
        input.focus();
      }

      setItemId(null);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [inputIdPrefix, itemId, setItemId]);
}
