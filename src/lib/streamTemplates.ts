export interface SavedTemplate {
  id: string;
  label: string;
  description: string;
  days: number;
  hours: number;
  minutes: number;
  suggestedAmount?: string;
  recipient?: string;
  /** Token symbol this template was saved with, e.g. "USDC" or "XLM". */
  token?: string;
  /** Optional cliff date, stored as a datetime-local ISO string. */
  cliffDate?: string;
}

const STORAGE_KEY = "sorostream_templates";
const MAX_TEMPLATES = 20;

export function getSavedTemplates(): SavedTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t: unknown) =>
        typeof t === "object" &&
        t !== null &&
        typeof (t as Record<string, unknown>).id === "string" &&
        typeof (t as Record<string, unknown>).label === "string",
    ) as SavedTemplate[];
  } catch {
    return [];
  }
}

export function saveTemplate(
  template: Omit<SavedTemplate, "id">,
): SavedTemplate | null {
  const templates = getSavedTemplates();
  if (templates.length >= MAX_TEMPLATES) return null;
  const id = `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const newTemplate: SavedTemplate = { ...template, id };
  templates.push(newTemplate);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  return newTemplate;
}

export function deleteTemplate(id: string): void {
  const templates = getSavedTemplates().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function updateTemplate(
  id: string,
  updates: Partial<Omit<SavedTemplate, "id">>,
): boolean {
  const templates = getSavedTemplates();
  const idx = templates.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  templates[idx] = { ...templates[idx], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  return true;
}

export function templateToSeconds(t: SavedTemplate): number {
  return t.days * 86400 + t.hours * 3600 + t.minutes * 60;
}
