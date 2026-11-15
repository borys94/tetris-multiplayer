import type { HTMLAttributes } from 'react'
import { cx } from '../cx'
import styles from './ErrorMessage.module.scss'

/** Komunikat błędu; dla błędów po akcji gracza dodaj `role="alert"`. */
export const ErrorMessage = ({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) => {
  return <p className={cx(styles.error, className)} {...props} />
}
