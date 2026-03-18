import { openDirectory, openSingleFile, refreshTree } from '../services/fs';
import {
  getLanguageFromFileName,
  useEditorDispatch,
  useEditorState,
} from '../stores/editorStore';
import '../styles/header.css';

export default function Header() {
  const { theme } = useEditorState();
  const dispatch = useEditorDispatch();

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
      const { name, content } = await openSingleFile();
      dispatch({
        type: 'ADD_FILE',
        payload: {
          id: `__single__${name}`,
          name,
          path: '',
          language: getLanguageFromFileName(name),
          content,
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
