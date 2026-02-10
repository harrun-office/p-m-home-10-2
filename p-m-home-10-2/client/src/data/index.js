/**
 * Data layer entry: storage, seed, and repositories.
 * UI and store consume from here; future API swap replaces these modules.
 */

export { load, save, clear, isSeeded, seedIfNeeded, resetAllToSeed, loadArray } from './storage/storage.js';
export { buildDemoSeed } from './seed/demoSeed.js';
export { STORAGE_KEYS } from './storage/storageKeys.js';

export * as userRepo from './repositories/userRepo.js';
export * as projectRepo from './repositories/projectRepo.js';
export * as taskRepo from './repositories/taskRepo.js';
export * as notificationRepo from './repositories/notificationRepo.js';
