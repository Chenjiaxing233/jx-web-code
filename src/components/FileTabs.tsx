import { useEditorState, useEditorDispatch } from '../stores/editorStore';
import '../styles/tabs.css';

export default function FileTabs() {
  const { files, activeFileId } = useEditorState();
  const dispatch = useEditorDispatch();

  if (files.length === 0) return null;

  return (
    <div className="file-tabs">
      {files.map((file) => (
        <div
          key={file.id}
          className={`tab ${file.id === activeFileId ? 'tab-active' : ''}`}
          onClick={() => dispatch({ type: 'SET_ACTIVE_FILE', payload: file.id })}
        >
          <span className="tab-name">{file.name}</span>
          <span
            className="tab-close"
            onClick={(e) => {
              e.stopPropagation();
              dispatch({ type: 'REMOVE_FILE', payload: file.id });
            }}
          >
            ×
          </span>
        </div>
      ))}
    </div>
  );
}
