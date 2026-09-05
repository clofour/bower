import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getApiKeys } from "@/lib/queries";
import { PageHeading } from "@/components/page-heading";
import { AccountSettingsForm } from "@/components/account-settings-form";

export default async function AccountSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeading
        eyebrow="Settings"
        title="Account"
        description="Manage your profile and security settings."
      />

      <AccountSettingsForm
        userName={user.name}
        userEmail={user.email}
        totpEnabled={user.totpEnabled}
        apiKeys={await getApiKeys(user.id)}
      />
    </div>
  );
}
