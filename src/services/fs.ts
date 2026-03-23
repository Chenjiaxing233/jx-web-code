import type { FileTreeNode } from '../types';

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

function sortTreeNodes(nodes: FileTreeNode[]): FileTreeNode[] {
  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * 读取目录的当前层级，并将子目录标记为未加载状态。
 */
export async function buildTreeAsync(
  dirHandle: FileSystemDirectoryHandle,
  parentPath = ''
): Promise<FileTreeNode[]> {
  const entries: FileTreeNode[] = [];
  for await (const [name, handle] of dirHandle.entries()) {
    if (name.startsWith('.')) continue;
    const entryPath = parentPath ? `${parentPath}/${name}` : name;
    if (handle.kind === 'directory') {
      entries.push({
        name,
        path: entryPath,
        type: 'directory',
        children: [],
        loaded: false,
        loading: false,
      });
    } else {
      entries.push({ name, path: entryPath, type: 'file' });
    }
  }
  return sortTreeNodes(entries);
}

/**
 * 向后兼容旧调用方，默认也只加载当前层级。
 */
export async function buildTree(
  dirHandle: FileSystemDirectoryHandle,
  parentPath = ''
): Promise<FileTreeNode[]> {
  return buildTreeAsync(dirHandle, parentPath);
}

async function navigateToDir(path: string): Promise<FileSystemDirectoryHandle> {
  if (!rootHandle) throw new Error('No directory opened');
  if (!path) return rootHandle;
  const parts = path.split('/').filter(Boolean);
  let current = rootHandle;
  for (const part of parts) {
    current = await current.getDirectoryHandle(part);
  }
  return current;
}

export async function readFile(
  filePath: string
): Promise<{ content: string; lastModified: number }> {
  if (!rootHandle) {
    throw new Error('No directory opened - rootHandle is null');
  }
  const parts = filePath.split('/');
  const fileName = parts.pop()!;
  const dirPath = parts.join('/');
  const dirHandle = await navigateToDir(dirPath);
  const fileHandle = await dirHandle.getFileHandle(fileName);
  const file = await fileHandle.getFile();
  return {
    content: await file.text(),
    lastModified: file.lastModified,
  };
}

export async function writeFile(
  filePath: string,
  content: string
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

/**
 * 读取指定文件的最新修改时间。
 */
export async function getFileLastModified(filePath: string): Promise<number> {
  const parts = filePath.split('/');
  const fileName = parts.pop()!;
  const dirPath = parts.join('/');
  const dirHandle = await navigateToDir(dirPath);
  const fileHandle = await dirHandle.getFileHandle(fileName);
  const file = await fileHandle.getFile();

  return file.lastModified;
}

export async function createFile(
  parentPath: string,
  fileName: string
): Promise<void> {
  const dirHandle = await navigateToDir(parentPath);
  await dirHandle.getFileHandle(fileName, { create: true });
}

export async function createFolder(
  parentPath: string,
  folderName: string
): Promise<void> {
  const dirHandle = await navigateToDir(parentPath);
  await dirHandle.getDirectoryHandle(folderName, { create: true });
}

/**
 * 按目录路径异步加载单个文件夹的直接子节点。
 */
export async function loadDirectoryChildren(
  directoryPath: string
): Promise<FileTreeNode[]> {
  const dirHandle = await navigateToDir(directoryPath);
  return buildTreeAsync(dirHandle, directoryPath);
}

/**
 * 刷新根目录，仅返回首层节点。
 */
export async function refreshTree(): Promise<FileTreeNode[]> {
  if (!rootHandle) return [];
  return buildTreeAsync(rootHandle);
}

export async function openSingleFile(): Promise<{
  name: string;
  content: string;
  lastModified: number;
}> {
  const [fileHandle] = await window.showOpenFilePicker({ multiple: false });
  const file = await fileHandle.getFile();
  const content = await file.text();
  singleFileHandles.set(file.name, fileHandle);
  return { name: file.name, content, lastModified: file.lastModified };
}

export function getSingleFileHandle(
  name: string
): FileSystemFileHandle | undefined {
  return singleFileHandles.get(name);
}

export async function writeSingleFile(
  name: string,
  content: string
): Promise<void> {
  const handle = singleFileHandles.get(name);
  if (!handle) throw new Error('No file handle for: ' + name);
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}

/**
 * 读取单文件模式下文件的最新修改时间。
 */
export async function getSingleFileLastModified(name: string): Promise<number> {
  const handle = singleFileHandles.get(name);
  if (!handle) throw new Error('No file handle for: ' + name);

  const file = await handle.getFile();
  return file.lastModified;
}

export async function deleteFile(filePath: string): Promise<void> {
  if (!rootHandle) throw new Error('No directory opened');

  const parts = filePath.split('/');
  const fileName = parts.pop()!;
  const dirPath = parts.join('/');

  const dirHandle = await navigateToDir(dirPath);
  await dirHandle.removeEntry(fileName, { recursive: true });
}

export async function checkFileModified(
  filePath: string,
  lastKnownModified: number
): Promise<boolean> {
  try {
    if (!rootHandle) {
      return false;
    }
    const parts = filePath.split('/');
    const fileName = parts.pop()!;
    const dirPath = parts.join('/');
    const dirHandle = await navigateToDir(dirPath);
    const fileHandle = await dirHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return file.lastModified > lastKnownModified;
  } catch (error) {
    return false;
  }
}
