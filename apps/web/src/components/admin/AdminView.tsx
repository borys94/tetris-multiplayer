import { useState } from "react";
import { useAccount } from "../hooks/account";
import styles from "../ui/views.module.scss";
import { MatchesPanel } from "./MatchesPanel";
import { RoomsPanel } from "./RoomsPanel";
import { UsersPanel } from "./UsersPanel";

type Tab = "users" | "rooms" | "matches";

const TABS: readonly { id: Tab; label: string }[] = [
  { id: "users", label: "Konta" },
  { id: "rooms", label: "Pokoje" },
  { id: "matches", label: "Mecze 1v1" },
];

/**
 * Panel admina: konta (spec 005, R4), pokoje i mecze 1v1 (spec 007, R5).
 * Widoczny tylko dla roli admin; uprawnienia i tak sprawdza serwer.
 */
export function AdminView({ active }: { active: boolean }) {
  const { user } = useAccount();
  const [tab, setTab] = useState<Tab>("users");
  if (user?.role !== "admin") return null;

  return (
    <div className={styles.view}>
      <div className={styles.tabs} role="tablist" aria-label="Panel admina">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            className={styles.tab}
            aria-selected={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "users" && <UsersPanel active={active} />}
      {tab === "rooms" && <RoomsPanel active={active} />}
      {tab === "matches" && <MatchesPanel active={active} />}
    </div>
  );
}
