// Type declarations for the File System Access API
// These augment the existing DOM types with methods that may not be included

interface FileSystemDirectoryHandle {
  entries(): AsyncIterableIterator<
    [string, FileSystemDirectoryHandle | FileSystemFileHandle]
  >;
}

interface Window {
  showDirectoryPicker(options?: {
    mode?: string;
  }): Promise<FileSystemDirectoryHandle>;
  showOpenFilePicker(options?: {
    multiple?: boolean;
  }): Promise<FileSystemFileHandle[]>;
}
