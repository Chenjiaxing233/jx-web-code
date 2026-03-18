export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  language: string;
  content: string;
}

export type Theme = 'vs' | 'vs-dark';

export interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export interface EditorState {
  tree: FileTreeNode[];
  files: FileItem[];
  activeFileId: string;
  theme: Theme;
  toast: ToastMessage | null;
}

export type EditorAction =
  | { type: 'SET_TREE'; payload: FileTreeNode[] }
  | { type: 'ADD_FILE'; payload: FileItem }
  | { type: 'REMOVE_FILE'; payload: string }
  | { type: 'SET_ACTIVE_FILE'; payload: string }
  | { type: 'UPDATE_FILE_CONTENT'; payload: { id: string; content: string } }
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'SHOW_TOAST'; payload: ToastMessage }
  | { type: 'HIDE_TOAST' };
