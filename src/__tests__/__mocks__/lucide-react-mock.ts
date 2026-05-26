// Stub for lucide-react — returns a no-op function component for every named export.
// Tests that import from lucide-react (via account-status-config etc.) will receive
// a dummy component instead of the actual SVG, which requires an ESM transform.
const stub = () => null;
stub.displayName = 'LucideIconStub';

module.exports = new Proxy(
  {},
  { get: () => stub },
);
