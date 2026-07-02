/**
 * 搜索 Worker：在独立线程遍历目录并匹配，避免阻塞主线程渲染。
 * 只接收根目录句柄（结构化克隆，轻量），不复制文件内容。
 */
import {
  walkAndMatch,
  type SearchRequest,
  type SearchResponse,
} from './searchCore';

// 避免引入 webworker lib 造成 self 类型冲突，这里做最小化类型断言
const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<SearchRequest>) => void) | null;
  postMessage: (message: SearchResponse) => void;
};

// 已取消的请求 id 集合，供匹配循环在让步间隙检查
const canceled = new Set<number>();

ctx.onmessage = async (event) => {
  const data = event.data;

  if (data.type === 'cancel') {
    canceled.add(data.id);
    return;
  }

  const { id, root, query, options } = data;
  try {
    const { truncated } = await walkAndMatch(
      root,
      query,
      options,
      (batch) => {
        if (!canceled.has(id)) ctx.postMessage({ type: 'batch', id, batch });
      },
      () => canceled.has(id)
    );
    if (!canceled.has(id)) ctx.postMessage({ type: 'done', id, truncated });
  } catch (err) {
    if (!canceled.has(id)) {
      ctx.postMessage({
        type: 'error',
        id,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  } finally {
    canceled.delete(id);
  }
};
