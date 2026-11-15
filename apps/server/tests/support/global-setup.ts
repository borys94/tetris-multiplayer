import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import type { TestProject } from 'vitest/node'

declare module 'vitest' {
  export interface ProvidedContext {
    /** Adres serwera Postgresa z Testcontainers (baza `postgres`). */
    postgresUrl: string
  }
}

let container: StartedPostgreSqlContainer | undefined

/** Jeden kontener Postgresa na cały przebieg testów serwera. */
export const setup = async (project: TestProject) => {
  container = await new PostgreSqlContainer('postgres:17-alpine').start()
  project.provide('postgresUrl', container.getConnectionUri())
}

export const teardown = async () => {
  await container?.stop()
}
