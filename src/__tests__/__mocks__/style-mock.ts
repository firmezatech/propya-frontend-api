// CSS Module mock — returns a Proxy that maps any className lookup to itself.
// This satisfies `styles.foo` references in components without actual CSS.
const handler: ProxyHandler<Record<string, string>> = {
  get: (_target, prop: string) => prop,
};
export default new Proxy({} as Record<string, string>, handler);
