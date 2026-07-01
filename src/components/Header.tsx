import { openDirectory, openSingleFile, refreshTree, getRootHandle } from '../services/fs';
import {
  getLanguageFromFileName,
  useEditorDispatch,
  useEditorState,
} from '../stores/editorStore';
import { NewFileIcon, NewFolderIcon } from './icons';
import '../styles/header.css';

export default function Header() {
  const { theme, tree } = useEditorState();
  const dispatch = useEditorDispatch();

  const hasFolder = getRootHandle() !== null || tree.length > 0;

  const toggleTheme = () => {
    dispatch({
      type: 'SET_THEME',
      payload: theme === 'vs-dark' ? 'vs' : 'vs-dark',
    });
  };

  const handleOpenFolder = async () => {
    try {
      await openDirectory();
      const tree = await refreshTree();
      dispatch({ type: 'SET_TREE', payload: tree });
    } catch (err) {
      console.error('Failed to open directory:', err);
    }
  };

  const handleOpenFile = async () => {
    try {
      const { name, content, lastModified } = await openSingleFile();
      dispatch({
        type: 'ADD_FILE',
        payload: {
          id: `__single__${name}`,
          name,
          path: '',
          language: getLanguageFromFileName(name),
          content,
          lastModified,
        },
      });
    } catch (err) {
      console.error('Failed to open file:', err);
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <span className="logo">Code Editor</span>
      </div>
      <div className="header-right">
        {hasFolder && (
          <>
            <button
              className="icon-btn"
              title="New File"
              onClick={() => dispatch({ type: 'REQUEST_CREATE', payload: 'file' })}
            >
              <NewFileIcon />
            </button>
            <button
              className="icon-btn"
              title="New Folder"
              onClick={() =>
                dispatch({ type: 'REQUEST_CREATE', payload: 'directory' })
              }
            >
              <NewFolderIcon />
            </button>
            <span className="header-divider" />
          </>
        )}
        <button className="theme-btn" onClick={handleOpenFile}>
          Open File
        </button>
        <button className="theme-btn" onClick={handleOpenFolder}>
          Open Folder
        </button>
        <button className="theme-btn" onClick={toggleTheme}>
          {theme === 'vs-dark' ? '☀ Light' : '☾ Dark'}
        </button>
      </div>
    </header>
  );
}
