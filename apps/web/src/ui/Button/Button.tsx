import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.scss'
import { cx } from '../cx'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  size?: 'medium' | 'large'
}

/** Przycisk; domyślnie `type="button"`, więc w formularzu wysyła tylko jawny `type="submit"`. */
export const Button = ({
  variant = 'primary',
  size = 'medium',
  type = 'button',
  className,
  ...props
}: ButtonProps) => {
  return (
    <button
      type={type}
      className={cx(
        styles.button,
        variant === 'secondary' && styles.secondary,
        size === 'large' && styles.large,
        className,
      )}
      {...props}
    />
  )
}
