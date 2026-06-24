import { FmzPermissionDeniedCard } from '../../../features/access-control/components/FmzPermissionDeniedCard';

export default function PreviewPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-fmz-page px-6">
      <FmzPermissionDeniedCard />
    </main>
  );
}
