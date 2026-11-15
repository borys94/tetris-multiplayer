import type { HTMLAttributes } from 'react'
import { cx } from '../cx'
import styles from './Code.module.scss'

/** Kod do przepisania lub skopiowania: kod pokoju, link, hasło tymczasowe. */
export const Code = ({ className, ...props }: HTMLAttributes<HTMLElement>) => {
  return <code className={cx(styles.code, className)} {...props} />
}
