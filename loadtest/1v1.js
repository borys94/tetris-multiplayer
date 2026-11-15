// Test obciążeniowy meczów 1v1 (spec obserwowalnosc, S6). Każdy VU to bot: łączy się po WebSockecie,
// dołącza do pokoju z listy publicznych albo zakłada własny, zgłasza gotowość i gra losowymi
// ruchami do końca meczu. Na jednym połączeniu rozgrywa kilka meczów z rzędu (jak gracz,
// który po meczu szuka kolejnego), bo każde nowe połączenie to nowa sesja w pamięci serwera.
//
//   k6 run -e BASE_URL=https://beta.<IP>.sslip.io loadtest/1v1.js
//
// Zmienne: BASE_URL (adres gry), VUS (liczba botów, domyślnie 64 = 32 mecze), DURATION (5m),
// MATCHES (meczów na połączenie, 3), BASIC_AUTH ("login:hasło", gdy środowisko jest za basic auth). Runbook: docs/runbooks/loadtest.md.
/* global __ENV -- zmienne środowiskowe k6 (-e NAZWA=wartość) */
import encoding from 'k6/encoding'
import ws from 'k6/ws'
import { check, sleep } from 'k6'
import { Counter, Trend } from 'k6/metrics'

const BASE_URL = (__ENV.BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const WS_URL = `${BASE_URL.replace(/^http/, 'ws')}/ws`
const PROTOCOL_VERSION = 2
const TICK_MS = 1000 / 60
/** Bot rusza klockiem co 200 ms, a hard drop robi średnio co sekundę (jak żywy gracz). */
const INPUT_EVERY_MS = 200
const HARD_DROP_CHANCE = 0.2
const MATCHES_PER_CONNECTION = Number(__ENV.MATCHES || 3)
/** Połączenie, które tyle czasu nie skończy swoich meczów, bot zamyka. */
const GIVE_UP_MS = 600_000
const MOVES = ['left', 'right', 'rotateCw', 'rotateCcw']

const matchesFinished = new Counter('matches_finished')
const roomErrors = new Counter('room_errors')
const matchDuration = new Trend('match_duration', true)

export const options = {
  scenarios: {
    bots: {
      executor: 'constant-vus',
      vus: Number(__ENV.VUS || 64),
      duration: __ENV.DURATION || '5m',
      // Trwające mecze kończą się po czasie testu, zamiast zrywać połączenia.
      gracefulStop: '3m',
    },
  },
  thresholds: {
    checks: ['rate>0.95'],
    matches_finished: ['count>0'],
    // Progi tylko po to, żeby podsumowanie pokazało błędy według kodu.
    'room_errors{code:room_full}': ['count>=0'],
    'room_errors{code:server_full}': ['count>=0'],
    'room_errors{code:invalid}': ['count>=0'],
  },
}

const pick = (list) => {
  return list[Math.floor(Math.random() * list.length)]
}

export default () => {
  const headers = { Origin: BASE_URL }
  if (__ENV.BASIC_AUTH) {
    headers.Authorization = `Basic ${encoding.b64encode(__ENV.BASIC_AUTH)}`
  }
  let finished = 0

  const res = ws.connect(WS_URL, { headers }, (socket) => {
    /** lobby → joining → room → match */
    let phase = 'lobby'
    let seq = 0
    let matchStartedAt = 0
    let matchStartTick = 0
    const send = (msg) => socket.send(JSON.stringify(msg))
    const createRoom = () => {
      phase = 'joining'
      send({ type: 'createRoom', visibility: 'public' })
    }

    socket.on('open', () => send({ type: 'hello', protocol: PROTOCOL_VERSION }))

    socket.on('message', (raw) => {
      const msg = JSON.parse(raw)
      switch (msg.type) {
        case 'welcome':
          send({ type: 'watchRooms' })
          break
        case 'rooms':
          if (phase !== 'lobby') {
            break
          }
          if (msg.rooms.length === 0) {
            createRoom()
          } else {
            phase = 'joining'
            send({ type: 'joinRoom', code: pick(msg.rooms).code })
          }
          break
        case 'error':
          roomErrors.add(1, { code: msg.code })
          // Ktoś zajął pokój pierwszy: zakładamy własny. Inne błędy kończą próbę.
          if (msg.code === 'room_full' || msg.code === 'room_not_found') {
            createRoom()
          } else if (msg.code !== 'invalid') {
            socket.close()
          }
          break
        case 'room': {
          if (phase === 'joining') {
            phase = 'room'
            send({ type: 'unwatchRooms' })
          }
          const me = msg.players[msg.you]
          if (msg.state === 'waiting' && msg.players.length === 2 && me && !me.ready) {
            send({ type: 'ready' })
          }
          break
        }
        case 'match':
          phase = 'match'
          matchStartedAt = Date.now()
          matchStartTick = msg.tick
          seq = 0
          break
        case 'result':
          finished += 1
          matchesFinished.add(1, { reason: msg.reason })
          matchDuration.add(Date.now() - matchStartedAt)
          check(msg, { 'result names a winner': (m) => typeof m.winner === 'string' })
          send({ type: 'leaveRoom' })
          phase = 'left'
          break
        case 'roomClosed':
          if (phase !== 'left') {
            break
          }
          // Kolejny mecz na tym samym połączeniu: wracamy do listy pokoi.
          if (finished >= MATCHES_PER_CONNECTION) {
            socket.close()
          } else {
            phase = 'lobby'
            send({ type: 'watchRooms' })
          }
          break
      }
    })

    // Tick klienta liczony od wiadomości `match`, jak w przeglądarce (ADR-0006).
    socket.setInterval(() => {
      if (phase !== 'match') {
        return
      }
      const tick = matchStartTick + Math.floor((Date.now() - matchStartedAt) / TICK_MS)
      const actions = [pick(MOVES)]
      if (Math.random() < HARD_DROP_CHANCE) {
        actions.push('hardDrop')
      }
      seq += 1
      send({ type: 'input', seq, tick, actions })
    }, INPUT_EVERY_MS)

    socket.setTimeout(() => socket.close(), GIVE_UP_MS)
  })

  check(res, { 'WebSocket upgrade 101': (r) => r && r.status === 101 })
  check(finished, { 'bot finished a match': (f) => f > 0 })
  // Po nieudanej próbie (np. serwer pełny) nie łączymy się od razu ponownie.
  if (finished === 0) {
    sleep(5)
  }
}
