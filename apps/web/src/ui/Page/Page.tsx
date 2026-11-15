import type { HTMLAttributes } from 'react'
import { cx } from '../cx'
import styles from './Page.module.scss'

/** Kolumna kart widoku poza grą (konto, ranking, panel admina, lobby). */
export const Page = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  return <div className={cx(styles.page, className)} {...props} />
}
