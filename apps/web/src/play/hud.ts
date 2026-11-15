/**
 * Czy dwa stany HUD-u są takie same (pole po polu, listy po elementach). React renderuje
 * wtedy dalej poprzedni obiekt, więc pętla 60 ticków/s nie wymusza renderów.
 */
export function sameHud<T extends object>(a: T, b: T): boolean {
  return (Object.keys(b) as (keyof T)[]).every((key) => {
    const [x, y] = [a[key], b[key]];
    if (Array.isArray(x) && Array.isArray(y)) {
      return x.length === y.length && x.every((item, i) => item === y[i]);
    }
    return x === y;
  });
}
