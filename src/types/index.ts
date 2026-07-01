export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  loaded?: boolean;
  loading?: boolean;
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  language: string;
  content: string;
  lastModified?: number;
}

export type Theme = 'vs' | 'vs-dark';

export interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

/** 新建请求信号：token 每次递增以触发 Sidebar 响应 */
export interface CreateRequest {
  type: 'file' | 'directory';
  token: number;
}

export interface EditorState {
  tree: FileTreeNode[];
  files: FileItem[];
  dirtyFiles: Set<string>;
  activeFileId: string;
  theme: Theme;
  toast: ToastMessage | null;
  createRequest: CreateRequest | null;
}

export type EditorAction =
  | { type: 'SET_TREE'; payload: FileTreeNode[] }
  | { type: 'ADD_FILE'; payload: FileItem }
  | { type: 'REMOVE_FILE'; payload: string }
  | { type: 'SET_ACTIVE_FILE'; payload: string }
  | { type: 'UPDATE_FILE_CONTENT'; payload: { id: string; content: string } }
  | {
      type: 'MARK_FILE_SAVED';
      payload: { id: string; content: string; lastModified?: number };
    }
  | {
      type: 'RELOAD_FILE';
      payload: { id: string; content: string; lastModified: number };
    }
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'SHOW_TOAST'; payload: ToastMessage }
  | { type: 'HIDE_TOAST' }
  | { type: 'REQUEST_CREATE'; payload: 'file' | 'directory' };
