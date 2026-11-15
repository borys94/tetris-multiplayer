import { extname } from 'node:path'
import express, { type Express, type Router } from 'express'
import { observeHttp } from '../observability/access-log'
import { log, type Logger } from '../observability/logger'

export interface AppOptions {
  /** Wersja aplikacji (SHA commita) zwracana w `/health`. */
  version: string
  /** Katalog ze zbudowanym frontendem; bez niego serwer nie serwuje plików statycznych. */
  staticDir?: string
  /** API pod `/api` (konta, ranking, admin); bez niego serwer serwuje tylko grę. */
  api?: Router
  /** Logger dla logu dostępu; domyślnie logger procesu. */
  logger?: Logger
  /** Gotowość na nowy ruch (`/ready`); fałsz, gdy pod dogrywa mecze przed zamknięciem. */
  isReady?: () => boolean
}

export const createApp = ({
  version,
  staticDir,
  api,
  logger = log,
  isReady = () => true,
}: AppOptions): Express => {
  const app = express()
  app.disable('x-powered-by')
  app.use(observeHttp(logger))

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', version })
  })

  // Readiness (spec infrastruktura): przy deployu stary pod przestaje dostawać nowy ruch, ale żyje
  // (liveness na `/health`), dopóki nie skończą się trwające mecze.
  app.get('/ready', (_req, res) => {
    if (isReady()) {
      res.json({ status: 'ready' })
    } else {
      res.status(503).json({ status: 'draining' })
    }
  })

  if (api) {
    app.use('/api', api)
  }

  if (staticDir) {
    app.use(express.static(staticDir, { index: 'index.html', maxAge: '1h' }))
    // Ścieżki widoków (`/ranking`, `/pokoj/<kod>`) obsługuje router weba, więc dostają `index.html`.
    // Pliki (z rozszerzeniem) i `/api` kończą się 404, żeby brakujący skrypt nie dostał HTML-a.
    app.get(/^(?!\/api(\/|$)).*/, (req, res, next) => {
      if (extname(req.path)) {
        return next()
      }
      res.sendFile('index.html', { root: staticDir, maxAge: '1h' })
    })
  }

  return app
}
