export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
}

let rootHandle: FileSystemDirectoryHandle | null = null;
const singleFileHandles = new Map<string, FileSystemFileHandle>();

export function getRootHandle(): FileSystemDirectoryHandle | null {
  return rootHandle;
}

export async function openDirectory(): Promise<FileSystemDirectoryHandle> {
  const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
  rootHandle = handle;
  return handle;
}

export async function buildTree(
  dirHandle: FileSystemDirectoryHandle,
  parentPath = '',
): Promise<TreeNode[]> {
  const entries: TreeNode[] = [];
  for await (const [name, handle] of dirHandle.entries()) {
    if (name.startsWith('.')) continue;
    const entryPath = parentPath ? `${parentPath}/${name}` : name;
    if (handle.kind === 'directory') {
      const children = await buildTree(
        handle as FileSystemDirectoryHandle,
        entryPath,
      );
      entries.push({ name, path: entryPath, type: 'directory', children });
    } else {
      entries.push({ name, path: entryPath, type: 'file' });
    }
  }
  entries.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return entries;
}

async function navigateToDir(
  path: string,
): Promise<FileSystemDirectoryHandle> {
  if (!rootHandle) throw new Error('No directory opened');
  if (!path) return rootHandle;
  const parts = path.split('/').filter(Boolean);
  let current = rootHandle;
  for (const part of parts) {
    current = await current.getDirectoryHandle(part);
  }
  return current;
}

export async function readFile(filePath: string): Promise<string> {
  const parts = filePath.split('/');
  const fileName = parts.pop()!;
  const dirPath = parts.join('/');
  const dirHandle = await navigateToDir(dirPath);
  const fileHandle = await dirHandle.getFileHandle(fileName);
  const file = await fileHandle.getFile();
  return file.text();
}

export async function writeFile(
  filePath: string,
  content: string,
): Promise<void> {
  const parts = filePath.split('/');
  const fileName = parts.pop()!;
  const dirPath = parts.join('/');
  const dirHandle = await navigateToDir(dirPath);
  const fileHandle = await dirHandle.getFileHandle(fileName);
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

export async function createFile(
  parentPath: string,
  fileName: string,
): Promise<void> {
  const dirHandle = await navigateToDir(parentPath);
  await dirHandle.getFileHandle(fileName, { create: true });
}

export async function createFolder(
  parentPath: string,
  folderName: string,
): Promise<void> {
  const dirHandle = await navigateToDir(parentPath);
  await dirHandle.getDirectoryHandle(folderName, { create: true });
}

export async function refreshTree(): Promise<TreeNode[]> {
  if (!rootHandle) return [];
  return buildTree(rootHandle);
}

export async function openSingleFile(): Promise<{
  name: string;
  content: string;
}> {
  const [fileHandle] = await window.showOpenFilePicker({ multiple: false });
  const file = await fileHandle.getFile();
  const content = await file.text();
  singleFileHandles.set(file.name, fileHandle);
  return { name: file.name, content };
}

export function getSingleFileHandle(
  name: string,
): FileSystemFileHandle | undefined {
  return singleFileHandles.get(name);
}

export async function writeSingleFile(
  name: string,
  content: string,
): Promise<void> {
  const handle = singleFileHandles.get(name);
  if (!handle) throw new Error('No file handle for: ' + name);
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}

export async function deleteFile(filePath: string): Promise<void> {
  if (!rootHandle) throw new Error('No directory opened');

  const parts = filePath.split('/');
  const fileName = parts.pop()!;
  const dirPath = parts.join('/');

  const dirHandle = await navigateToDir(dirPath);
  await dirHandle.removeEntry(fileName, { recursive: true });
}
