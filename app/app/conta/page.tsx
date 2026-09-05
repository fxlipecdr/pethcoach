import { PageContainer } from "@/components/layouts/page-container";
import { Card } from "@/components/ui/primitives";
import { authenticatedData } from "@/features/dogs/data";
import { AccountForm, SignOutForm } from "@/features/profile/account-forms";
import { DataRightsCard } from "@/features/profile/data-rights-card";
import { getUserBillingStatus } from "@/features/billing/data";
import { BillingCard } from "@/features/billing/billing-card";
import { getOrCreateEmailPreferences } from "@/features/emails/data";
import { EmailPreferencesCard } from "@/features/emails/email-preferences-card";

export default async function AccountPage() {
  const { client, user } = await authenticatedData("/app/conta");
  const { data: profile, error } = await client
    .from("profiles")
    .select("name, locale, timezone")
    .eq("id", user.id)
    .maybeSingle();
  if (error || !profile)
    throw new Error("Não foi possível carregar sua conta.");

  const billingStatus = await getUserBillingStatus(client, user.id);
  const emailPrefsRow = await getOrCreateEmailPreferences(user.id, client);
  const emailPreferences = emailPrefsRow
    ? {
        trainingReminders: emailPrefsRow.training_reminders,
        milestoneCelebrations: emailPrefsRow.milestone_celebrations,
        billingNotifications: emailPrefsRow.billing_notifications,
        marketingTips: emailPrefsRow.marketing_tips,
        unsubscribedAll: emailPrefsRow.unsubscribed_all,
      }
    : {
        trainingReminders: true,
        milestoneCelebrations: true,
        billingNotifications: true,
        marketingTips: false,
        unsubscribedAll: false,
      };

  return (
    <PageContainer size="flow">
      <div className="mb-8">
        <p className="eyebrow">SUAS INFORMAÇÕES</p>
        <h1 className="app-heading mt-3">Sua conta, suas escolhas</h1>
        <p className="mt-3 text-muted-foreground">
          O essencial para reconhecer você por aqui.
        </p>
      </div>
      <div className="space-y-6">
        <BillingCard status={billingStatus} />
        <EmailPreferencesCard initialPreferences={emailPreferences} />
        <Card>
          <h2 className="mb-5 text-lg font-semibold">Seu perfil</h2>
          <AccountForm name={profile.name} />
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Acesso por e-mail</h2>
          <p className="mt-3 break-all text-sm">{user.email}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            O endereço foi confirmado no acesso à conta. A alteração de e-mail
            será disponibilizada antes da abertura ao público.
          </p>
        </Card>
        <DataRightsCard />
        <Card>
          <h2 className="text-lg font-semibold">Encerrar sessão</h2>
          <p className="mt-3 mb-5 text-sm leading-relaxed text-muted-foreground">
            Você sairá desta conta neste navegador. Os perfis dos seus cães
            continuarão salvos.
          </p>
          <SignOutForm />
        </Card>
      </div>
    </PageContainer>
  );
}
