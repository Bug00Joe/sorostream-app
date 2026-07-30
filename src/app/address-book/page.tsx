"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getContacts,
  saveContact,
  updateContact,
  deleteContact,
  MAX_CONTACTS,
  type AddressBookContact,
} from "@/src/lib/addressBook";
import { useToast } from "@/src/lib/toast";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function truncateAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

interface FormState {
  id: string;
  name: string;
  address: string;
  federation: string;
}

const emptyForm: FormState = { id: "", name: "", address: "", federation: "" };

function validateAddress(addr: string): string {
  if (!addr.trim()) return "Address is required.";
  if (!/^G[A-Z2-7]{55}$/.test(addr.trim()))
    return "Must be a valid Stellar public key (starts with G, 56 chars).";
  return "";
}

function validateName(name: string): string {
  if (!name.trim()) return "Name is required.";
  return "";
}

export default function AddressBookPage() {
  const { addToast } = useToast();
  const [contacts, setContacts] = useState<AddressBookContact[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState({ name: "", address: "" });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const reload = useCallback(() => setContacts(getContacts()), []);

  useEffect(() => {
    reload();
  }, [reload]);

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.address.toLowerCase().includes(search.toLowerCase()),
  );

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({ name: "", address: "" });
    setShowForm(true);
  }

  function openEdit(contact: AddressBookContact) {
    setEditing(contact.id);
    setForm({
      id: contact.id,
      name: contact.name,
      address: contact.address,
      federation: "",
    });
    setFormErrors({ name: "", address: "" });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({ name: "", address: "" });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nameErr = validateName(form.name);
    const addrErr = validateAddress(form.address);
    if (nameErr || addrErr) {
      setFormErrors({ name: nameErr, address: addrErr });
      return;
    }

    // Duplicate address check (skip current record when editing)
    const duplicate = contacts.find(
      (c) => c.address === form.address.trim() && c.id !== form.id,
    );
    if (duplicate) {
      setFormErrors((prev) => ({
        ...prev,
        address: `Duplicate address — already saved as "${duplicate.name}".`,
      }));
      return;
    }

    if (editing) {
      const ok = updateContact(editing, {
        name: form.name.trim(),
        address: form.address.trim(),
      });
      if (ok) {
        addToast("Contact updated.", "success");
      } else {
        addToast("Failed to update contact.", "error");
      }
    } else {
      if (contacts.length >= MAX_CONTACTS) {
        addToast(`Maximum of ${MAX_CONTACTS} contacts reached.`, "error");
        return;
      }
      const ok = saveContact({
        id: generateId(),
        name: form.name.trim(),
        address: form.address.trim(),
      });
      if (ok) {
        addToast("Contact saved.", "success");
      } else {
        addToast("Failed to save contact.", "error");
      }
    }

    reload();
    closeForm();
  }

  function handleDelete(id: string) {
    deleteContact(id);
    addToast("Contact deleted.", "success");
    reload();
    setConfirmDeleteId(null);
  }

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 pb-24 md:pb-8"
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Address Book</h1>
            <p className="text-gray-400 text-sm mt-1">
              {contacts.length}/{MAX_CONTACTS} contacts
            </p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            disabled={contacts.length >= MAX_CONTACTS}
            className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          >
            + Add Contact
          </button>
        </div>

        {/* Inline Add / Edit Form */}
        {showForm && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {editing ? "Edit Contact" : "New Contact"}
            </h2>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Name */}
              <div>
                <label
                  htmlFor="contact-name"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, name: e.target.value }));
                    setFormErrors((prev) => ({ ...prev, name: "" }));
                  }}
                  placeholder="Alice"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800"
                  aria-required="true"
                  aria-invalid={!!formErrors.name}
                  aria-describedby={formErrors.name ? "name-error" : undefined}
                />
                {formErrors.name && (
                  <p id="name-error" role="alert" className="text-red-400 text-xs mt-1">
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* Stellar Address */}
              <div>
                <label
                  htmlFor="contact-address"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Stellar Address
                </label>
                <input
                  id="contact-address"
                  type="text"
                  value={form.address}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, address: e.target.value }));
                    setFormErrors((prev) => ({ ...prev, address: "" }));
                  }}
                  placeholder="G..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800"
                  aria-required="true"
                  aria-invalid={!!formErrors.address}
                  aria-describedby={
                    formErrors.address ? "address-error" : undefined
                  }
                />
                {formErrors.address && (
                  <p
                    id="address-error"
                    role="alert"
                    className="text-red-400 text-xs mt-1"
                  >
                    {formErrors.address}
                  </p>
                )}
              </div>

              {/* Federation address (optional) */}
              <div>
                <label
                  htmlFor="contact-federation"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Federation Address{" "}
                  <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <input
                  id="contact-federation"
                  type="text"
                  value={form.federation}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, federation: e.target.value }))
                  }
                  placeholder="alice*stellar.org"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  className="flex-1 bg-green-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800"
                >
                  {editing ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 border border-gray-600 text-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search */}
        <div className="mb-4">
          <label htmlFor="contact-search" className="sr-only">
            Search contacts
          </label>
          <input
            id="contact-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or address…"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          />
        </div>

        {/* Contact list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            {contacts.length === 0
              ? "No saved contacts yet. Add your first contact above."
              : "No contacts match your search."}
          </div>
        ) : (
          <ul className="space-y-2" role="list" aria-label="Saved contacts">
            {filtered.map((contact) => (
              <li
                key={contact.id}
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3.5 flex items-center gap-3"
              >
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full bg-green-800 flex items-center justify-center text-green-300 font-semibold text-sm shrink-0"
                  aria-hidden="true"
                >
                  {contact.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{contact.name}</p>
                  <p className="text-gray-400 text-xs font-mono truncate">
                    {truncateAddress(contact.address)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(contact)}
                    className="text-xs text-gray-400 hover:text-white border border-gray-600 hover:border-gray-400 px-2.5 py-1 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                    aria-label={`Edit ${contact.name}`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(contact.id)}
                    className="text-xs text-red-400 hover:text-red-300 border border-red-800 hover:border-red-600 px-2.5 py-1 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    aria-label={`Delete ${contact.name}`}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h2 id="confirm-delete-title" className="text-lg font-semibold mb-2">
              Delete Contact
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Are you sure you want to delete{" "}
              <span className="text-white font-medium">
                {contacts.find((c) => c.id === confirmDeleteId)?.name}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteId)}
                className="flex-1 bg-red-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 border border-gray-600 text-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
