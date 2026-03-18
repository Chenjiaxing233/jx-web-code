import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import type { EditorState, EditorAction } from '../types';

const initialState: EditorState = {
  tree: [],
  files: [],
  activeFileId: '',
  theme: 'vs-dark',
  toast: null,
};

function editorReducer(
  state: EditorState,
  action: EditorAction,
): EditorState {
  switch (action.type) {
    case 'SET_TREE':
      return { ...state, tree: action.payload };
    case 'ADD_FILE': {
      const exists = state.files.find((f) => f.id === action.payload.id);
      if (exists) {
        return { ...state, activeFileId: action.payload.id };
      }
      return {
        ...state,
        files: [...state.files, action.payload],
        activeFileId: action.payload.id,
      };
    }
    case 'REMOVE_FILE': {
      const remaining = state.files.filter((f) => f.id !== action.payload);
      const newActiveId =
        remaining.length === 0
          ? ''
          : state.activeFileId === action.payload
            ? remaining[0].id
            : state.activeFileId;
      return { ...state, files: remaining, activeFileId: newActiveId };
    }
    case 'SET_ACTIVE_FILE':
      return { ...state, activeFileId: action.payload };
    case 'UPDATE_FILE_CONTENT':
      return {
        ...state,
        files: state.files.map((f) =>
          f.id === action.payload.id
            ? { ...f, content: action.payload.content }
            : f,
        ),
      };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SHOW_TOAST':
      return { ...state, toast: action.payload };
    case 'HIDE_TOAST':
      return { ...state, toast: null };
    default:
      return state;
  }
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

export function getLanguageFromFileName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'go':
      return 'go';
    case 'java':
      return 'java';
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'py':
      return 'python';
    case 'json':
      return 'json';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'md':
      return 'markdown';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'xml':
      return 'xml';
    case 'sql':
      return 'sql';
    case 'sh':
    case 'bash':
      return 'shell';
    case 'rs':
      return 'rust';
    case 'cpp':
    case 'cc':
    case 'cxx':
      return 'cpp';
    case 'c':
      return 'c';
    case 'vue':
      return 'vue';
    case 'svelte':
      return 'html';
    case 'scss':
      return 'scss';
    case 'less':
      return 'less';
    default:
      return 'plaintext';
  }
}
