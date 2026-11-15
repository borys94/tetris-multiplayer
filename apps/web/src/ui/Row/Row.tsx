import type { HTMLAttributes } from 'react'
import { cx } from '../cx'
import styles from './Row.module.scss'

/** Elementy w wierszu, zawijane na wąskim ekranie. */
export const Row = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  return <div className={cx(styles.row, className)} {...props} />
}
