import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import type { EditorAction, EditorState } from '../types';

const initialState: EditorState = {
  tree: [],
  files: [],
  dirtyFiles: new Set(),
  activeFileId: '',
  theme: 'vs-dark',
  toast: null,
  createRequest: null,
};

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  if (action.type === 'SET_TREE') {
    return { ...state, tree: action.payload };
  }

  if (action.type === 'ADD_FILE') {
    const exists = state.files.find((file) => file.id === action.payload.id);

    if (exists) {
      return { ...state, activeFileId: action.payload.id };
    }

    return {
      ...state,
      files: [...state.files, action.payload],
      activeFileId: action.payload.id,
    };
  }

  if (action.type === 'REMOVE_FILE') {
    const remaining = state.files.filter((file) => file.id !== action.payload);
    const nextDirtyFiles = new Set(state.dirtyFiles);
    nextDirtyFiles.delete(action.payload);

    const newActiveId =
      remaining.length === 0
        ? ''
        : state.activeFileId === action.payload
          ? remaining[0].id
          : state.activeFileId;

    return {
      ...state,
      files: remaining,
      dirtyFiles: nextDirtyFiles,
      activeFileId: newActiveId,
    };
  }

  if (action.type === 'SET_ACTIVE_FILE') {
    return { ...state, activeFileId: action.payload };
  }

  if (action.type === 'UPDATE_FILE_CONTENT') {
    const nextDirtyFiles = new Set(state.dirtyFiles);
    nextDirtyFiles.add(action.payload.id);

    return {
      ...state,
      dirtyFiles: nextDirtyFiles,
      files: state.files.map((file) =>
        file.id === action.payload.id
          ? { ...file, content: action.payload.content }
          : file
      ),
    };
  }

  if (action.type === 'MARK_FILE_SAVED') {
    const nextDirtyFiles = new Set(state.dirtyFiles);
    const currentFile = state.files.find(
      (file) => file.id === action.payload.id
    );

    if (currentFile?.content === action.payload.content) {
      nextDirtyFiles.delete(action.payload.id);
    }

    return {
      ...state,
      dirtyFiles: nextDirtyFiles,
      files: state.files.map((file) =>
        file.id === action.payload.id &&
        action.payload.lastModified !== undefined
          ? { ...file, lastModified: action.payload.lastModified }
          : file
      ),
    };
  }

  if (action.type === 'RELOAD_FILE') {
    const nextDirtyFiles = new Set(state.dirtyFiles);
    nextDirtyFiles.delete(action.payload.id);

    return {
      ...state,
      dirtyFiles: nextDirtyFiles,
      files: state.files.map((file) => {
        if (file.id !== action.payload.id) {
          return file;
        }

        return {
          ...file,
          content: action.payload.content,
          lastModified: action.payload.lastModified,
        };
      }),
    };
  }

  if (action.type === 'SET_THEME') {
    return { ...state, theme: action.payload };
  }

  if (action.type === 'SHOW_TOAST') {
    return { ...state, toast: action.payload };
  }

  if (action.type === 'HIDE_TOAST') {
    return { ...state, toast: null };
  }

  if (action.type === 'REQUEST_CREATE') {
    return {
      ...state,
      createRequest: {
        type: action.payload,
        token: (state.createRequest?.token ?? 0) + 1,
      },
    };
  }

  return state;
}

const EditorStateContext = createContext<EditorState>(initialState);
const EditorDispatchContext = createContext<Dispatch<EditorAction>>(() => {});

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, initialState);

  return (
    <EditorStateContext.Provider value={state}>
      <EditorDispatchContext.Provider value={dispatch}>
        {children}
      </EditorDispatchContext.Provider>
    </EditorStateContext.Provider>
  );
}

export function useEditorState() {
  return useContext(EditorStateContext);
}

export function useEditorDispatch() {
  return useContext(EditorDispatchContext);
}

/**
 * 根据文件后缀推断 Monaco 语言类型。
 */
export function getLanguageFromFileName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    go: 'go',
    java: 'java',
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    json: 'json',
    html: 'html',
    css: 'css',
    md: 'markdown',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    rs: 'rust',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    c: 'c',
    vue: 'vue',
    svelte: 'html',
    scss: 'scss',
    less: 'less',
  };

  return ext ? (languageMap[ext] ?? 'plaintext') : 'plaintext';
}
