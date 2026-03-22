import { useReadingSettings } from "@/hooks/use-library";
import type { ReadingSettings } from "@/lib/library";

export default function SettingsPage() {
  const { settings, update } = useReadingSettings();

  return (
    <div className="safe-bottom min-h-screen px-4 pt-4">
      <h1 className="mb-6 text-xl font-bold text-foreground">Settings</h1>

      <div className="space-y-6">
        <SettingGroup title="Reading Mode">
          <ToggleRow
            options={["vertical", "horizontal"]}
            value={settings.readingMode}
            onChange={(v) => update({ readingMode: v as ReadingSettings["readingMode"] })}
          />
        </SettingGroup>

        <SettingGroup title="Reading Direction (Horizontal mode)">
          <ToggleRow
            options={["rtl", "ltr"]}
            labels={["Right to Left", "Left to Right"]}
            value={settings.readingDirection}
            onChange={(v) => update({ readingDirection: v as ReadingSettings["readingDirection"] })}
          />
        </SettingGroup>

        <SettingGroup title="Reader Background">
          <ToggleRow
            options={["dark", "light", "sepia"]}
            value={settings.readerBackground}
            onChange={(v) => update({ readerBackground: v as ReadingSettings["readerBackground"] })}
          />
        </SettingGroup>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-medium text-foreground">About MangaShelf</p>
          <p className="mt-1 text-xs text-muted-foreground">
            A personal manga reader PWA inspired by Mihon/Tachiyomi.
            Powered by MangaDex API v5.
          </p>
          <p className="mt-2 text-[10px] text-muted-foreground">v1.0.0 — For personal use only</p>
        </div>
      </div>
    </div>
  );
}

function SettingGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
      {children}
    </div>
  );
}

function ToggleRow({
  options,
  labels,
  value,
  onChange,
}: {
  options: string[];
  labels?: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-2">
      {options.map((opt, i) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`flex-1 rounded-lg py-2.5 text-xs font-medium capitalize transition-colors ${
            value === opt ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
          }`}
        >
          {labels?.[i] || opt}
        </button>
      ))}
    </div>
  );
}
