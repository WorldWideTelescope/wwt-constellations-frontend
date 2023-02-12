export type OptionalFields<T> = {
  [P in keyof T]?: OptionalFields<T[P]>
}
