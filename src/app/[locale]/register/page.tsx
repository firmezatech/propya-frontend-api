import type { Metadata } from 'next';
import { FmzRegisterPage } from '../../../features/auth-access/register/FmzRegisterPage';

export const metadata: Metadata = {
  title: 'Criar conta | Propya',
  description: 'Crie sua conta e comece a investir em imóveis tokenizados.',
};

export default function RegisterRoute() {
  return <FmzRegisterPage />;
}
