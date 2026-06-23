import { FmzComingSoonHero } from '../../../../features/coming-soon/components';

export default function ComingSoonPage() {
  return (
    <FmzComingSoonHero
      title="Esta página ainda não está disponível"
      description="Estamos trabalhando para entregar esta funcionalidade em breve. Quando estiver pronta, você será notificado automaticamente."
      homeHref="/connected/dashboard"
      homeLabel="Ir ao início"
    />
  );
}
