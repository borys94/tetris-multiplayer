// @vitest-environment node
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Konwencja komponentów (spec fundament-repo): komponent ze stylami to folder `Nazwa/`
 * z `Nazwa.tsx` i `Nazwa.module.scss`, bez `index.ts`; komponent bez styli to sam `Nazwa.tsx`.
 * Wspólne arkusze są tylko w `SHARED_STYLES`.
 */
const SRC = fileURLToPath(new URL('../src', import.meta.url))
const SHARED_STYLES = ['board/board.module.scss']

const files = (dir: string): string[] => {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? files(path) : [relative(SRC, path)]
  })
}

const all = files(SRC)
const styles = all.filter((file) => file.endsWith('.module.scss'))
const components = all.filter((file) => file.endsWith('.tsx'))

describe('konwencja komponentów', () => {
  it('arkusz komponentu leży w folderze komponentu, obok Nazwa.tsx i bez index.ts', () => {
    const wrong = styles
      .filter((file) => !SHARED_STYLES.includes(file))
      .filter((file) => {
        const name = basename(file, '.module.scss')
        const folder = dirname(file)
        return (
          basename(folder) !== name ||
          !existsSync(join(SRC, folder, `${name}.tsx`)) ||
          ['index.ts', 'index.tsx'].some((index) => existsSync(join(SRC, folder, index)))
        )
      })
    expect(wrong).toEqual([])
  })

  it('komponent importuje tylko własny arkusz albo wspólny', () => {
    const wrong = components.flatMap((file) => {
      const source = readFileSync(join(SRC, file), 'utf8')
      const own = `./${basename(file, '.tsx')}.module.scss`
      return [...source.matchAll(/from "([^"]+\.module\.scss)"/g)]
        .map((match) => match[1]!)
        .filter((path) => {
          const target = relative(SRC, join(SRC, dirname(file), path))
          return path !== own && !SHARED_STYLES.includes(target)
        })
        .map((path) => `${file} → ${path}`)
    })
    expect(wrong).toEqual([])
  })
})
