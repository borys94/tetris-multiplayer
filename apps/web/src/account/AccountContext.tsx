import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError, api, type Account } from "../api";

interface AccountState {
  /** `undefined` dopóki nie wiemy, `null` dla gościa. */
  user: Account | null | undefined;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AccountContext = createContext<AccountState | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Account | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    api.me().then(
      (me) => !cancelled && setUser(me),
      (error: unknown) => {
        // 401 to gość; przy błędzie sieci też pokazujemy grę jako gość.
        if (!cancelled) setUser(null);
        if (!(error instanceof ApiError)) console.warn("account check failed", error);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setUser(await api.login(username, password));
  }, []);
  const register = useCallback(async (username: string, password: string) => {
    setUser(await api.register(username, password));
  }, []);
  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, login, register, logout }), [user, login, register, logout]);
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount(): AccountState {
  const state = useContext(AccountContext);
  if (!state) throw new Error("useAccount wymaga AccountProvider");
  return state;
}
