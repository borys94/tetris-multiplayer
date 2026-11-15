import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/**
 * Styl funkcji: tylko funkcje strzałkowe. `function` zostaje w metodach klas i obiektów,
 * które w AST też są `FunctionExpression`.
 */
const NO_FUNCTION_EXPRESSION = {
  selector:
    "FunctionExpression:not(MethodDefinition > FunctionExpression, Property[method=true] > FunctionExpression, Property[kind='get'] > FunctionExpression, Property[kind='set'] > FunctionExpression)",
  message: 'Używaj funkcji strzałkowej zamiast `function`.',
}

const WEB = 'apps/web/src'

/** Domeny weba (`apps/web/src/domains/<domena>`, ADR-0012). */
const WEB_DOMAINS = ['account', 'admin-panel', 'game', 'leaderboard', 'versus']

/** Publiczne API domeny dla innych domen: tylko provider i hook konta. */
const WEB_SHARED = { account: 'use-account' }

/** `core/` i modele domen (`domains/<domena>/model/`) to czysty TS: bez Reacta i styli (ADR-0012). */
const NO_REACT = {
  paths: ['react', 'react-dom', 'react-dom/client', 'react-router', 'react-router/dom'].map(
    (name) => ({
      name,
      message: 'Czysty TS: React tylko w komponentach i hookach weba.',
    }),
  ),
  patterns: [{ group: ['*.scss'], message: 'Czysty TS nie zna styli.' }],
}

/** Zakaz importu z katalogów `targets` (ścieżki względne, żeby nie złapać pakietów npm, np. `ws`). */
const forbid = (owner, targets) => {
  return targets.map((target) => ({
    group: [`**/${target}`, `**/${target}/*`],
    message: `${owner} nie może zależeć od ${target}/ (granice warstw).`,
  }))
}

/**
 * Zakaz importu innych domen weba; z domeny z `WEB_SHARED` wolno brać tylko jej publiczny moduł.
 * Regex zamiast wzorca gitignore, bo ten nie pozwala wyjąć pliku z wykluczonego katalogu.
 */
const forbidDomains = (owner, except) => {
  return WEB_DOMAINS.filter((domain) => domain !== except).map((domain) => {
    const shared = WEB_SHARED[domain] ? `(?!${WEB_SHARED[domain]}$)` : ''
    return {
      regex: `^\\.{1,2}/(.*/)?${domain}(/${shared}|$)`,
      message: `${owner} nie może zależeć od domeny ${domain}/ (ADR-0012).`,
    }
  })
}

/**
 * Granice weba (ADR-0012). Każdy plik trafia do jednego wpisu, bo kolejny wpis z
 * `no-restricted-imports` nadpisałby poprzedni zamiast go uzupełnić.
 */
const webRestrictions = () => {
  const layer = (dir, patterns, { paths = [], ignores = [] } = {}) => ({
    files: [`${WEB}/${dir}/**/*.{ts,tsx}`],
    ignores,
    rules: { 'no-restricted-imports': ['error', { paths, patterns }] },
  })
  const pure = { paths: NO_REACT.paths }
  const coreBase = [
    ...forbid('core', ['app', 'domains', 'board', 'hooks', 'ui']),
    ...NO_REACT.patterns,
  ]
  const coreDirs = { api: ['net', 'play'], net: ['api', 'play'], play: ['api', 'net'] }

  return [
    {
      files: [`${WEB}/core/*.ts`, `${WEB}/*.ts`],
      rules: { 'no-restricted-imports': ['error', { ...pure, patterns: coreBase }] },
    },
    ...Object.entries(coreDirs).map(([dir, targets]) =>
      layer(`core/${dir}`, [...coreBase, ...forbid(`core/${dir}`, targets)], pure),
    ),
    ...WEB_DOMAINS.flatMap((domain) => [
      layer(`domains/${domain}`, [...forbid(domain, ['app']), ...forbidDomains(domain, domain)], {
        ignores: [`${WEB}/domains/${domain}/model/**`],
      }),
      layer(
        `domains/${domain}/model`,
        [
          ...forbid(`${domain}/model`, ['app', 'board', 'hooks', 'ui']),
          {
            // Korzeń domeny to jej komponenty i hooki (React); model ich nie zna.
            regex: '^\\.\\./[^.]',
            message: `${domain}/model nie może zależeć od komponentów domeny.`,
          },
          ...forbidDomains(`${domain}/model`, domain),
          ...NO_REACT.patterns,
        ],
        pure,
      ),
    ]),
    layer('board', forbid('board', ['app', 'domains'])),
    layer('hooks', forbid('hooks', ['app', 'domains', 'board', 'ui'])),
    layer('ui', forbid('ui', ['app', 'domains', 'board', 'hooks', 'core'])),
  ]
}

/**
 * Granice katalogów serwera (ADR-0011): dla każdego katalogu w `root` lista katalogów,
 * których kod (bez testów) nie może importować, plus wspólne zakazy (`extra`). Wszystko składa punkt wejścia
 * (`main.ts`).
 */
const boundaries = (root, forbidden, extra = { paths: [], patterns: [] }) => {
  return Object.entries(forbidden).map(([dir, targets]) => ({
    files: [`${root}/${dir}/**/*.{ts,tsx}`],
    ignores: ['**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
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
  }))
}

export default defineConfig(
  globalIgnores(['**/dist/', '**/coverage/', '.yarn/']),
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ['*.ts'] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['*.js', '*.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat['recommended-latest']],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['apps/server/src/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    rules: {
      'func-style': ['error', 'expression'],
      'prefer-arrow-callback': 'error',
      'no-restricted-syntax': ['error', NO_FUNCTION_EXPRESSION],
    },
  },
  ...boundaries('apps/server/src', {
    // Domena gry i pokoi: czysta logika, bez bazy, kont, transportu i warstwy aplikacji.
    game: ['rooms', 'play', 'accounts', 'db', 'http', 'ws'],
    rooms: ['play', 'accounts', 'db', 'http', 'ws'],
    // Konta i baza nie wiedzą o transporcie ani o rozgrywce w czasie rzeczywistym.
    accounts: ['game', 'rooms', 'play', 'http', 'ws'],
    db: ['rooms', 'play', 'accounts', 'http', 'ws'],
    // Warstwa aplikacji nie zna transportu; transporty nie sięgają do bazy z pominięciem warstw.
    play: ['http', 'ws'],
    ws: ['http', 'db'],
    http: ['ws', 'play'],
    observability: ['game', 'rooms', 'play', 'accounts', 'db', 'http', 'ws'],
  }),
  // Web (ADR-0012): `app/` składa całość; domeny nie znają siebie nawzajem, poza publicznym API konta.
  ...webRestrictions(),
  {
    files: [`${WEB}/core/**/*.{ts,tsx}`, `${WEB}/domains/*/model/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-syntax': [
        'error',
        NO_FUNCTION_EXPRESSION,
        { selector: 'JSXElement, JSXFragment', message: 'JSX tylko w komponentach weba.' },
      ],
    },
  },
  prettier,
  // Po `eslint-config-prettier`, który wyłącza `curly`; w trybie "all" nie gryzie się z Prettierem.
  { rules: { curly: ['error', 'all'] } },
)
