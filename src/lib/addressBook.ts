export interface AddressBookContact {
  id: string;
  name: string;
  address: string;
}

const STORAGE_KEY = "sorostream_address_book";
const MAX_CONTACTS = 50;

export { MAX_CONTACTS };

export function getContacts(): AddressBookContact[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c: unknown) =>
        typeof c === "object" &&
        c !== null &&
        typeof (c as Record<string, unknown>).id === "string" &&
        typeof (c as Record<string, unknown>).name === "string" &&
        typeof (c as Record<string, unknown>).address === "string" &&
        /^G[A-Z2-7]{55}$/.test((c as Record<string, string>).address),
    ) as AddressBookContact[];
  } catch {
    return [];
  }
}

export function saveContact(contact: AddressBookContact): boolean {
  const contacts = getContacts();
  if (contacts.length >= MAX_CONTACTS) return false;
  if (contacts.some((c) => c.id === contact.id)) return false;
  contacts.push(contact);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  return true;
}

export function updateContact(id: string, updates: Partial<Pick<AddressBookContact, "name" | "address">>): boolean {
  const contacts = getContacts();
  const idx = contacts.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  contacts[idx] = { ...contacts[idx], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  return true;
}

export function deleteContact(id: string): void {
  const contacts = getContacts().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}
