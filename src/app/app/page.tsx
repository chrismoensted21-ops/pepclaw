import { SiteNav } from "@/components/site/nav";
import { MissionControl } from "@/components/mission-control/mission-control";
import { buildDashboard } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default function AppPage() {
  const initial = buildDashboard();
  return (
    <main className="relative min-h-screen bg-black text-ink-100">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-bg opacity-30 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="absolute -top-32 right-0 h-[480px] w-[480px] rounded-full bg-plum-700/[0.08] blur-3xl" />
      </div>
      <SiteNav active="app" />
      <div className="pt-24">
        <MissionControl initial={initial} />
      </div>
    </main>
  );
}
