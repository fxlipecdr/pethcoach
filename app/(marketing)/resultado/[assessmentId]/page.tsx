import { FoundationState } from "@/components/pethcoach/foundation-state";
export default function ResultPage() {
  return (
    <FoundationState
      title="Suas respostas foram salvas"
      description="O quiz foi concluído, mas ainda não apresentamos uma orientação nesta etapa. A triagem de segurança precisa ser implementada e validada antes de qualquer resultado."
      phase="As fases P5 e P6 incluirão a triagem determinística, a validação de acesso e o resultado apropriado."
    />
  );
}
