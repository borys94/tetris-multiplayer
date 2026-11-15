import type { Key, ReactNode, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cx } from '../cx'
import styles from './Table.module.scss'

/** Tabela przewijana w poziomie na wąskim ekranie; wiersze składa właściciel. */
export const Table = ({ children, className, ...props }: TableHTMLAttributes<HTMLTableElement>) => {
  return (
    <div className={styles.wrap}>
      <table className={cx(styles.table, className)} {...props}>
        {children}
      </table>
    </div>
  )
}

interface CellProps {
  /** Liczby wyrównane do prawej. */
  numeric?: boolean | undefined
}

export const Th = ({
  numeric,
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & CellProps) => {
  return <th className={cx(numeric && styles.number, className)} {...props} />
}

export const Td = ({
  numeric,
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & CellProps) => {
  return <td className={cx(numeric && styles.number, className)} {...props} />
}

export interface Column<T> extends CellProps {
  header: ReactNode
  cell: (row: T) => ReactNode
}

interface DataTableProps<T> extends Omit<TableHTMLAttributes<HTMLTableElement>, 'children'> {
  columns: readonly Column<T>[]
  rows: readonly T[]
  rowKey: (row: T) => Key
}

/** Tabela z definicji kolumn: nagłówek i po jednym wierszu na element `rows`. */
export const DataTable = <T,>({ columns, rows, rowKey, ...props }: DataTableProps<T>) => {
  return (
    <Table {...props}>
      <thead>
        <tr>
          {columns.map((column, index) => (
            <Th key={index} numeric={column.numeric}>
              {column.header}
            </Th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={rowKey(row)}>
            {columns.map((column, index) => (
              <Td key={index} numeric={column.numeric}>
                {column.cell(row)}
              </Td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  )
}
