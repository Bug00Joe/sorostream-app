"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getSavedTemplates,
  saveTemplate,
  deleteTemplate,
  templateToSeconds,
  type SavedTemplate,
} from "@/src/lib/streamTemplates";

interface BuiltInTemplate {
  label: string;
  description: string;
  days: number;
  hours: number;
  minutes: number;
  suggestedAmount?: string;
}

const BUILT_IN_TEMPLATES: BuiltInTemplate[] = [
  { label: "Biweekly payroll", description: "14 days", days: 14, hours: 0, minutes: 0, suggestedAmount: "5000" },
  { label: "Monthly salary", description: "30 days", days: 30, hours: 0, minutes: 0, suggestedAmount: "10000" },
  { label: "1-year vesting", description: "365 days", days: 365, hours: 0, minutes: 0, suggestedAmount: "100000" },
  { label: "Weekly stipend", description: "7 days", days: 7, hours: 0, minutes: 0, suggestedAmount: "500" },
];

interface StreamTemplatePickerProps {
  onSelect: (seconds: number, amount?: string, recipient?: string, token?: string, cliffDate?: string) => void;
  currentRecipient?: string;
  currentAmount?: string;
  currentDuration?: number;
  currentToken?: string;
  currentCliffDate?: string;
}

export default function StreamTemplatePicker({
  onSelect,
  currentRecipient,
  currentAmount,
  currentDuration,
  currentToken,
  currentCliffDate,
}: StreamTemplatePickerProps) {
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveLabel, setSaveLabel] = useState("");
  const [saveDescription, setSaveDescription] = useState("");

  const refresh = useCallback(() => {
    setSavedTemplates(getSavedTemplates());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSave = () => {
    if (!saveLabel.trim()) return;
    const days = currentDuration ? Math.floor(currentDuration / 86400) : 0;
    const hours = currentDuration ? Math.floor((currentDuration % 86400) / 3600) : 0;
    const minutes = currentDuration ? Math.floor((currentDuration % 3600) / 60) : 0;
    const result = saveTemplate({
      label: saveLabel.trim(),
      description: saveDescription.trim() || saveLabel.trim(),
      days,
      hours,
      minutes,
      suggestedAmount: currentAmount || undefined,
      recipient: currentRecipient || undefined,
      token: currentToken || undefined,
      cliffDate: currentCliffDate || undefined,
    });
    if (result) {
      setShowSaveForm(false);
      setSaveLabel("");
      setSaveDescription("");
      refresh();
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteTemplate(id);
    refresh();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-gray-200 text-sm font-medium">Quick Templates</p>
        {currentDuration && currentDuration > 0 && (
          <button
            type="button"
            onClick={() => setShowSaveForm((v) => !v)}
            className="text-xs text-green-400 hover:text-green-300 transition-colors"
          >
            {showSaveForm ? "Cancel" : "+ Save as template"}
          </button>
        )}
      </div>

      {showSaveForm && (
        <div className="bg-gray-800/60 rounded-lg p-3 space-y-2 border border-gray-700">
          <input
            type="text"
            value={saveLabel}
            onChange={(e) => setSaveLabel(e.target.value)}
            placeholder="Template name (e.g. 4-year vesting)"
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-500"
          />
          <input
            type="text"
            value={saveDescription}
            onChange={(e) => setSaveDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-500"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={!saveLabel.trim()}
            className="w-full bg-green-600 text-white text-sm py-1.5 rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            Save Template
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {BUILT_IN_TEMPLATES.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => onSelect(t.days * 86400 + t.hours * 3600 + t.minutes * 60, t.suggestedAmount)}
            className="text-left bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 hover:border-green-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          >
            <p className="text-white text-sm font-medium">{t.label}</p>
            <p className="text-gray-300 text-xs">{t.description}</p>
          </button>
        ))}
        {savedTemplates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(templateToSeconds(t), t.suggestedAmount, t.recipient, t.token, t.cliffDate)}
            className="text-left bg-gray-800 border border-green-500/40 rounded-lg px-3 py-2 hover:border-green-500 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          >
            <div className="flex items-center justify-between">
              <p className="text-white text-sm font-medium">{t.label}</p>
              <button
                onClick={(e) => handleDelete(e, t.id)}
                className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs p-0.5"
                aria-label={`Delete template ${t.label}`}
              >
                ✕
              </button>
            </div>
            <p className="text-gray-300 text-xs">{t.description}</p>
          </button>
        ))}
      </div>

      {savedTemplates.length === 0 && !showSaveForm && (
        <p className="text-gray-500 text-xs">
          Set a duration above then click &quot;+ Save as template&quot; to save your own.
        </p>
      )}
    </div>
  );
}
