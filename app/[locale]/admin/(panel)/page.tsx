import { Dashboard } from "@/features/admin/components/Dashboard";
import { MISSING_TABS, missingCounts } from "@/features/catalog/missing";

export default async function AdminHome() {
  const counts = await missingCounts();
  // Hidden products are a check, not work left to do, so the dashboard leaves them out.
  const missing = MISSING_TABS.filter((tab) => tab !== "sakriveno").map((tab) => ({
    tab,
    count: counts[tab],
  }));
  return <Dashboard missing={missing} />;
}
