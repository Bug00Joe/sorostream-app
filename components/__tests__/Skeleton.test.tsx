import type { ComponentType } from 'react';
import { render, screen, within } from '@testing-library/react';
import * as Skeletons from '../Skeleton';

type StreamListSkeletonProps = {
  label?: string;
};

describe('StreamListSkeleton', () => {
  it('renders five stream-shaped placeholder rows in a loading status region', () => {
    const StreamListSkeleton = (
      Skeletons as { StreamListSkeleton?: ComponentType<StreamListSkeletonProps> }
    ).StreamListSkeleton;

    expect(StreamListSkeleton).toBeDefined();
    if (!StreamListSkeleton) return;

    render(<StreamListSkeleton />);

    const status = screen.getByRole('status', { name: 'Loading streams' });
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(within(status).getAllByRole('listitem')).toHaveLength(5);
  });

  it('allows pages to provide a detail-specific loading label', () => {
    const StreamListSkeleton = (
      Skeletons as { StreamListSkeleton?: ComponentType<StreamListSkeletonProps> }
    ).StreamListSkeleton;

    expect(StreamListSkeleton).toBeDefined();
    if (!StreamListSkeleton) return;

    render(<StreamListSkeleton label="Loading stream detail" />);

    expect(screen.getByRole('status', { name: 'Loading stream detail' })).toBeInTheDocument();
  });
});
