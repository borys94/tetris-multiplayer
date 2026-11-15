import { Button } from '../Button/Button'
import styles from './Tabs.module.scss'

export interface Tab<T extends string> {
  id: T
  label: string
}

interface TabsProps<T extends string> {
  tabs: readonly Tab<T>[]
  selected: T
  onSelect: (id: T) => void
  label?: string
}

/** Zakładki (`role="tablist"`); treść zakładki renderuje właściciel. */
export const Tabs = <T extends string>({ tabs, selected, onSelect, label }: TabsProps<T>) => {
  return (
    <div className={styles.tabs} role="tablist" aria-label={label}>
      {tabs.map(({ id, label }) => (
        <Button
          key={id}
          variant="secondary"
          role="tab"
          className={styles.tab}
          aria-selected={selected === id}
          onClick={() => onSelect(id)}
        >
          {label}
        </Button>
      ))}
    </div>
  )
}
