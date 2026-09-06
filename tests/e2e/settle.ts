import type { Page } from "@playwright/test";

/**
 * O axe lê a cor computada no instante exato em que roda. Se uma transição CSS
 * ainda estiver correndo, ele mede um quadro intermediário e acusa violação de
 * contraste que não existe: o chip do dia selecionado chegou a ser medido em
 * #6c64d6 sobre #e2e5e3 (3.73:1) quando, em repouso, é #5344CE sobre branco
 * (6.81:1). Era a origem da instabilidade de P8 e P10.
 *
 * Esperar as transições assentarem faz o teste avaliar a interface como o
 * usuário a vê parada. Só transições entram na espera: animações declaradas
 * com `animation` podem ser infinitas (float-soft) e nunca sairiam da lista.
 */
export async function waitForTransitions(page: Page) {
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .filter((animation) => animation.constructor.name === "CSSTransition")
      .every((animation) => animation.playState !== "running"),
  );
}
