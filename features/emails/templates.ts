import {
  EmailTemplateKey,
  TEMPLATE_TO_CATEGORY,
  CATEGORY_LABELS,
} from "./contracts";

interface EmailRenderOptions {
  siteUrl?: string;
  unsubscribeToken?: string;
}

interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const DEFAULT_SITE_URL = "https://coach.peth.com.br";

function renderBaseLayout({
  title,
  preheader,
  contentHtml,
  ctaText,
  ctaUrl,
  category,
  siteUrl = DEFAULT_SITE_URL,
  unsubscribeToken,
}: {
  title: string;
  preheader: string;
  contentHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  category: keyof typeof CATEGORY_LABELS;
  siteUrl?: string;
  unsubscribeToken?: string;
}): string {
  const categoryInfo = CATEGORY_LABELS[category];
  const unsubCategoryUrl = unsubscribeToken
    ? `${siteUrl}/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}&category=${encodeURIComponent(category)}`
    : `${siteUrl}/unsubscribe`;
  const unsubAllUrl = unsubscribeToken
    ? `${siteUrl}/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}&all=true`
    : `${siteUrl}/unsubscribe`;
  const preferencesUrl = `${siteUrl}/app/conta`;
  const privacyUrl = `${siteUrl}/politica-de-privacidade`;

  const ctaButtonHtml =
    ctaText && ctaUrl
      ? `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
          <tr>
            <td align="center" style="border-radius: 8px; background-color: #EA580C;">
              <a href="${ctaUrl}" target="_blank" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; color: #FFFFFF; text-decoration: none; padding: 13px 26px; border-radius: 8px; display: inline-block; min-height: 24px; box-sizing: border-box;">
                ${ctaText}
              </a>
            </td>
          </tr>
        </table>
      `
      : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; color: #1E293B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <!-- Preheader text for inbox preview -->
  <div style="display: none; font-size: 1px; color: #F8FAFC; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${preheader}
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0F172A; text-align: left; border-bottom: 3px solid #EA580C;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <span style="font-size: 20px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px;">Peth<span style="color: #FB923C;">Coach</span></span>
                  </td>
                  <td align="right">
                    <span style="font-size: 12px; color: #94A3B8; font-weight: 500;">Treino Positivo</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; font-size: 15px; line-height: 1.6; color: #334155;">
              <h1 style="font-size: 20px; font-weight: 700; color: #0F172A; margin-top: 0; margin-bottom: 16px; letter-spacing: -0.3px;">
                ${title}
              </h1>

              ${contentHtml}

              ${ctaButtonHtml}

              <p style="margin-top: 24px; margin-bottom: 0; font-size: 14px; color: #64748B;">
                Com carinho e reforço positivo,<br>
                <strong>Equipe PethCoach</strong>
              </p>
            </td>
          </tr>

          <!-- Footer with Unsubscribe and LGPD Compliance -->
          <tr>
            <td style="padding: 24px 32px; background-color: #F1F5F9; border-top: 1px solid #E2E8F0; font-size: 12px; line-height: 1.5; color: #64748B;">
              <p style="margin-top: 0; margin-bottom: 10px;">
                <strong>Categoria da mensagem:</strong> ${categoryInfo.title}<br>
                ${categoryInfo.description}
              </p>
              <p style="margin-top: 0; margin-bottom: 12px;">
                Respeitamos sua privacidade e seu tempo. O PethCoach não utiliza urgência falsa ou penalidades de ofensiva.
              </p>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 12px; color: #64748B;">
                    <a href="${preferencesUrl}" style="color: #475569; text-decoration: underline; font-weight: 500;">Preferências de E-mail</a>
                    &nbsp;•&nbsp;
                    <a href="${unsubCategoryUrl}" style="color: #475569; text-decoration: underline; font-weight: 500;">Cancelar esta categoria</a>
                    &nbsp;•&nbsp;
                    <a href="${unsubAllUrl}" style="color: #475569; text-decoration: underline; font-weight: 500;">Cancelar todos</a>
                    &nbsp;•&nbsp;
                    <a href="${privacyUrl}" style="color: #475569; text-decoration: underline; font-weight: 500;">Privacidade</a>
                  </td>
                </tr>
              </table>
              <p style="margin-top: 12px; margin-bottom: 0; font-size: 11px; color: #94A3B8;">
                PethCoach Tecnologia Ltda. • Treinamento canino gentil e baseado em evidências.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderEmailTemplate(
  templateKey: EmailTemplateKey,
  data: Record<string, unknown> = {},
  options: EmailRenderOptions = {},
): RenderedEmail {
  const siteUrl = options.siteUrl || DEFAULT_SITE_URL;
  const category = TEMPLATE_TO_CATEGORY[templateKey];

  switch (templateKey) {
    case "welcome": {
      const dogName = (data.dogName as string) || "seu cão";
      const planDay1Url = (data.planDay1Url as string) || `${siteUrl}/app`;
      const title = `Bem-vindo ao PethCoach! O plano de ${dogName} está pronto`;
      const preheader = `Comece pelo Dia 1: treinos gentis de apenas 5 a 10 minutos.`;
      const contentHtml = `
        <p>Estamos muito felizes em receber você e <strong>${dogName}</strong> no PethCoach!</p>
        <p>Nosso método é 100% focado em reforço positivo, paciência e respeito aos limites do seu cão. Valorizamos cada pequeno acerto com incentivos gentis, petiscos e carinho, construindo uma convivência harmoniosa.</p>
        <p>O <strong>Dia 1 do plano</strong> já está liberado na sua conta. Ele foi planejado para durar entre 5 e 10 minutos e serve como uma primeira vitória fácil e divertida para fortalecer o vínculo entre vocês.</p>
      `;
      const text = `Bem-vindo ao PethCoach! O plano de ${dogName} está pronto.\n\nComece pelo Dia 1: ${planDay1Url}\n\nTreino positivo e gentil para o bem-estar do seu cão.`;
      return {
        subject: title,
        html: renderBaseLayout({
          title,
          preheader,
          contentHtml,
          ctaText: "Começar o Treino do Dia 1",
          ctaUrl: planDay1Url,
          category,
          siteUrl,
          unsubscribeToken: options.unsubscribeToken,
        }),
        text,
      };
    }

    case "day1_incomplete": {
      const dogName = (data.dogName as string) || "seu cão";
      const planUrl = (data.planUrl as string) || `${siteUrl}/app`;
      const title = `Tudo bem ir no seu ritmo: o Dia 1 de ${dogName} está à sua espera`;
      const preheader = `Sabemos que a rotina é corrida. 5 a 10 minutos de carinho e aprendizado sem pressa.`;
      const contentHtml = `
        <p>Sabemos que dias corridos acontecem e tudo bem! No aprendizado de <strong>${dogName}</strong>, a consistência calma vale muito mais do que a pressa.</p>
        <p>O treino do Dia 1 é leve, acolhedor e leva menos de 10 minutos. Não há perda de progresso, nem cobranças: o plano continua disponível sempre que você tiver um tempinho tranquilo.</p>
      `;
      const text = `Tudo bem ir no seu ritmo: o Dia 1 de ${dogName} espera por você.\n\nAcesse quando puder: ${planUrl}`;
      return {
        subject: title,
        html: renderBaseLayout({
          title,
          preheader,
          contentHtml,
          ctaText: "Ver o Treino do Dia 1",
          ctaUrl: planUrl,
          category,
          siteUrl,
          unsubscribeToken: options.unsubscribeToken,
        }),
        text,
      };
    }

    case "checkin_reminder": {
      const dogName = (data.dogName as string) || "seu cão";
      const checkinUrl = (data.checkinUrl as string) || `${siteUrl}/app`;
      const title = `Como foi o treino com ${dogName} hoje?`;
      const preheader = `Conte em 30 segundos como seu cão reagiu para calibrarmos o próximo passo.`;
      const contentHtml = `
        <p>Acompanhar as reações e a calma de <strong>${dogName}</strong> é a chave para o sucesso do nosso método.</p>
        <p>Leva apenas 30 segundos para responder o check-in de hoje. Suas respostas ajudam nosso sistema a avaliar se o ritmo de amanhã deve ser mantido ou desacelerado para garantir o bem-estar do seu cão.</p>
      `;
      const text = `Como foi o treino com ${dogName} hoje? Responda o check-in rápido: ${checkinUrl}`;
      return {
        subject: title,
        html: renderBaseLayout({
          title,
          preheader,
          contentHtml,
          ctaText: "Fazer Check-in Rápido",
          ctaUrl: checkinUrl,
          category,
          siteUrl,
          unsubscribeToken: options.unsubscribeToken,
        }),
        text,
      };
    }

    case "milestone": {
      const dogName = (data.dogName as string) || "seu cão";
      const milestoneTitle = (data.milestoneTitle as string) || "Novo Marco Conquistado!";
      const milestoneDescription =
        (data.milestoneDescription as string) ||
        "Vocês deram um passo fundamental na evolução comportamental com respeito e reforço positivo.";
      const timelineUrl = (data.timelineUrl as string) || `${siteUrl}/app/plano?tab=timeline`;
      const title = `Parabéns! ${dogName} conquistou um novo marco 🎉`;
      const preheader = `${milestoneTitle}: veja o progresso na linha do tempo.`;
      const contentHtml = `
        <p>Cada avanço merece ser comemorado! <strong>${dogName}</strong> acabou de desbloquear uma nova conquista no programa:</p>
        <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 14px 18px; margin: 18px 0; border-radius: 6px;">
          <h2 style="margin: 0 0 6px 0; font-size: 16px; color: #92400E; font-weight: 700;">🏆 ${milestoneTitle}</h2>
          <p style="margin: 0; font-size: 14px; color: #78350F; line-height: 1.5;">${milestoneDescription}</p>
        </div>
        <p>Essa vitória reflete a paciência e a dedicação que você tem demonstrado. Continue no mesmo ritmo amoroso!</p>
      `;
      const text = `Parabéns! ${dogName} conquistou o marco: ${milestoneTitle}.\n\nVeja a linha do tempo: ${timelineUrl}`;
      return {
        subject: title,
        html: renderBaseLayout({
          title,
          preheader,
          contentHtml,
          ctaText: "Ver Linha do Tempo",
          ctaUrl: timelineUrl,
          category,
          siteUrl,
          unsubscribeToken: options.unsubscribeToken,
        }),
        text,
      };
    }

    case "payment_confirmed": {
      const dogName = (data.dogName as string) || "seu cão";
      const appUrl = (data.appUrl as string) || `${siteUrl}/app`;
      const title = `Pagamento confirmado: programa completo de ${dogName} liberado!`;
      const preheader = `Acesso total aos 14 dias de treino, adaptações de ritmo e linha do tempo.`;
      const contentHtml = `
        <p>Confirmamos o seu pagamento com sucesso. Seu acesso ao <strong>Programa Completo do PethCoach</strong> para <strong>${dogName}</strong> está 100% liberado!</p>
        <p>A partir de agora, você tem acesso irrestrito a:</p>
        <ul style="margin: 12px 0 18px 20px; padding: 0; color: #334155;">
          <li style="margin-bottom: 6px;">Os 14 dias de progressão estruturada e módulos validados.</li>
          <li style="margin-bottom: 6px;">Adaptação automática do cronograma baseada nas reações do seu cão.</li>
          <li style="margin-bottom: 6px;">Linha do tempo evolutiva com 5 marcos comportamentais.</li>
          <li style="margin-bottom: 6px;">Pausas conscientes sem penalidade de ofensiva ou culpa.</li>
        </ul>
        <p>Você pode gerenciar os dados da sua assinatura a qualquer momento na aba Conta do aplicativo.</p>
      `;
      const text = `Pagamento confirmado: programa completo de ${dogName} liberado!\n\nAcesse agora: ${appUrl}`;
      return {
        subject: title,
        html: renderBaseLayout({
          title,
          preheader,
          contentHtml,
          ctaText: "Acessar Meu Programa",
          ctaUrl: appUrl,
          category,
          siteUrl,
          unsubscribeToken: options.unsubscribeToken,
        }),
        text,
      };
    }

    case "payment_failed": {
      const portalUrl = (data.portalUrl as string) || `${siteUrl}/app/conta`;
      const title = "Aviso sobre sua assinatura no PethCoach";
      const preheader = "Não conseguimos processar o pagamento da sua renovação. Veja como atualizar.";
      const contentHtml = `
        <p>Entramos em contato para avisar que a operadora de cartão não conseguiu processar o pagamento da renovação da sua assinatura no PethCoach.</p>
        <p>Não se preocupe: seu acesso não foi interrompido de forma imediata. Para que o treino do seu cão continue sem interrupções nos próximos dias, pedimos que atualize os dados do seu cartão ou selecione outra forma de pagamento pelo portal da conta.</p>
      `;
      const text = `Aviso sobre sua assinatura no PethCoach. Atualize seus dados de pagamento: ${portalUrl}`;
      return {
        subject: title,
        html: renderBaseLayout({
          title,
          preheader,
          contentHtml,
          ctaText: "Atualizar Dados de Pagamento",
          ctaUrl: portalUrl,
          category,
          siteUrl,
          unsubscribeToken: options.unsubscribeToken,
        }),
        text,
      };
    }

    case "re_engagement": {
      const dogName = (data.dogName as string) || "seu cão";
      const resumeUrl = (data.resumeUrl as string) || `${siteUrl}/app`;
      const title = `Respeitar o tempo de ${dogName} faz parte do treino`;
      const preheader = `Sentimos sua falta, mas cada cão aprende no seu ritmo. Retome quando quiser.`;
      const contentHtml = `
        <p>Notamos que você e <strong>${dogName}</strong> deram uma pausa nos últimos dias. Queremos tranquilizar você: <strong>isso é perfeitamente normal</strong>.</p>
        <p>Na ciência do comportamento canino, respeitar períodos de descanso ou rotinas agitadas da família é muito melhor do que treinar com pressa ou estresse.</p>
        <p>O plano de treino de ${dogName} continua salvo e intacto, aguardando exatamente de onde vocês pararam. Quando estiverem prontos para uma sessão de 5 minutos, estaremos aqui.</p>
      `;
      const text = `Respeitar o tempo de ${dogName} faz parte do treino. Retome quando quiser: ${resumeUrl}`;
      return {
        subject: title,
        html: renderBaseLayout({
          title,
          preheader,
          contentHtml,
          ctaText: "Retomar Quando Quiser",
          ctaUrl: resumeUrl,
          category,
          siteUrl,
          unsubscribeToken: options.unsubscribeToken,
        }),
        text,
      };
    }
  }
}
