/**
 * Repository exports
 *
 * This module provides a clean interface for data access.
 * Currently uses in-memory storage, but can be swapped to Prisma
 * by changing the imports here.
 */

export * from './types';

// Use in-memory repositories for now
// TODO: Switch to Prisma repositories when database is connected
export {
  discussionRepository,
  expertPanelRepository,
  discussions,
  panels,
  DEFAULT_PANEL_ID,
} from './in-memory.repository';

// Uncomment below when switching to Prisma:
// export {
//   discussionRepository,
//   expertPanelRepository,
// } from './prisma.repository';
