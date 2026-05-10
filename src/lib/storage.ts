import type {
  ActiveDocument,
  ActiveTemplate,
  CustomTemplate,
  ExportSettings,
  ExtractedDocumentStructure,
  GenerationPreferences,
  HistoryActivity,
  HistoryRecord,
  ModelParams,
  ScreenshotItem,
  WorkspaceDraft,
} from "@/lib/types";
import { compressImage, estimateLocalStorageUsage, hasStorageCapacity } from "@/lib/image-compress";
import { idbGet, idbSet, idbDelete, idbClear, estimateIDBUsage } from "@/lib/db";

const historyKey = "proddoc-ai-history";
const draftKey = "proddoc-ai-workspace-draft";
const activeTemplateKey = "proddoc-ai-active-template";
const generationPreferencesKey = "proddoc-ai-generation-preferences";
const customTemplatesKey = "proddoc-ai-custom-templates";
const activeDocumentKey = "proddoc-ai-active-document";
const activityKey = "proddoc-ai-activity-log";
const templateParseKey = "proddoc-ai-template-parse-state";
const modelParamsKey = "proddoc-ai-model-params";
const exportSettingsKey = "proddoc-ai-export-settings";
const STORAGE_LIMIT = 5 * 1024 * 1024; // 5MB typical limit

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

/**
 * Try to free up storage by removing oldest history records.
 */
