import { EditorProvider, useEditorState, useEditorDispatch } from './stores/editorStore';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import FileTabs from './components/FileTabs';
import Editor from './components/Editor';
import { Toast } from './components/Toast';
import './styles/common.css';

function AppContent() {
  const state = useEditorState();
  const dispatch = useEditorDispatch();

  return (
    <div className="app">
      <Header />
      <div className="main-area">
        <Sidebar />
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
