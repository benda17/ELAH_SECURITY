import { FirstRoundPlan } from "@/components/elah-roadmap/first-round-plan";
import { TwelveMonthGoals } from "@/components/elah-roadmap/twelve-month-goals";

export const metadata = { title: "ELAH · Fundraising" };

export default function FundraisingPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="panel-title">Fundraising</p>
        <h1 className="text-2xl font-semibold">First Round Plan</h1>
      </header>
      <FirstRoundPlan />
      <TwelveMonthGoals />
    </div>
  );
}