function tryFreeStorage(bytesNeeded: number): boolean {
  const used = estimateLocalStorageUsage();
  if (used + bytesNeeded < STORAGE_LIMIT) return true;

  const records = getHistoryRecords();
  // Remove oldest records one at a time until we have room
  for (let i = records.length - 1; i >= 0; i--) {
    records.pop();
    try {
      localStorage.setItem(historyKey, JSON.stringify(records));
      if (hasStorageCapacity(bytesNeeded)) return true;
    } catch {
      continue;
    }
  }
  return hasStorageCapacity(bytesNeeded);
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

/**
 * Load history records and hydrate any content stored in IndexedDB.
 * Large document content (>50KB) is offloaded to IndexedDB to avoid
 * hitting the 5MB localStorage limit.
 */
export async function getHistoryRecordsAsync(): Promise<HistoryRecord[]> {
  const records = getHistoryRecords();
  const hydrated = await Promise.all(
    records.map(async (record) => {
      if (record.content) return record;
      // Empty content may indicate it was offloaded to IndexedDB
      const idbContent = await idbGet<{ content: string }>("documents", `history-${record.id}`);
      if (idbContent?.content) {
        return { ...record, content: idbContent.content };
      }
      return record;
    })
  );
  return hydrated;
}

export function saveHistoryRecord(record: HistoryRecord) {
  if (!canUseStorage()) return false;

  try {
    const records = getHistoryRecords();

    // Offload large content to IndexedDB to avoid localStorage quota
    const CONTENT_THRESHOLD = 50 * 1024; // 50KB
    let recordToSave = record;
    if (record.content && record.content.length > CONTENT_THRESHOLD) {
      // Store content in IndexedDB (fire-and-forget for sync function)
      void idbSet("documents", `history-${record.id}`, { content: record.content });
      recordToSave = { ...record, content: "" };
    }

    localStorage.setItem(historyKey, JSON.stringify([recordToSave, ...records]));

    // Also log as a document activity
    addActivity({
      type: "document",
      title: record.title,
      description: `${record.documentType} · ${record.parentModule}/${record.moduleName}`,
      productName: record.productName,
      moduleName: record.moduleName,
      content: record.content,
    });

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
    // Clean up IndexedDB content if it was offloaded
    void idbDelete("documents", `history-${id}`);
    return nextRecords;
  } catch {
    return getHistoryRecords();
  }
}

export async function saveWorkspaceDraft(draft: WorkspaceDraft): Promise<boolean> {
  if (!canUseStorage()) return false;

  // Compress screenshot data URLs before storing
  let optimizedDraft = draft;
  if (draft.screenshots && draft.screenshots.length > 0) {
    const compressed = await Promise.all(
      draft.screenshots.map(async (s) => ({
        ...s,
        dataUrl: await compressImage(s.dataUrl, 600, 0.7),
      }))
    );
    optimizedDraft = { ...draft, screenshots: compressed };
  }

  // Offload screenshots to IndexedDB to avoid localStorage quota
  let draftToSave = optimizedDraft;
  if (optimizedDraft.screenshots && optimizedDraft.screenshots.length > 0) {
    // Store each screenshot in IndexedDB
    await Promise.all(
      optimizedDraft.screenshots.map(async (s) => {
        await idbSet("screenshots", s.id, { id: s.id, name: s.name, dataUrl: s.dataUrl });
      })
    );
    // Replace screenshots with lightweight references in localStorage
    const refs: ScreenshotItem[] = optimizedDraft.screenshots.map((s) => ({
      id: s.id,
      name: s.name,
      dataUrl: "", // placeholder — real data lives in IndexedDB
    }));
    draftToSave = { ...optimizedDraft, screenshots: refs };
  }

  const serialized = JSON.stringify(draftToSave);
  const needed = serialized.length * 2; // UTF-16

  try {
    if (!hasStorageCapacity(needed)) {
      tryFreeStorage(needed);
    }
    localStorage.setItem(draftKey, serialized);
    return true;
  } catch {
    // Draft persistence is best-effort because screenshots can be large.
    return false;
  }
}

export function getWorkspaceDraft(): WorkspaceDraft | null {
  if (!canUseStorage()) return null;

  try {
    const raw = localStorage.getItem(draftKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorkspaceDraft;
    return {
      ...parsed,
      generationMode: parsed.generationMode ?? "prompt",
      referenceFiles: parsed.referenceFiles ?? [],
      screenshots: parsed.screenshots ?? [],
    };
  } catch {
    return null;
  }
}

/**
 * Load workspace draft and hydrate screenshots from IndexedDB.
 * Screenshots with empty dataUrl are references — the real data lives in IndexedDB.
 */
export async function getWorkspaceDraftAsync(): Promise<WorkspaceDraft | null> {
  const draft = getWorkspaceDraft();
  if (!draft || !draft.screenshots.length) return draft;

  const hydrated = await Promise.all(
    draft.screenshots.map(async (s) => {
      if (s.dataUrl) return s; // already has data
      const idbItem = await idbGet<ScreenshotItem>("screenshots", s.id);
      return idbItem ?? s;
    })
  );

  return { ...draft, screenshots: hydrated };
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

export function saveGenerationPreferences(preferences: GenerationPreferences) {
  if (!canUseStorage()) return false;

  try {
    localStorage.setItem(generationPreferencesKey, JSON.stringify(preferences));
    return true;
  } catch {
    return false;
  }
}

export function getGenerationPreferences(): GenerationPreferences | null {
  if (!canUseStorage()) return null;

  try {
    const raw = localStorage.getItem(generationPreferencesKey);
    return raw ? (JSON.parse(raw) as GenerationPreferences) : null;
  } catch {
    return null;
  }
}

export function getCustomTemplates(): CustomTemplate[] {
  if (!canUseStorage()) return [];

  try {
    const raw = localStorage.getItem(customTemplatesKey);
    return raw ? (JSON.parse(raw) as CustomTemplate[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomTemplate(template: CustomTemplate) {
  if (!canUseStorage()) return false;

  try {
    const templates = getCustomTemplates();
    const nextTemplates = [
      template,
      ...templates.filter((item) => item.id !== template.id),
    ];
    localStorage.setItem(customTemplatesKey, JSON.stringify(nextTemplates));
    return true;
  } catch {
    return false;
  }
}

export function updateCustomTemplate(template: CustomTemplate) {
  if (!canUseStorage()) return false;

  try {
    const templates = getCustomTemplates();
    localStorage.setItem(
      customTemplatesKey,
      JSON.stringify(templates.map((item) => (item.id === template.id ? template : item)))
    );
    return true;
  } catch {
    return false;
  }
}

export function deleteCustomTemplate(id: string) {
  if (!canUseStorage()) return [];

  try {
    const nextTemplates = getCustomTemplates().filter((template) => template.id !== id);
    localStorage.setItem(customTemplatesKey, JSON.stringify(nextTemplates));
    return nextTemplates;
  } catch {
    return getCustomTemplates();
  }
}

export function saveActiveDocument(document: ActiveDocument) {
  if (!canUseStorage()) return false;

  try {
    localStorage.setItem(activeDocumentKey, JSON.stringify(document));
    saveWorkspaceDraft({
      ...document.draft,
      documentContent: document.content,
      initialDocumentContent: document.initialContent ?? document.draft.initialDocumentContent,
    });
    return true;
  } catch {
    return false;
  }
}

export function getActiveDocument(): ActiveDocument | null {
  if (!canUseStorage()) return null;

  try {
    const raw = localStorage.getItem(activeDocumentKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveDocument;
    return {
      ...parsed,
      draft: {
        ...parsed.draft,
        referenceFiles: parsed.draft.referenceFiles ?? [],
        screenshots: parsed.draft.screenshots ?? [],
      },
    };
  } catch {
    return null;
  }
}

export function updateActiveDocument(document: ActiveDocument) {
  return saveActiveDocument({ ...document, updatedAt: new Date().toISOString() });
}

export function clearActiveDocument() {
  if (!canUseStorage()) return;

  try {
    localStorage.removeItem(activeDocumentKey);
  } catch {
    // Ignore unavailable storage.
  }
}

// --- Activity Log ---

export function getActivityLog(): HistoryActivity[] {
  if (!canUseStorage()) return [];

  try {
    const raw = localStorage.getItem(activityKey);
    return raw ? (JSON.parse(raw) as HistoryActivity[]) : [];
  } catch {
    return [];
  }
}

export function addActivity(activity: Omit<HistoryActivity, "id" | "createdAt">) {
  if (!canUseStorage()) return false;

  try {
    const log = getActivityLog();
    const entry: HistoryActivity = {
      ...activity,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(activityKey, JSON.stringify([entry, ...log]));
    return true;
  } catch {
    return false;
  }
}

export function deleteActivity(id: string) {
  if (!canUseStorage()) return [];

  try {
    const next = getActivityLog().filter((a) => a.id !== id);
    localStorage.setItem(activityKey, JSON.stringify(next));
    return next;
  } catch {
    return getActivityLog();
  }
}

// --- Template Parse State ---

export type TemplateParseState = {
  isParsing: boolean;
  progress: number;
  sourceText: string;
  fileName: string;
  result?: ExtractedDocumentStructure;
};

export function getTemplateParseState(): TemplateParseState | null {
  if (!canUseStorage()) return null;

  try {
    const raw = localStorage.getItem(templateParseKey);
    return raw ? (JSON.parse(raw) as TemplateParseState) : null;
  } catch {
    return null;
  }
}

export function saveTemplateParseState(state: TemplateParseState) {
  if (!canUseStorage()) return false;

  try {
    localStorage.setItem(templateParseKey, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearTemplateParseState() {
  if (!canUseStorage()) return;

  try {
    localStorage.removeItem(templateParseKey);
  } catch {
    // Ignore unavailable storage.
  }
}

// --- Model Params ---

const defaultModelParams: ModelParams = {
  temperature: 0.7,
  maxTokens: 4096,
  topP: 0.95,
};

export function getModelParams(): ModelParams {
  if (!canUseStorage()) return defaultModelParams;

  try {
    const raw = localStorage.getItem(modelParamsKey);
    if (!raw) return defaultModelParams;
    const parsed = JSON.parse(raw) as Partial<ModelParams>;
    return { ...defaultModelParams, ...parsed };
  } catch {
    return defaultModelParams;
  }
}

export function saveModelParams(params: ModelParams): boolean {
  if (!canUseStorage()) return false;

  try {
    localStorage.setItem(modelParamsKey, JSON.stringify(params));
    return true;
  } catch {
    return false;
  }
}

// --- Export Settings ---

const defaultExportSettings: ExportSettings = {
  defaultFormat: "正式文档",
  filenamePattern: "{productName}_{moduleName}_{date}",
  includeMetadata: true,
};

export function getExportSettings(): ExportSettings {
  if (!canUseStorage()) return defaultExportSettings;

  try {
    const raw = localStorage.getItem(exportSettingsKey);
    if (!raw) return defaultExportSettings;
    const parsed = JSON.parse(raw) as Partial<ExportSettings>;
    return { ...defaultExportSettings, ...parsed };
  } catch {
    return defaultExportSettings;
  }
}

export function saveExportSettings(settings: ExportSettings): boolean {
  if (!canUseStorage()) return false;

  try {
    localStorage.setItem(exportSettingsKey, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

// --- Data Management ---

const allStorageKeys = [
  historyKey,
  draftKey,
  activeTemplateKey,
  generationPreferencesKey,
  customTemplatesKey,
  activeDocumentKey,
  activityKey,
  templateParseKey,
  modelParamsKey,
  exportSettingsKey,
];

export function getStorageUsageKB(): number {
  if (!canUseStorage()) return 0;

  let total = 0;
  for (const key of allStorageKeys) {
    const raw = localStorage.getItem(key);
    if (raw) total += raw.length * 2; // UTF-16
  }
  return Math.round(total / 1024);
}

/**
 * Get IndexedDB storage usage estimate.
 * Returns usage in KB, or null if the API is unavailable.
 */
export async function getIndexedDBUsageKB(): Promise<number | null> {
  const estimate = await estimateIDBUsage();
  if (!estimate) return null;
  return Math.round(estimate.usage / 1024);
}

/**
 * Get IndexedDB quota estimate in MB.
 * Returns quota in MB, or null if the API is unavailable.
 */
export async function getIndexedDBQuotaMB(): Promise<number | null> {
  const estimate = await estimateIDBUsage();
  if (!estimate) return null;
  return Math.round(estimate.quota / (1024 * 1024));
}

export function clearAllData(): boolean {
  if (!canUseStorage()) return false;

  try {
    for (const key of allStorageKeys) {
      localStorage.removeItem(key);
    }
    // Also clear IndexedDB stores
    void idbClear("documents");
    void idbClear("screenshots");
    return true;
  } catch {
    return false;
  }
}

export function exportAllData(): Record<string, unknown> | null {
  if (!canUseStorage()) return null;

  try {
    const data: Record<string, unknown> = {};
    for (const key of allStorageKeys) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          data[key] = JSON.parse(raw);
        } catch {
          data[key] = raw;
        }
      }
    }
    return data;
  } catch {
    return null;
  }
}

export function importAllData(data: Record<string, unknown>): boolean {
  if (!canUseStorage()) return false;

  try {
    for (const [key, value] of Object.entries(data)) {
      if (allStorageKeys.includes(key)) {
        localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
      }
    }
    return true;
  } catch {
    return false;
  }
}
