# Templates de comunicação

`auth/` contém os templates transacionais de login e confirmação da P2, configurados no Supabase Auth com SMTP Resend. Preservar `{{ .ConfirmationURL }}` para o fluxo PKCE. Assuntos: `Seu link de acesso ao PethCoach` e `Confirme seu acesso ao PethCoach`.

Reservado para P12: welcome, day1 incomplete, checkin reminder, milestone, payment confirmed, payment failed e re-engagement. Implementar com Resend + React Email, consentimento por finalidade, unsubscribe e idempotência. O adapter de e-mails do produto continua desativado; isso não desativa os e-mails transacionais do Supabase Auth.
