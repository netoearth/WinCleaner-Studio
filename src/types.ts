export type ActiveTab = 'cleaner' | 'duplicates' | 'large_files' | 'uninstaller' | 'startup' | 'code_engine';

export type CleanerCategory = 'windows' | 'browser' | 'developer' | 'system';

export interface CleanableFile {
  id: string;
  path: string;
  name: string;
  sizeBytes: number;
  modified: string;
  category: CleanerCategory;
  isSafe: boolean;
}

export interface CleanerRule {
  id: string;
  category: CleanerCategory;
  name: string;
  description: string;
  pathPattern: string;
  win32ApiNote: string;
  risk: 'safe' | 'caution' | 'notice';
  sizeBytes: number;
  fileCount: number;
  selected: boolean;
  files: CleanableFile[];
}

export interface DuplicateFileItem {
  id: string;
  path: string;
  folder: string;
  sizeBytes: number;
  modified: string;
  selected: boolean;
}

export interface DuplicateGroup {
  id: string;
  name: string;
  extension: string;
  hash: string;
  sizeBytes: number; // size per file
  totalWastedBytes: number;
  category: 'video' | 'installer' | 'document' | 'archive' | 'audio' | 'image' | 'code';
  files: DuplicateFileItem[];
}

export interface LargeFileItem {
  id: string;
  name: string;
  path: string;
  folder: string;
  extension: string;
  sizeBytes: number;
  modified: string;
  category: 'iso_disk' | 'installer' | 'media' | 'archive' | 'database' | 'temp_cache';
  drive: string;
}

export interface InstalledApp {
  id: string;
  name: string;
  publisher: string;
  version: string;
  installDate: string;
  sizeBytes: number;
  iconType: 'browser' | 'dev' | 'game' | 'utility' | 'system';
  isMsi: boolean;
  isBloatware: boolean;
  uninstallString: string;
  quietUninstallString?: string;
  installLocation: string;
  registryKey: string;
  leftoverFolders: string[];
  leftoverRegistryKeys: string[];
}

export interface StartupItem {
  id: string;
  name: string;
  publisher: string;
  command: string;
  location: 'HKCU\\Run' | 'HKLM\\Run' | 'Startup Folder' | 'Task Scheduler';
  impact: 'High' | 'Medium' | 'Low';
  enabled: boolean;
  fileSizeEstimate: string;
}

export interface DriveInfo {
  letter: string;
  label: string;
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  fileSystem: string;
  isSystemDrive: boolean;
}

export interface DiskSpaceCategory {
  id: 'system' | 'apps' | 'personal' | 'cache' | 'free';
  name: string;
  bytes: number;
  color: string;
  description: string;
  pathExamples: string;
}

export interface SmartAttribute {
  id: string;
  name: string;
  current: number;
  worst: number;
  threshold: number;
  raw: string;
  status: 'good' | 'warning' | 'critical';
}

export interface DiskSmartInfo {
  diskIndex: number;
  letter: string;
  model: string;
  interface: 'NVMe PCIe 4.0 x4' | 'SATA 6Gb/s';
  firmware: string;
  serialNumber: string;
  temperatureC: number;
  temperatureStatus: 'normal' | 'warm' | 'hot';
  healthPercent: number;
  healthStatus: 'good' | 'caution' | 'bad';
  remainingLifePercent: number;
  totalHostWritesTB: number;
  tbwRatingTB: number;
  powerOnHours: number;
  powerOnCount: number;
  unsafeShutdowns: number;
  reallocatedSectors: number;
  wearLevelingCount: number;
  attributes: SmartAttribute[];
  win32IoApi: string;
}

export interface ScanProgressState {
  isScanning: boolean;
  isCleaning: boolean;
  currentOperation: string;
  progressPercent: number;
  scannedFilesCount: number;
  foundJunkBytes: number;
}

export interface AiCleanupSuggestion {
  id: string;
  category: 'junk' | 'duplicates' | 'apps' | 'large_files';
  title: string;
  potentialBytes: number;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  actionLabel: string;
  targetTab: ActiveTab;
}
