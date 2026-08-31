const ids = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
const routes = [
  {
    pattern: new RegExp(`^planos/${ids}/hoje$`),
    title: "Um passo possível para hoje",
    phase: "Treino diário previsto para P8.",
  },
  {
    pattern: new RegExp(`^planos/${ids}/progresso$`),
    title: "Cada pequeno avanço conta",
    phase: "Progresso e check-ins previstos para P9.",
  },
  {
    pattern: /^historico$/,
    title: "O caminho de vocês",
    phase: "Histórico previsto para P8 e P9.",
  },
];
export function resolveAppRoute(segments: string[]) {
  return routes.find((route) => route.pattern.test(segments.join("/")));
}
