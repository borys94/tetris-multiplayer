import { useEffect, useState } from "react";
import { viewOf, type View } from "../../app/routes";

/** Widok z hasha w URL (`#/ranking`, `#/pokoj/<kod>`), bez biblioteki routera (spec 005). */
export function useView(): View {
  const [view, setView] = useState(() => viewOf(window.location.hash));
  useEffect(() => {
    const onChange = () => setView(viewOf(window.location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return view;
}
