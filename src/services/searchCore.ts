/**
 * 搜索核心：纯匹配逻辑，不依赖 DOM，可在主线程或 Web Worker 中复用。
 */

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

/** 全局搜索返回：命中列表 + 是否因上限被截断 */
export interface SearchResult {
  matches: SearchMatch[];
  truncated: boolean;
}

/** 搜索结果上限，超出后停止，保护内存与渲染性能 */
export const MAX_SEARCH_RESULTS = 5000;

/** 主线程 → Worker 的请求消息 */
export type SearchRequest =
  | {
      type: 'search';
      id: number;
      root: FileSystemDirectoryHandle;
      query: string;
      options: SearchOptions;
    }
  | { type: 'cancel'; id: number };

/** Worker → 主线程的响应消息 */
export type SearchResponse =
  | { type: 'batch'; id: number; batch: SearchMatch[] }
  | { type: 'done'; id: number; truncated: boolean }
  | { type: 'error'; id: number; message: string };

/** 仅搜索常见文本文件，跳过二进制/媒体等 */
const TEXT_FILE_RE =
  /\.(ts|tsx|js|jsx|mjs|cjs|vue|svelte|css|scss|less|html|htm|json|jsonc|md|markdown|ya?ml|xml|txt|py|go|java|rs|c|h|cpp|cc|cxx|hpp|cs|rb|php|sh|bash|sql|toml|ini|env|conf|log)$/i;

const MAX_SEARCH_FILE_SIZE = 2 * 1024 * 1024; // 跳过 >2MB 的文件

/** 转义正则元字符 */
export const escapeRegExp = (input: string): string =>
  input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** 转义用于 String.prototype.replace 替换串中的 $，避免被误当作捕获组引用 */
export const escapeReplacement = (input: string): string =>
  input.replace(/\$/g, '$$$$');

/** 根据查询与选项构造全局正则；非法正则返回 null */
export function buildRegex(
  query: string,
  options: SearchOptions
): RegExp | null {
  let source = options.useRegex ? query : escapeRegExp(query);
  if (options.wholeWord) source = `\\b(?:${source})\\b`;
  try {
    return new RegExp(source, options.caseSensitive ? 'g' : 'gi');
  } catch {
    return null;
  }
}

/** 让步事件循环：切碎长任务，同时让取消消息有机会被处理 */
const yieldToLoop = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 0));

/**
 * 递归遍历目录并逐行匹配，增量回调结果。
 * 与运行环境无关：主线程或 Worker 均可调用。
 * @param root 根目录句柄
 * @param query 关键字或正则源
 * @param options 匹配选项
 * @param onBatch 增量命中回调
 * @param isCanceled 取消检查（返回 true 时尽快停止）
 */
export async function walkAndMatch(
  root: FileSystemDirectoryHandle,
  query: string,
  options: SearchOptions,
  onBatch: (matches: SearchMatch[]) => void,
  isCanceled: () => boolean
): Promise<{ truncated: boolean }> {
  const pattern = buildRegex(query, options);
  if (!pattern) return { truncated: false };

  let truncated = false;
  let count = 0;
  let pending: SearchMatch[] = [];
  let lastYield =
    typeof performance !== 'undefined' ? performance.now() : Date.now();

  const flush = () => {
    if (pending.length) {
      onBatch(pending);
      pending = [];
    }
  };

  const walk = async (
    dir: FileSystemDirectoryHandle,
    prefix: string
  ): Promise<void> => {
    for await (const [name, handle] of dir.entries()) {
      if (isCanceled() || truncated) return;
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
          pending.push({
            path: entryPath,
            line: i + 1,
            column: m.index + 1,
            matchLength: m[0].length || 1,
            lineText,
          });
          count++;
          // 防止零宽匹配导致死循环
          if (m.index === pattern.lastIndex) pattern.lastIndex++;
          if (count >= MAX_SEARCH_RESULTS) {
            truncated = true;
            break;
          }
        }
        if (truncated) break;
      }

      // 周期性推送增量结果并让步事件循环（便于响应取消）
      const now =
        typeof performance !== 'undefined' ? performance.now() : Date.now();
      if (now - lastYield > 12) {
        flush();
        await yieldToLoop();
        lastYield =
          typeof performance !== 'undefined' ? performance.now() : Date.now();
        if (isCanceled()) return;
      }
    }
  };

  await walk(root, '');
  flush();
  return { truncated };
}
