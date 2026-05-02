'use client';

import { FmzAuthAccessCard } from '../../../features/auth-access/components/FmzAuthAccessCard';

export default function Home() {
  return (
    <section className="flex flex-col justify-start items-center bg-white py-2 gap-20 mb-36 pt-20">
      <div className="w-11/12 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-6 px-2">
        <FmzAuthAccessCard className="lg:w-2/5 w-full items-right max-w-md p-6 py-4 rounded-2xl border bg-white flex flex-col justify-center" />
      </div>
    </section>
  );
}
