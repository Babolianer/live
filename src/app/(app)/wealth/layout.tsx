import { WealthTabs } from "@/components/wealth/wealth-tabs";

export default function WealthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Vermögen</h1>
        <p className="text-sm text-foreground-muted">
          Assets, Transaktionen, Sparpläne und Live-Kurse — alles an einem Ort.
        </p>
      </div>
      <WealthTabs />
      {children}
    </div>
  );
}
