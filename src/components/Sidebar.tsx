import { useEffect, useRef, useState } from "react";
import {
  createFile,
  createFolder,
  deleteFile,
  getRootHandle,
  openDirectory,
  openSingleFile,
  readFile,
  refreshTree,
} from "../services/fs";
import {
  getLanguageFromFileName,
  useEditorDispatch,
  useEditorState,
} from "../stores/editorStore";
import type { FileTreeNode } from "../types";
import '../styles/sidebar.css';

function getFileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "go":
      return "🔵";
    case "java":
      return "🟠";
    case "js":
    case "jsx":
      return "🟡";
    case "ts":
    case "tsx":
      return "🔷";
    case "py":
      return "🟢";
    case "json":
      return "📋";
    case "md":
      return "📝";
    case "css":
      return "🎨";
    case "html":
      return "🌐";
    default:
      return "📄";
  }
}

function InlineInput({
  depth,
  type,
  onSubmit,
  onCancel,
}: {
  depth: number;
  type: "file" | "directory";
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div
      className="tree-item tree-input-row"
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
    >
      <span className="tree-file-icon">{type === "file" ? "📄" : "📁"}</span>
      <input
        ref={inputRef}
        className="tree-inline-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) {
            e.preventDefault();
            onSubmit(value.trim());
          }
          if (e.key === "Escape") {
            onCancel();
          }
        }}
        onBlur={() => onCancel()}
        placeholder={type === "file" ? "filename" : "folder name"}
      />
    </div>
  );
}

