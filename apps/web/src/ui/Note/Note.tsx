import type { HTMLAttributes } from 'react'
import { cx } from '../cx'
import styles from './Note.module.scss'

/** Tekst pomocniczy: puste listy, podpowiedzi, stan. */
export const Note = ({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) => {
  return <p className={cx(styles.note, className)} {...props} />
}
