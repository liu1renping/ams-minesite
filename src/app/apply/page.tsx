import { AppShell } from "@/components/AppShell";
import { VisitorApplicationForm } from "@/components/VisitorApplicationForm";

export default function ApplyPage() {
  return (
    <AppShell pathname="/apply">
      <VisitorApplicationForm />
    </AppShell>
  );
}