function TreeNodeItem({
  node,
  depth,
  expanded,
  activeFileId,
  toggleExpand,
  onOpenFile,
  onStartCreating,
  creating,
  onCreateSubmit,
  onCreateCancel,
  onDelete,
}: {
  node: FileTreeNode;
  depth: number;
  expanded: Set<string>;
  activeFileId: string;
  toggleExpand: (path: string) => void;
  onOpenFile: (node: FileTreeNode) => void;
  onStartCreating: (type: "file" | "directory", parentPath: string) => void;
  creating: { parentPath: string; type: "file" | "directory" } | null;
  onCreateSubmit: (name: string) => void;
  onCreateCancel: () => void;
  onDelete: (node: FileTreeNode) => void;
}) {
  if (node.type === "directory") {
    const isExpanded = expanded.has(node.path);
    return (
      <>
        <div
          className="tree-item tree-folder"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => toggleExpand(node.path)}
        >
          <span className="tree-arrow">{isExpanded ? "▾" : "▸"}</span>
          <span className="tree-name">{node.name}</span>
          <div className="tree-item-actions">
            <span
              className="tree-action-btn"
              title="New File"
              onClick={(e) => {
                e.stopPropagation();
                onStartCreating("file", node.path);
              }}
            >
              +
            </span>
            <span
              className="tree-action-btn"
              title="New Folder"
              onClick={(e) => {
                e.stopPropagation();
                onStartCreating("directory", node.path);
              }}
            >
              &#8862;
            </span>
            <span
              className="tree-action-btn tree-delete-btn"
              title="Delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(node);
              }}
            >
              ✕
            </span>
          </div>
        </div>
        {isExpanded && (
          <>
            {creating && creating.parentPath === node.path && (
              <InlineInput
                depth={depth + 1}
                type={creating.type}
                onSubmit={onCreateSubmit}
                onCancel={onCreateCancel}
              />
            )}
            {node.children?.map((child) => (
              <TreeNodeItem
                key={child.path}
                node={child}
                depth={depth + 1}
                expanded={expanded}
                activeFileId={activeFileId}
                toggleExpand={toggleExpand}
                onOpenFile={onOpenFile}
                onStartCreating={onStartCreating}
                creating={creating}
                onCreateSubmit={onCreateSubmit}
                onCreateCancel={onCreateCancel}
                onDelete={onDelete}
              />
            ))}
          </>
        )}
      </>
    );
  }

  return (
    <div
      className={`tree-item tree-file ${node.path === activeFileId ? "tree-item-active" : ""}`}
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
      onClick={() => onOpenFile(node)}
    >
      <span className="tree-file-icon">{getFileIcon(node.name)}</span>
      <span className="tree-name">{node.name}</span>
      <div className="tree-item-actions">
        <span
          className="tree-action-btn tree-delete-btn"
          title="Delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node);
          }}
        >
          ✕
        </span>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { tree, files, activeFileId } = useEditorState();
  const dispatch = useEditorDispatch();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState<{
    parentPath: string;
    type: "file" | "directory";
  } | null>(null);

  const toggleExpand = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const loadTree = async () => {
    const nodes = await refreshTree();
    dispatch({ type: "SET_TREE", payload: nodes });
  };

  const handleOpenFile = async (node: FileTreeNode) => {
    const existing = files.find((f) => f.id === node.path);
    if (existing) {
      dispatch({ type: "SET_ACTIVE_FILE", payload: existing.id });
      return;
    }
    try {
      const content = await readFile(node.path);
      dispatch({
        type: "ADD_FILE",
        payload: {
          id: node.path,
          name: node.name,
          path: node.path,
          language: getLanguageFromFileName(node.name),
          content,
        },
      });
    } catch (err) {
      console.error("Failed to read file:", err);
      dispatch({
        type: "SHOW_TOAST",
        payload: {
          message: `打开文件失败: ${err instanceof Error ? err.message : "未知错误"}`,
          type: "error",
        },
      });
    }
  };

  const handleCreate = async (name: string) => {
    if (!creating || !name.trim()) {
      setCreating(null);
      return;
    }
    try {
      if (creating.type === "file") {
        await createFile(creating.parentPath, name.trim());
      } else {
        await createFolder(creating.parentPath, name.trim());
      }
      if (creating.parentPath) {
        setExpanded((prev) => new Set([...prev, creating.parentPath]));
      }
      setCreating(null);
      await loadTree();
      dispatch({
        type: "SHOW_TOAST",
        payload: {
          message: `${creating.type === "file" ? "文件" : "文件夹"}创建成功`,
          type: "success",
        },
      });
    } catch (err) {
      console.error("Failed to create:", err);
      dispatch({
        type: "SHOW_TOAST",
        payload: {
          message: `创建失败: ${err instanceof Error ? err.message : "未知错误"}`,
          type: "error",
        },
      });
      setCreating(null);
    }
  };

  const handleDelete = async (node: FileTreeNode) => {
    const confirmMsg = node.type === "directory"
      ? `确定要删除文件夹 "${node.name}" 及其所有内容吗？`
      : `确定要删除文件 "${node.name}" 吗？`;

    if (!confirm(confirmMsg)) {
      return;
    }

    try {
      await deleteFile(node.path);

      // 如果删除的是文件，关闭对应的编辑器标签
      if (node.type === "file") {
        dispatch({ type: "REMOVE_FILE", payload: node.path });
      } else {
        // 如果删除的是文件夹，关闭该文件夹下所有打开的文件
        const filesToClose = files.filter((f) => f.path.startsWith(node.path + "/") || f.path === node.path);
        filesToClose.forEach((f) => {
          dispatch({ type: "REMOVE_FILE", payload: f.id });
        });
      }

      await loadTree();
      dispatch({
        type: "SHOW_TOAST",
        payload: {
          message: `${node.type === "file" ? "文件" : "文件夹"}删除成功`,
          type: "success",
        },
      });
    } catch (err) {
      console.error("Failed to delete:", err);
      dispatch({
        type: "SHOW_TOAST",
        payload: {
          message: `删除失败: ${err instanceof Error ? err.message : "未知错误"}`,
          type: "error",
        },
      });
    }
  };

  const startCreating = (type: "file" | "directory", parentPath = "") => {
    setCreating({ parentPath, type });
    if (parentPath) {
      setExpanded((prev) => new Set([...prev, parentPath]));
    }
  };

  const handleOpenFolder = async () => {
    try {
      await openDirectory();
      await loadTree();
      dispatch({
        type: "SHOW_TOAST",
        payload: {
          message: "文件夹打开成功",
          type: "success",
        },
      });
    } catch (err) {
      console.error("Failed to open directory:", err);
      dispatch({
        type: "SHOW_TOAST",
        payload: {
          message: `打开文件夹失败: ${err instanceof Error ? err.message : "未知错误"}`,
          type: "error",
        },
      });
    }
  };

  const handleOpenSingleFile = async () => {
    try {
      const { name, content } = await openSingleFile();
      dispatch({
        type: "ADD_FILE",
        payload: {
          id: `__single__${name}`,
          name,
          path: "",
          language: getLanguageFromFileName(name),
          content,
        },
      });
      dispatch({
        type: "SHOW_TOAST",
        payload: {
          message: "文件打开成功",
          type: "success",
        },
      });
    } catch (err) {
      console.error("Failed to open file:", err);
      dispatch({
        type: "SHOW_TOAST",
        payload: {
          message: `打开文件失败: ${err instanceof Error ? err.message : "未知错误"}`,
          type: "error",
        },
      });
    }
  };

  const hasFolder = getRootHandle() !== null;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Explorer</span>
        {hasFolder && (
          <div className="sidebar-actions">
            <button
              className="sidebar-action-btn"
              title="New File"
              onClick={() => startCreating("file")}
            >
              +
            </button>
            <button
              className="sidebar-action-btn"
              title="New Folder"
              onClick={() => startCreating("directory")}
            >
              &#8862;
            </button>
          </div>
        )}
      </div>
      {!hasFolder ? (
        <div className="sidebar-empty">
          <button className="open-folder-btn" onClick={handleOpenSingleFile}>
            Open File
          </button>
          <button className="open-folder-btn" onClick={handleOpenFolder}>
            Open Folder
          </button>
          <p className="sidebar-hint">Open a file or folder to start editing</p>
        </div>
      ) : (
        <div className="file-tree">
          {creating && creating.parentPath === "" && (
            <InlineInput
              depth={0}
              type={creating.type}
              onSubmit={handleCreate}
              onCancel={() => setCreating(null)}
            />
          )}
          {tree.map((node) => (
            <TreeNodeItem
              key={node.path}
              node={node}
              depth={0}
              expanded={expanded}
              activeFileId={activeFileId}
              toggleExpand={toggleExpand}
              onOpenFile={handleOpenFile}
              onStartCreating={startCreating}
              creating={creating}
              onCreateSubmit={handleCreate}
              onCreateCancel={() => setCreating(null)}
              onDelete={handleDelete}
            />
          ))}
          {tree.length === 0 && !creating && (
            <p className="sidebar-hint" style={{ padding: "8px 14px" }}>
              Folder is empty
            </p>
          )}
        </div>
      )}
    </aside>
  );
}
