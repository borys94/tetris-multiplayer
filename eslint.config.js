import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

/** Widoki aplikacji web (`apps/web/src/components/<widok>`). */
const WEB_FEATURES = ["account", "admin", "leaderboard", "solo", "versus"];

/** Rdzeń weba nie zależy od Reacta, styli ani komponentów (ADR-0011). */
const NO_REACT = {
  paths: ["react", "react-dom", "react-dom/client"].map((name) => ({
    name,
    message: "React tylko w apps/web/src/components.",
  })),
  patterns: [
    { group: ["**/components/*", "*.scss"], message: "Rdzeń weba nie zna komponentów ani styli." },
  ],
};

function except(list, ...excluded) {
  return list.filter((item) => !excluded.includes(item));
}

export default defineConfig(
  globalIgnores(["**/dist/", "**/coverage/", ".yarn/"]),
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ["*.ts"] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["*.js", "*.ts"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["**/*.js"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ["apps/web/src/**/*.{ts,tsx}"],
    extends: [reactHooks.configs.flat["recommended-latest"]],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["apps/server/src/**/*.ts"],
    languageOptions: { globals: globals.node },
  },
  ...boundaries("apps/server/src", {
    // Domena gry i pokoi: czysta logika, bez bazy, kont, transportu i warstwy aplikacji.
    game: ["rooms", "play", "accounts", "db", "http", "ws"],
    rooms: ["play", "accounts", "db", "http", "ws"],
    // Konta i baza nie wiedzą o transporcie ani o rozgrywce w czasie rzeczywistym.
    accounts: ["game", "rooms", "play", "http", "ws"],
    db: ["rooms", "play", "accounts", "http", "ws"],
    // Warstwa aplikacji nie zna transportu; transporty nie sięgają do bazy z pominięciem warstw.
    play: ["http", "ws"],
    ws: ["http", "db"],
    http: ["ws", "play"],
    observability: ["game", "rooms", "play", "accounts", "db", "http", "ws"],
  }),
  // Web: React tylko w `components/`; rdzeń (`api`, `net`, `play`, `state`, `app`) to czysty TS.
  ...boundaries(
    "apps/web/src",
    {
      api: ["net", "play", "state", "app"],
      net: ["api", "play", "state", "app"],
      play: ["api", "net", "state", "app"],
      app: ["api", "net", "play", "state"],
      state: [],
    },
    NO_REACT,
  ),
  {
    files: ["apps/web/src/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: { "no-restricted-imports": ["error", NO_REACT] },
  },
  {
    files: ["apps/web/src/{api,net,play,state,app}/**/*.{ts,tsx}", "apps/web/src/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: "JSXElement, JSXFragment", message: "JSX tylko w apps/web/src/components." },
      ],
    },
  },
  // Widoki w `components/` nie importują siebie nawzajem; wspólne są `hooks/` i `ui/`.
  ...boundaries("apps/web/src/components", {
    account: except(WEB_FEATURES, "account"),
    admin: except(WEB_FEATURES, "admin"),
    leaderboard: except(WEB_FEATURES, "leaderboard"),
    solo: except(WEB_FEATURES, "solo"),
    versus: except(WEB_FEATURES, "versus"),
    ui: [...WEB_FEATURES, "hooks"],
    hooks: [...WEB_FEATURES, "ui"],
  }),
  prettier,
);

/**
 * Granice katalogów aplikacji (ADR-0011): dla każdego katalogu w `root` lista katalogów,
 * których kod (bez testów) nie może importować, plus wspólne zakazy (`extra`). Wszystko składa punkt wejścia
 * (`main.ts` serwera, `App.tsx` weba).
 */
function boundaries(root, forbidden, extra = { paths: [], patterns: [] }) {
  return Object.entries(forbidden).map(([dir, targets]) => ({
    files: [`${root}/${dir}/**/*.{ts,tsx}`],
    ignores: ["**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: extra.paths,
          patterns: [
            ...targets.map((target) => ({
              // Tylko ścieżki względne do plików w katalogu, żeby nie złapać pakietów npm (np. `ws`).
              group: [`**/${target}/*`],
              message: `${root}/${dir} nie może zależeć od ${target}/ (granice warstw, ADR-0011).`,
            })),
            ...extra.patterns,
          ],
        },
      ],
    },
  }));
}
