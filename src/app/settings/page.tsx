"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  getContacts,
  saveContact,
  updateContact,
  deleteContact,
  MAX_CONTACTS,
  type AddressBookContact,
} from "@/src/lib/addressBook";
import { useToast } from "@/src/lib/toast";
import { useSettings } from "@/src/context/SettingsContext";
import { useTranslations } from "@/src/lib/i18n";
import TwoFactorSetup from "@/components/TwoFactorSetup";
import DelegatesSection from "@/components/DelegatesSection";
import { useWallet } from "@/src/context/WalletContext";

function truncateAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

interface FormState {
  id: string;
  name: string;
  address: string;
}

const emptyForm: FormState = { id: "", name: "", address: "" };

export default function SettingsPage() {
  const t = useTranslations("settings");
  const { addToast } = useToast();
  const {
    withdrawThreshold,
    setWithdrawThreshold,
    language,
    setLanguage,
    defaultToken,
    setDefaultToken,
    defaultDurationSeconds,
    setDefaultDurationSeconds,
    defaultCliffDurationSeconds,
    setDefaultCliffDurationSeconds,
    preferredTheme,
    setPreferredTheme,
    resetStreamPreferences,
  } = useSettings();
  const { address } = useWallet();
  const [thresholdInput, setThresholdInput] = useState(String(withdrawThreshold));
  const [thresholdError, setThresholdError] = useState("");
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  
  // Preferences
  const [selectedToken, setSelectedToken] = useState(defaultToken);
  const [durationInput, setDurationInput] = useState(String(defaultDurationSeconds));
  const [cliffDurationInput, setCliffDurationInput] = useState(String(defaultCliffDurationSeconds));

  // Sync input when context hydrates from localStorage
  useEffect(() => {
    setThresholdInput(String(withdrawThreshold));
  }, [withdrawThreshold]);

  // Sync preferences
  useEffect(() => {
    setSelectedToken(defaultToken);
    setDurationInput(String(defaultDurationSeconds));
    setCliffDurationInput(String(defaultCliffDurationSeconds));
  }, [defaultToken, defaultDurationSeconds, defaultCliffDurationSeconds]);
  const [contacts, setContacts] = useState<AddressBookContact[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState({ name: "", address: "" });

  const load = useCallback(() => {
    setContacts(getContacts());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function validate(): boolean {
    const errs = { name: "", address: "" };
    if (!form.name.trim()) errs.name = t("error_name_required");
    if (!form.address.trim()) errs.address = t("error_address_required");
    else if (!/^G[A-Z2-7]{55}$/.test(form.address.trim()))
      errs.address = t("error_address_invalid");
    setErrors(errs);
    return !errs.name && !errs.address;
  }

  function handleSave() {
    if (!validate()) return;

    if (form.id) {
      const ok = updateContact(form.id, { name: form.name.trim(), address: form.address.trim() });
      if (ok) {
        addToast(t("toast_contact_updated"), "success");
      } else {
        addToast(t("toast_contact_update_failed"), "error");
      }
    } else {
      if (contacts.length >= MAX_CONTACTS) {
        addToast(t("toast_contact_max_reached", { max: String(MAX_CONTACTS) }), "error");
        return;
      }
      const contact: AddressBookContact = {
        id: generateId(),
        name: form.name.trim(),
        address: form.address.trim(),
      };
      const ok = saveContact(contact);
      if (ok) {
        addToast(t("toast_contact_saved"), "success");
      } else {
        addToast(t("toast_contact_save_failed"), "error");
      }
    }

    setForm(emptyForm);
    load();
  }

  function handleEdit(contact: AddressBookContact) {
    setForm({ id: contact.id, name: contact.name, address: contact.address });
    setErrors({ name: "", address: "" });
  }

  function handleDelete(id: string) {
    deleteContact(id);
    if (form.id === id) setForm(emptyForm);
    load();
    addToast(t("toast_contact_deleted"), "info");
  }

  function handleCancel() {
    setForm(emptyForm);
    setErrors({ name: "", address: "" });
  }

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-lg mx-auto">
        <div className="mb-4">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
            ← {t("cancel")}
          </Link>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8">{t("title")}</h1>

        {/* Withdrawal Threshold */}
        <div className="bg-gray-800 rounded-xl p-6 space-y-4 mb-8">
          <h2 className="text-lg font-semibold">{t("withdraw_threshold_title")}</h2>
          <p className="text-gray-400 text-sm">
            {t("withdraw_threshold_desc")}
          </p>
          <div>
            <label htmlFor="withdraw-threshold" className="text-gray-200 text-sm font-medium block mb-1">
              {t("withdraw_threshold_label")}
            </label>
            <div className="flex gap-3">
              <input
                id="withdraw-threshold"
                type="number"
                min="0"
                step="1"
                value={thresholdInput}
                onChange={(e) => {
                  setThresholdInput(e.target.value);
                  setThresholdError("");
                }}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                aria-invalid={!!thresholdError}
                aria-describedby={thresholdError ? "threshold-error" : undefined}
              />
              <button
                onClick={() => {
                  const parsed = parseFloat(thresholdInput);
                  if (!Number.isFinite(parsed) || parsed < 0) {
                    setThresholdError(t("withdraw_threshold_error"));
                    return;
                  }
                  setWithdrawThreshold(parsed);
                  addToast(t("withdraw_threshold_saved"), "success");
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
              >
                {t("save")}
              </button>
            </div>
            {thresholdError && (
              <p id="threshold-error" className="text-red-400 text-xs mt-1">{thresholdError}</p>
            )}
          </div>
        </div>

        {/* Language Selection */}
        <div className="bg-gray-800 rounded-xl p-6 space-y-4 mb-8">
          <h2 className="text-lg font-semibold">{t("language_title")}</h2>
          <p className="text-gray-400 text-sm">
            {t("language_desc")}
          </p>
          <div>
            <label htmlFor="language-select" className="text-gray-200 text-sm font-medium block mb-1">
              {t("language_label")}
            </label>
            <select
              id="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            >
              <option value="en">{t("language_en")}</option>
              <option value="pt">{t("language_pt")}</option>
              <option value="es">{t("language_es")}</option>
            </select>
          </div>
        </div>

        {/* Notification Preferences */}
        <Link
          href="/settings/notifications"
          className="block bg-gray-800 rounded-xl p-6 mb-8 hover:bg-gray-750 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Notification Preferences</h2>
              <p className="text-gray-400 text-sm mt-1">
                Configure browser push and email alerts for stream events.
              </p>
            </div>
            <span className="text-green-400 text-sm shrink-0">Manage →</span>
          </div>
        </Link>
        {/* Stream Creation Preferences */}
        <div className="bg-gray-800 rounded-xl p-6 space-y-4 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">Stream Preferences</h2>
              <p className="text-gray-400 text-sm mt-1">
                Set defaults for new stream creation
              </p>
            </div>
            <button
              onClick={() => {
                resetStreamPreferences();
                addToast("Stream preferences reset to defaults", "info");
              }}
              className="text-gray-400 hover:text-gray-300 text-xs px-2 py-1 border border-gray-600 rounded transition-colors"
            >
              Reset
            </button>
          </div>

          <div>
            <label htmlFor="default-token" className="text-gray-200 text-sm font-medium block mb-1">
              Default Token
            </label>
            <select
              id="default-token"
              value={selectedToken}
              onChange={(e) => {
                setSelectedToken(e.target.value);
                setDefaultToken(e.target.value);
              }}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            >
              <option value="USDC">USDC (USD Coin)</option>
              <option value="XLM">XLM (Stellar Lumens)</option>
              <option value="AQUA">AQUA (Aquarius)</option>
              <option value="yXLM">yXLM (Yield XLM)</option>
            </select>
            <p className="text-gray-500 text-xs mt-1">Will be pre-selected when creating new streams</p>
          </div>

          <div>
            <label htmlFor="default-duration" className="text-gray-200 text-sm font-medium block mb-1">
              Default Duration (seconds, 0 = none)
            </label>
            <input
              id="default-duration"
              type="number"
              min="0"
              step="1"
              value={durationInput}
              onChange={(e) => setDurationInput(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            />
            <p className="text-gray-500 text-xs mt-1">
              {durationInput && durationInput !== "0" ? (
                <>
                  {(() => {
                    const secs = parseInt(durationInput);
                    if (secs >= 86400) {
                      const days = Math.floor(secs / 86400);
                      return `${days} day${days > 1 ? "s" : ""}`;
                    }
                    if (secs >= 3600) {
                      const hours = Math.floor(secs / 3600);
                      return `${hours} hour${hours > 1 ? "s" : ""}`;
                    }
                    const mins = Math.floor(secs / 60);
                    return `${mins} minute${mins > 1 ? "s" : ""}`;
                  })()}
                </>
              ) : (
                "No default"
              )}
            </p>
          </div>

          <div>
            <label htmlFor="default-cliff" className="text-gray-200 text-sm font-medium block mb-1">
              Default Cliff Duration (seconds, 0 = none)
            </label>
            <input
              id="default-cliff"
              type="number"
              min="0"
              step="1"
              value={cliffDurationInput}
              onChange={(e) => setCliffDurationInput(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            />
            <p className="text-gray-500 text-xs mt-1">
              {cliffDurationInput && cliffDurationInput !== "0" ? (
                <>
                  {(() => {
                    const secs = parseInt(cliffDurationInput);
                    if (secs >= 86400) {
                      const days = Math.floor(secs / 86400);
                      return `${days} day${days > 1 ? "s" : ""}`;
                    }
                    if (secs >= 3600) {
                      const hours = Math.floor(secs / 3600);
                      return `${hours} hour${hours > 1 ? "s" : ""}`;
                    }
                    const mins = Math.floor(secs / 60);
                    return `${mins} minute${mins > 1 ? "s" : ""}`;
                  })()}
                </>
              ) : (
                "No default"
              )}
            </p>
          </div>

          <div>
            <label htmlFor="preferred-theme" className="text-gray-200 text-sm font-medium block mb-1">
              Preferred Theme
            </label>
            <select
              id="preferred-theme"
              value={preferredTheme}
              onChange={(e) => setPreferredTheme(e.target.value as "light" | "dark" | "system")}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            >
              <option value="system">System (follow device settings)</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div className="pt-3 flex gap-3">
            <button
              onClick={() => {
                setDefaultToken(selectedToken);
                setDefaultDurationSeconds(parseInt(durationInput) || 0);
                setDefaultCliffDurationSeconds(parseInt(cliffDurationInput) || 0);
                addToast("Stream preferences saved", "success");
              }}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Save Preferences
            </button>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="bg-gray-800 rounded-xl p-6 space-y-4 mb-8">
          <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
          <p className="text-gray-400 text-sm">
            Add an extra layer of security to your account with TOTP-based 2FA.
          </p>
          
          {showTwoFactorSetup ? (
            <TwoFactorSetup
              accountName={address || "user"}
              onComplete={() => {
                setShowTwoFactorSetup(false);
                setTwoFactorEnabled(true);
                addToast("Two-factor authentication enabled successfully", "success");
              }}
              onCancel={() => setShowTwoFactorSetup(false)}
            />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${twoFactorEnabled ? "text-green-400" : "text-gray-300"}`}>
                    {twoFactorEnabled ? "2FA Enabled" : "2FA Disabled"}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {twoFactorEnabled
                      ? "Your account is protected with two-factor authentication"
                      : "Your account is not protected with two-factor authentication"}
                  </p>
                </div>
                <button
                  onClick={() => setShowTwoFactorSetup(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    twoFactorEnabled
                      ? "border border-gray-600 text-gray-300 hover:bg-gray-700"
                      : "bg-green-700 text-white hover:bg-green-800"
                  }`}
                >
                  {twoFactorEnabled ? "Manage" : "Enable"}
                </button>
              </div>
              
              {twoFactorEnabled && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => {
                      setTwoFactorEnabled(false);
                      addToast("Two-factor authentication disabled", "info");
                    }}
                    className="text-red-400 text-sm hover:text-red-300 transition-colors"
                  >
                    Disable Two-Factor Authentication
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Delegation Management */}
        <DelegatesSection />

        <div className="bg-gray-800 rounded-xl p-6 space-y-4 mb-8">
          <h2 className="text-lg font-semibold">{form.id ? t("edit_title") : t("add_title")}</h2>
          <div>
            <label htmlFor="contact-name" className="text-gray-200 text-sm font-medium block mb-1">
              {t("name_label")}
            </label>
            <input
              id="contact-name"
              value={form.name}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, name: e.target.value }));
                setErrors((prev) => ({ ...prev, name: "" }));
              }}
              placeholder={t("name_placeholder")}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "contact-name-error" : undefined}
            />
            {errors.name && (
              <p id="contact-name-error" className="text-red-400 text-xs mt-1">{errors.name}</p>
            )}
          </div>
          <div>
            <label htmlFor="contact-address" className="text-gray-200 text-sm font-medium block mb-1">
              {t("address_label")}
            </label>
            <input
              id="contact-address"
              value={form.address}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, address: e.target.value }));
                setErrors((prev) => ({ ...prev, address: "" }));
              }}
              placeholder={t("address_placeholder")}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
              aria-invalid={!!errors.address}
              aria-describedby={errors.address ? "contact-address-error" : undefined}
            />
            {errors.address && (
              <p id="contact-address-error" className="text-red-400 text-xs mt-1">{errors.address}</p>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              {form.id ? t("update") : t("save")}
            </button>
            {form.id && (
              <button
                onClick={handleCancel}
                className="flex-1 border border-gray-600 text-gray-300 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors"
              >
                {t("cancel")}
              </button>
            )}
          </div>
        </div>

        {/* Contact list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">
              {t("contact_count", { count: String(contacts.length), max: String(MAX_CONTACTS) })}
            </p>
          </div>

          {contacts.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">{t("empty")}</p>
          ) : (
            contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{contact.name}</p>
                  <p className="text-gray-500 text-xs font-mono truncate">{truncateAddress(contact.address)}</p>
                </div>
                <button
                  onClick={() => handleEdit(contact)}
                  className="text-gray-400 hover:text-white text-sm px-2 py-1 transition-colors"
                  aria-label={`Edit ${contact.name}`}
                >
                  {t("edit")}
                </button>
                <button
                  onClick={() => handleDelete(contact.id)}
                  className="text-red-400 hover:text-red-300 text-sm px-2 py-1 transition-colors"
                  aria-label={`Delete ${contact.name}`}
                >
                  {t("delete")}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
