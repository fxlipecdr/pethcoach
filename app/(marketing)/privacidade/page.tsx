import { FoundationState } from "@/components/pethcoach/foundation-state";
export default function PrivacyPage() {
  return (
    <FoundationState
      title="Privacidade com transparência"
      description="Esta versão é restrita ao desenvolvimento. O quiz anônimo armazena no navegador apenas um identificador aleatório, o assessment atual e a etapa; as respostas ficam no projeto de desenvolvimento por até sete dias, protegidas por uma credencial segura em cookie HttpOnly. Quando o acesso estiver configurado, também poderão ser armazenados o e-mail confirmado, o nome opcional do tutor e os perfis de cães cadastrados. Não há rastreamento de marketing ativo. A política completa, a identificação do controlador e o canal para solicitações serão publicados antes da abertura ao público. Este texto não é uma política final de privacidade."
      phase="Consentimento, retenção, exportação e exclusão de dados serão tratados nas fases P11 e P14, com revisão jurídica antes do lançamento."
    />
  );
}
