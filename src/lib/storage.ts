import type {
  ActiveDocument,
  ActiveTemplate,
  CustomTemplate,
  GenerationPreferences,
  HistoryRecord,
  WorkspaceDraft,
} from "@/lib/types";

const historyKey = "proddoc-ai-history";
const draftKey = "proddoc-ai-workspace-draft";
const activeTemplateKey = "proddoc-ai-active-template";
const generationPreferencesKey = "proddoc-ai-generation-preferences";
const customTemplatesKey = "proddoc-ai-custom-templates";
const activeDocumentKey = "proddoc-ai-active-document";

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
