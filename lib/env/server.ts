import "server-only";
import { parseEnvironment, serverEnvSchema } from "./schema";

export function getServerEnv() {
  return parseEnvironment(serverEnvSchema, process.env);
}
