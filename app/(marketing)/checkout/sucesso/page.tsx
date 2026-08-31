import { FoundationState } from "@/components/pethcoach/foundation-state";
export default function CheckoutPage() {
  return (
    <FoundationState
      title="Não há pagamento confirmado nesta versão"
      description="Visitar esta página não confirma uma compra e não libera acesso a planos."
      phase="Na fase P10, o acesso dependerá exclusivamente de confirmação verificada no servidor."
    />
  );
}
