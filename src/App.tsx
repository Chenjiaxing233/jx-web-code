import { useRef, useState, type MouseEvent } from 'react';
import {
  EditorProvider,
  useEditorState,
  useEditorDispatch,
} from './stores/editorStore';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import FileTabs from './components/FileTabs';
import Editor from './components/Editor';
import { Toast } from './components/Toast';
import './styles/common.css';

const MIN_SIDEBAR_WIDTH = 160;
const MAX_SIDEBAR_WIDTH = 480;

function AppContent() {
  const state = useEditorState();
  const dispatch = useEditorDispatch();
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const draggingRef = useRef(false);

  /** 开始拖动分隔条，实时调整侧边栏宽度 */
  const startResize = (event: MouseEvent) => {
    event.preventDefault();
    draggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (ev: globalThis.MouseEvent) => {
      if (!draggingRef.current) return;
      const next = Math.min(
        MAX_SIDEBAR_WIDTH,
        Math.max(MIN_SIDEBAR_WIDTH, ev.clientX)
      );
      setSidebarWidth(next);
    };

    const onUp = () => {
      draggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div
      className="app"
      data-theme={state.theme === 'vs-dark' ? 'dark' : 'light'}
    >
      <Header />
      <div className="main-area">
        <Sidebar width={sidebarWidth} />
        <div
          className="sidebar-resizer"
          onMouseDown={startResize}
          role="separator"
          aria-orientation="vertical"
        />
        <div className="editor-panel">
          <FileTabs />
          <Editor />
        </div>
      </div>
      {state.toast && (
        <Toast
          message={state.toast.message}
          type={state.toast.type}
          onClose={() => dispatch({ type: 'HIDE_TOAST' })}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <EditorProvider>
      <AppContent />
    </EditorProvider>
  );
}
