import { AppShell } from "@/components/app-shell";
import { ImportWorkspace } from "@/components/import/import-workspace";

export default function HomePage() {
  return (
    <AppShell>
      <ImportWorkspace />
    </AppShell>
  );
}
