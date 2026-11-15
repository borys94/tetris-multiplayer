import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '../cx'
import styles from './Card.module.scss'

interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Nagłówek karty (`h2`); bez niego właściciel może wstawić własny, np. w `Row`. */
  title?: ReactNode
}

export const Card = ({ title, className, children, ...props }: CardProps) => {
  return (
    <section className={cx(styles.card, className)} {...props}>
      {title !== undefined && <h2>{title}</h2>}
      {children}
    </section>
  )
}
