import { UserCog } from "lucide-react";
import { requireCustomer } from "@/lib/auth/guards";
import { writeAuditLog } from "@/lib/logging/logger";
import { tierFromRole, TIER_LABEL } from "@/lib/auth/roles";
import { PageShell, SectionHeader } from "@/components/layout/page-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { TierBadge, Badge } from "@/components/ui/badge";
import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireCustomer();
  const profile = user.customerProfile!;

  await writeAuditLog({
    actionType: "profile_edit_opened",
    page: "/profile",
    toolOrFeatureUsed: "profile_form",
    riskLevel: "low",
    actionOutcome: "viewed",
  });

  return (
    <PageShell>
      <SectionHeader
        title="Profile"
        description="Sensitive changes are logged by changed field name only (never values)."
      />
      <Card>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-2">
              <UserCog className="size-4 text-accent-gold" />
              Personal details
            </span>
          }
          action={
            <div className="flex items-center gap-2">
              <TierBadge tier={profile.tier} />
              <Badge variant="default">
                Customer No. {profile.customerNumber}
              </Badge>
            </div>
          }
        />
        <ProfileForm
          defaults={{
            fullName: profile.fullName,
            email: profile.email,
            phone: profile.phone,
            address: profile.address,
            employmentStatus: profile.employmentStatus,
          }}
        />
      </Card>
    </PageShell>
  );
}
