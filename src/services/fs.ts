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

/** 单条全局搜索命中：定位到某文件的某一行 */
export interface SearchMatch {
  path: string;
  line: number; // 1-based 行号
  column: number; // 1-based 匹配起始列
  matchLength: number; // 命中文本长度
  lineText: string; // 命中所在行原文（用于列表展示与高亮）
}

/** 全局搜索选项 */
export interface SearchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  useRegex?: boolean;
}

/** 仅搜索常见文本文件，跳过二进制/媒体等 */
const TEXT_FILE_RE =
  /\.(ts|tsx|js|jsx|mjs|cjs|vue|svelte|css|scss|less|html|htm|json|jsonc|md|markdown|ya?ml|xml|txt|py|go|java|rs|c|h|cpp|cc|cxx|hpp|cs|rb|php|sh|bash|sql|toml|ini|env|conf|log)$/i;

const MAX_SEARCH_FILE_SIZE = 2 * 1024 * 1024; // 跳过 >2MB 的文件

/** 转义正则元字符 */
const escapeRegExp = (input: string): string =>
  input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** 转义用于 String.prototype.replace 替换串中的 $，避免被误当作捕获组引用 */
const escapeReplacement = (input: string): string =>
  input.replace(/\$/g, '$$$$');

/** 根据查询与选项构造全局正则；非法正则返回 null */
function buildRegex(query: string, options: SearchOptions): RegExp | null {
  let source = options.useRegex ? query : escapeRegExp(query);
  if (options.wholeWord) source = `\\b(?:${source})\\b`;
  try {
    return new RegExp(source, options.caseSensitive ? 'g' : 'gi');
  } catch {
    return null;
  }
}

/** 搜索结果上限，超出后停止，保护内存与渲染性能 */
export const MAX_SEARCH_RESULTS = 5000;

/** 让步主线程：把控制权交回事件循环，避免长任务阻塞渲染与交互 */
const yieldToMain = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 0));

/** 全局搜索返回：命中列表 + 是否因上限被截断 */
export interface SearchResult {
  matches: SearchMatch[];
  truncated: boolean;
}

/**
 * 在已打开的根目录下全局搜索文本，返回每个命中一条结果。
 * 采用增量回调 + 周期性让步主线程，避免大项目搜索阻塞渲染。
 * @param query 关键字或正则源
 * @param options 匹配选项（大小写 / 全字 / 正则）
 * @param signal 可选中断信号，用于取消过期搜索
 * @param onBatch 增量结果回调，便于 UI 边搜边渲染
 */
export async function searchInWorkspace(
  query: string,
  options: SearchOptions = {},
  signal?: AbortSignal,
  onBatch?: (matches: SearchMatch[]) => void
): Promise<SearchResult> {
  if (!rootHandle || !query) return { matches: [], truncated: false };

  const pattern = buildRegex(query, options);
  if (!pattern) return { matches: [], truncated: false };

  const results: SearchMatch[] = [];
  let pending: SearchMatch[] = [];
  let truncated = false;
  let lastYield = performance.now();

  const flush = () => {
    if (pending.length && onBatch) {
      onBatch(pending);
      pending = [];
    }
  };

  const walk = async (
    dir: FileSystemDirectoryHandle,
    prefix: string
  ): Promise<void> => {
    for await (const [name, handle] of dir.entries()) {
      if (signal?.aborted || truncated) return;
      if (name.startsWith('.') || name === 'node_modules') continue;
      const entryPath = prefix ? `${prefix}/${name}` : name;

      if (handle.kind === 'directory') {
        await walk(handle, entryPath);
        continue;
      }

      if (!TEXT_FILE_RE.test(name)) continue;
      const file = await handle.getFile();
      if (file.size > MAX_SEARCH_FILE_SIZE) continue;

      const lines = (await file.text()).split('\n');
      for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i].replace(/\r$/, '');
        pattern.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = pattern.exec(lineText)) !== null) {
          const item: SearchMatch = {
            path: entryPath,
            line: i + 1,
            column: m.index + 1,
            matchLength: m[0].length || 1,
            lineText,
          };
          results.push(item);
          pending.push(item);
          // 防止零宽匹配导致死循环
          if (m.index === pattern.lastIndex) pattern.lastIndex++;
          if (results.length >= MAX_SEARCH_RESULTS) {
            truncated = true;
            break;
          }
        }
        if (truncated) break;
      }

      // 周期性让步主线程并推送增量结果，避免长任务
      if (performance.now() - lastYield > 12) {
        flush();
        await yieldToMain();
        lastYield = performance.now();
        if (signal?.aborted) return;
      }
    }
  };

  await walk(rootHandle, '');
  flush();
  return { matches: results, truncated };
}

/** 替换结果：替换次数 + 新内容 + 新修改时间 */
export interface ReplaceResult {
  count: number;
  content: string;
  lastModified: number;
}

/**
 * 替换单个文件内的所有命中并写回磁盘。
 */
export async function replaceAllInFile(
  path: string,
  query: string,
  replacement: string,
  options: SearchOptions = {}
): Promise<ReplaceResult> {
  const pattern = buildRegex(query, options);
  const { content } = await readFile(path);
  if (!pattern) return { count: 0, content, lastModified: 0 };

  const matches = content.match(pattern);
  const count = matches ? matches.length : 0;
  if (count === 0) {
    return { count: 0, content, lastModified: await getFileLastModified(path) };
  }

  const repl = options.useRegex ? replacement : escapeReplacement(replacement);
  const next = content.replace(pattern, repl);
  await writeFile(path, next);
  return {
    count,
    content: next,
    lastModified: await getFileLastModified(path),
  };
}

/**
 * 替换单条命中（按行列精确定位），写回磁盘。
 */
export async function replaceMatchInFile(
  match: SearchMatch,
  query: string,
  replacement: string,
  options: SearchOptions = {}
): Promise<ReplaceResult> {
  const globalPattern = buildRegex(query, options);
  const { content } = await readFile(match.path);
  if (!globalPattern) return { count: 0, content, lastModified: 0 };

  // 非全局版本，仅对命中文本本身做一次替换（保证捕获组 $1 正确）
  const single = new RegExp(
    globalPattern.source,
    globalPattern.flags.replace('g', '')
  );

  const lines = content.split('\n');
  const idx = match.line - 1;
  const line = lines[idx] ?? '';
  const start = match.column - 1;
  const matched = line.slice(start, start + match.matchLength);
  const repl = options.useRegex ? replacement : escapeReplacement(replacement);
  const newText = matched.replace(single, repl);

  lines[idx] =
    line.slice(0, start) + newText + line.slice(start + match.matchLength);
  const next = lines.join('\n');
  await writeFile(match.path, next);
  return {
    count: 1,
    content: next,
    lastModified: await getFileLastModified(match.path),
  };
}
