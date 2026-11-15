/** Skleja nazwy klas, pomijając puste. */
export const cx = (...names: (string | false | null | undefined)[]): string => {
  return names.filter(Boolean).join(' ')
}
