/**
 * Migracje schematu w kolejności. Trzymamy je w kodzie (a nie w plikach .sql),
 * bo serwer jest bundlowany do jednego pliku. Zastosowanych migracji nie zmieniamy:
 * każda zmiana schematu to nowy wpis na końcu listy.
 */
export const MIGRATIONS: readonly { id: number; name: string; sql: string }[] = [
  {
    id: 1,
    name: "konta, sesje i gry",
    sql: `
      create table users (
        id bigint generated always as identity primary key,
        -- login zapisujemy małymi literami, więc unikalność nie zależy od wielkości liter
        username text not null unique check (username ~ '^[a-z0-9_-]{3,20}$'),
        password_hash text not null,
        -- jedyna rola to admin; null oznacza gracza
        role text check (role = 'admin'),
        disabled_at timestamptz,
        created_at timestamptz not null default now()
      );

      create table sessions (
        -- SHA-256 tokenu z cookie; sam token nie trafia do bazy
        id bytea primary key,
        user_id bigint not null references users on delete cascade,
        created_at timestamptz not null default now(),
        expires_at timestamptz not null
      );
      create index sessions_user_id on sessions (user_id);
      create index sessions_expires_at on sessions (expires_at);

      create table games (
        id bigint generated always as identity primary key,
        user_id bigint not null references users on delete cascade,
        score integer not null check (score >= 0),
        lines integer not null check (lines >= 0),
        level integer not null check (level >= 1),
        ticks integer not null check (ticks >= 0),
        ended_at timestamptz not null default now()
      );
      create index games_user_ended on games (user_id, ended_at desc);
      create index games_user_score on games (user_id, score desc);
    `,
  },
];
