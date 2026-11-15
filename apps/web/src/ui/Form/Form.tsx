import type { FormHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { cx } from '../cx'
import styles from './Form.module.scss'

interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
  /** `column`: pola pod sobą (logowanie); `row`: pole i przycisk obok siebie (wyszukiwanie). */
  layout?: 'column' | 'row'
}

export const Form = ({ layout = 'column', className, ...props }: FormProps) => {
  return <form className={cx(styles[layout], className)} {...props} />
}

/** Etykieta z polem w środku, więc pole nie potrzebuje `id`. */
export const Field = ({ label, children }: { label: ReactNode; children: ReactNode }) => {
  return (
    <label className={styles.field}>
      {label}
      {children}
    </label>
  )
}

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => {
  return <input className={cx(styles.input, className)} {...props} />
}
