import { useRef, useState } from "react";
import { useReadingSettings } from "@/hooks/use-library";
import type { ReadingSettings } from "@/lib/library";
import { exportLibraryBackup, importLibraryBackup } from "@/lib/library-enhanced";
import { getDownloadedChapterCount, clearAllDownloads } from "@/lib/offline";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function triggerDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── UI primitives ────────────────────────────────────────────────────────────

function SettingGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {title}
      </p>
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
            value === opt
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          {labels?.[i] || opt}
        </button>
      ))}
    </div>
  );
}

function ActionRow({
  label,
  description,
  buttonLabel,
  onClick,
  danger,
}: {
  label: string;
  description?: string;
  buttonLabel: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <button
        onClick={onClick}
        className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
          danger
            ? "bg-destructive/15 text-destructive hover:bg-destructive/25"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        }`}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { settings, update } = useReadingSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [downloadCount, setDownloadCount] = useState(() => getDownloadedChapterCount());

  // ── Backup ────────────────────────────────────────────────────────────────
  const handleExport = () => {
    try {
      const json = exportLibraryBackup();
      const date = new Date().toISOString().slice(0, 10);
      triggerDownload(json, `mangashelf-backup-${date}.json`);
      toast.success("Backup exported");
    } catch {
      toast.error("Export failed");
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importLibraryBackup(reader.result as string);
        toast.success("Backup restored — reloading…");
        setTimeout(() => window.location.reload(), 1200);
      } catch (err) {
        toast.error(`Import failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    };
    reader.readAsText(file);
    // Reset so same file can be selected again
    e.target.value = "";
  };

  // ── Downloads ─────────────────────────────────────────────────────────────
  const handleClearDownloads = async () => {
    try {
      await clearAllDownloads();
      setDownloadCount(0);
      toast.success("All downloads cleared");
    } catch {
      toast.error("Failed to clear downloads");
    }
  };

  // ── Clear all data ────────────────────────────────────────────────────────
  const handleClearAll = () => {
    localStorage.clear();
    clearAllDownloads().finally(() => window.location.reload());
  };

  return (
    <div className="safe-bottom min-h-screen px-4 pt-4">
      <h1 className="mb-6 text-xl font-bold text-foreground">Settings</h1>

      <div className="space-y-4">
        {/* Reading preferences */}
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

        {/* Download management */}
        <SettingGroup title="Downloads">
          <div className="space-y-3">
            <ActionRow
              label="Downloaded chapters"
              description={`${downloadCount} chapter${downloadCount !== 1 ? "s" : ""} stored locally`}
              buttonLabel="Clear all"
              danger={downloadCount > 0}
              onClick={() => {
                if (downloadCount === 0) return;
                // Inline confirm via AlertDialog below
                document.getElementById("clear-downloads-trigger")?.click();
              }}
            />
          </div>
          {/* Hidden alert dialog trigger */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button id="clear-downloads-trigger" className="hidden" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all downloads?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete all {downloadCount} downloaded chapter
                  {downloadCount !== 1 ? "s" : ""} from your device. You can re-download them anytime.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearDownloads}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Clear downloads
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SettingGroup>

        {/* Backup & restore */}
        <SettingGroup title="Backup & Restore">
          <div className="space-y-3">
            <ActionRow
              label="Export backup"
              description="Save your library, history, and settings as a JSON file"
              buttonLabel="Export"
              onClick={handleExport}
            />
            <div className="border-t border-border" />
            <ActionRow
              label="Import backup"
              description="Restore library from a previously exported JSON file"
              buttonLabel="Import"
              onClick={handleImportClick}
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />
        </SettingGroup>

        {/* Danger zone */}
        <SettingGroup title="Danger Zone">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="w-full rounded-lg bg-destructive/10 py-2.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20">
                Clear all data
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently deletes your entire library, reading history, settings, and all
                  downloaded chapters. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearAll}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SettingGroup>

        {/* About */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-medium text-foreground">About MangaShelf</p>
          <p className="mt-1 text-xs text-muted-foreground">
            A personal manga reader PWA inspired by Mihon/Tachiyomi.
          </p>
          <p className="mt-2 text-[10px] text-muted-foreground">v1.0.0 — For personal use only</p>
        </div>
      </div>
    </div>
  );
}
