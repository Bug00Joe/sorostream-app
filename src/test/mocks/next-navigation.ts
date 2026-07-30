import { vi } from 'vitest';

// Minimal Next.js navigation stubs for Vitest/jsdom tests
export const useRouter = vi.fn(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
  refresh: vi.fn(),
}));

export const usePathname = vi.fn(() => '/');

export const useSearchParams = vi.fn(() => new URLSearchParams());

export const useParams = vi.fn(() => ({}));
