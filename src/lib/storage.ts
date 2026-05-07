import type { ActiveTemplate, HistoryRecord, WorkspaceDraft } from "@/lib/types";

const historyKey = "proddoc-ai-history";
const draftKey = "proddoc-ai-workspace-draft";
const activeTemplateKey = "proddoc-ai-active-template";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function getHistoryRecords(): HistoryRecord[] {
  if (!canUseStorage()) return [];

  try {
    const raw = localStorage.getItem(historyKey);
    return raw ? (JSON.parse(raw) as HistoryRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveHistoryRecord(record: HistoryRecord) {
  if (!canUseStorage()) return false;

  try {
    const records = getHistoryRecords();
    localStorage.setItem(historyKey, JSON.stringify([record, ...records]));
    return true;
  } catch {
    // Storage can fail when the browser quota is exceeded or localStorage is disabled.
    return false;
  }
}

export function deleteHistoryRecord(id: string) {
  if (!canUseStorage()) return [];

  try {
    const nextRecords = getHistoryRecords().filter((record) => record.id !== id);
    localStorage.setItem(historyKey, JSON.stringify(nextRecords));
    return nextRecords;
  } catch {
    return getHistoryRecords();
  }
}

export function saveWorkspaceDraft(draft: WorkspaceDraft) {
  if (!canUseStorage()) return;

  try {
    localStorage.setItem(draftKey, JSON.stringify(draft));
  } catch {
    // Draft persistence is best-effort because screenshots can be large.
  }
}

export function getWorkspaceDraft(): WorkspaceDraft | null {
  if (!canUseStorage()) return null;

  try {
    const raw = localStorage.getItem(draftKey);
    return raw ? (JSON.parse(raw) as WorkspaceDraft) : null;
  } catch {
    return null;
  }
}

export function clearWorkspaceDraft() {
  if (!canUseStorage()) return;

  try {
    localStorage.removeItem(draftKey);
  } catch {
    // Ignore unavailable storage.
  }
}

export function saveActiveTemplate(template: ActiveTemplate) {
  if (!canUseStorage()) return false;

  try {
    localStorage.setItem(activeTemplateKey, JSON.stringify(template));
    return true;
  } catch {
    return false;
  }
}

export function getActiveTemplate(): ActiveTemplate | null {
  if (!canUseStorage()) return null;

  try {
    const raw = localStorage.getItem(activeTemplateKey);
    return raw ? (JSON.parse(raw) as ActiveTemplate) : null;
  } catch {
    return null;
  }
}
