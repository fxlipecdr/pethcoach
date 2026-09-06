import { mergeConfig, defineConfig } from "vitest/config";
import base from "./vitest.config";

/**
 * `mergeConfig` concatena arrays em vez de substituí-los. Passar `include`
 * dentro da mesclagem somava aos padrões da base, e este comando acabava
 * rodando a suíte inteira — 32 arquivos em vez dos 15 de integração — sem
 * nenhum sinal de que estava fazendo mais do que o nome diz.
 *
 * Por isso o `include` é sobrescrito depois da mesclagem.
 */
const config = mergeConfig(base, defineConfig({}));
config.test = {
  ...config.test,
  include: ["tests/integration/**/*.test.ts"],
};

export default config;
