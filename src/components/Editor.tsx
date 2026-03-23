import { useRef, useEffect } from 'react';
import MonacoEditor, { type BeforeMount } from '@monaco-editor/react';
import { useEditorState, useEditorDispatch } from '../stores/editorStore';
import {
  writeFile,
  getRootHandle,
  writeSingleFile,
  readFile,
  checkFileModified,
  getFileLastModified,
  getSingleFileLastModified,
} from '../services/fs';
import '../styles/editor.css';

const handleBeforeMount: BeforeMount = (monaco) => {
  const apostrophe = String.fromCharCode(39);

  // TypeScript: enable JSX/TSX, disable semantic errors (no node_modules in browser)
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.Latest,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
    allowNonTsExtensions: true,
    allowJs: true,
    esModuleInterop: true,
    noEmit: true,
    strict: true,
  });
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,
  });

  // JavaScript: same JSX support
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.Latest,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
    allowNonTsExtensions: true,
    allowJs: true,
    esModuleInterop: true,
  });
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,
  });

  // Register Vue as a language (HTML-based highlighting)
  monaco.languages.register({ id: 'vue', extensions: ['.vue'] });
  monaco.languages.setLanguageConfiguration('vue', {
    brackets: [
      ['<', '>'],
      ['{', '}'],
      ['(', ')'],
      ['[', ']'],
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '<', close: '>' },
      { open: apostrophe, close: apostrophe },
      { open: '"', close: '"' },
      { open: '`', close: '`' },
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '<', close: '>' },
      { open: apostrophe, close: apostrophe },
      { open: '"', close: '"' },
      { open: '`', close: '`' },
    ],
    comments: {
      blockComment: ['<!--', '-->'],
    },
  });
  // Use HTML tokenizer for Vue SFCs (<template>, <script>, <style>)
  monaco.languages.setMonarchTokensProvider('vue', {
    defaultToken: '',
    tokenPostfix: '.vue',
    ignoreCase: true,
    tokenizer: {
      root: [
        [
          /(<)(script)(\s|>)/,
          [
            { token: 'delimiter.html' },
            { token: 'tag.html', next: '@scriptTag' },
            { token: '', next: '@scriptBody' },
          ],
        ],
        [
          /(<)(style)(\s|>)/,
          [
            { token: 'delimiter.html' },
            { token: 'tag.html', next: '@styleTag' },
            { token: '', next: '@styleBody' },
          ],
        ],
        [
          /(<)(template)(\s|>)/,
          [
            { token: 'delimiter.html' },
            { token: 'tag.html', next: '@templateTag' },
            { token: '' },
          ],
        ],
        [/<!--/, 'comment.html', '@comment'],
        [
          /(<)(\w+)/,
          [{ token: 'delimiter.html' }, { token: 'tag.html', next: '@tag' }],
        ],
        [
          /(<\/)(\w+)/,
          [{ token: 'delimiter.html' }, { token: 'tag.html', next: '@tag' }],
        ],
        [/[^<]+/, ''],
      ],
      comment: [
        [/-->/, 'comment.html', '@pop'],
        [/./, 'comment.html'],
      ],
      tag: [
        [/\/?>/, { token: 'delimiter.html', next: '@pop' }],
        [/"[^"]*"/, 'attribute.value.html'],
        [/'[^']*'/, 'attribute.value.html'],
        [/=/, 'delimiter.html'],
        [/[\w-]+/, 'attribute.name.html'],
      ],
      scriptTag: [
        [/>/, { token: 'delimiter.html', next: '@scriptBody' }],
        [/"[^"]*"/, 'attribute.value.html'],
        [/'[^']*'/, 'attribute.value.html'],
        [/=/, 'delimiter.html'],
        [/[\w-]+/, 'attribute.name.html'],
      ],
      scriptBody: [
        [
          /(<\/)(script)(>)/,
          [
            { token: 'delimiter.html' },
            { token: 'tag.html' },
            { token: 'delimiter.html', next: '@pop' },
          ],
        ],
        [/.+?(?=<\/script)/, { token: 'source.ts' }],
        [/./, { token: 'source.ts' }],
      ],
      styleTag: [
        [/>/, { token: 'delimiter.html', next: '@styleBody' }],
        [/"[^"]*"/, 'attribute.value.html'],
        [/'[^']*'/, 'attribute.value.html'],
        [/=/, 'delimiter.html'],
        [/[\w-]+/, 'attribute.name.html'],
      ],
      styleBody: [
        [
          /(<\/)(style)(>)/,
          [
            { token: 'delimiter.html' },
            { token: 'tag.html' },
            { token: 'delimiter.html', next: '@pop' },
          ],
        ],
        [/.+?(?=<\/style)/, { token: 'source.css' }],
        [/./, { token: 'source.css' }],
      ],
      templateTag: [
        [/>/, { token: 'delimiter.html', next: '@pop' }],
        [/"[^"]*"/, 'attribute.value.html'],
        [/'[^']*'/, 'attribute.value.html'],
        [/=/, 'delimiter.html'],
        [/[\w-]+/, 'attribute.name.html'],
      ],
    },
  } as any);
};

export default function Editor() {
  const { files, activeFileId, theme } = useEditorState();
  const dispatch = useEditorDispatch();
  const saveTimers = useRef(new Map<string, number>());

  const activeFile = files.find((f) => f.id === activeFileId);

  // 检测文件外部修改
  useEffect(() => {
    const checkExternalChanges = async () => {
      if (!activeFile || !activeFile.path || !activeFile.lastModified) return;

      try {
        const isModified = await checkFileModified(
          activeFile.path,
          activeFile.lastModified
        );

        if (isModified) {
          const shouldReload = confirm(
            `文件 "${activeFile.name}" 已被外部修改。是否重新加载？\n\n点击"确定"重新加载文件，点击"取消"保留当前编辑内容。`
          );

          if (shouldReload) {
            const { content, lastModified } = await readFile(activeFile.path);
            dispatch({
              type: 'RELOAD_FILE',
              payload: {
                id: activeFile.id,
                content,
                lastModified,
              },
            });
            dispatch({
              type: 'SHOW_TOAST',
              payload: {
                message: '文件已重新加载',
                type: 'success',
              },
            });
          }
        }
      } catch (err) {
        console.error('Failed to check file modification:', err);
      }
    };

    const handleFocus = () => {
      checkExternalChanges();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [activeFile, dispatch]);

  if (!activeFile)
    return <div className="editor-placeholder">No file open</div>;

  const handleChange = (value: string | undefined) => {
    const content = value ?? '';
    const filePath = activeFile.path;

    dispatch({
      type: 'UPDATE_FILE_CONTENT',
      payload: { id: activeFile.id, content },
    });

    // Auto-save to disk with debounce
    const isSingleFile = activeFile.id.startsWith('__single__');
    if (isSingleFile || (getRootHandle() && filePath)) {
      const prev = saveTimers.current.get(activeFile.id);
      if (prev) clearTimeout(prev);
      saveTimers.current.set(
        activeFile.id,
        window.setTimeout(async () => {
          try {
            if (isSingleFile) {
              await writeSingleFile(activeFile.name, content);
            } else {
              await writeFile(filePath, content);
            }

            let lastModified: number | undefined;
            try {
              lastModified = isSingleFile
                ? await getSingleFileLastModified(activeFile.name)
                : await getFileLastModified(filePath);
            } catch (metadataError) {
              console.error(
                'Failed to read saved file metadata:',
                metadataError
              );
            }

            dispatch({
              type: 'MARK_FILE_SAVED',
              payload: {
                id: activeFile.id,
                content,
                lastModified,
              },
            });
            dispatch({
              type: 'SHOW_TOAST',
              payload: {
                message: '文件已自动保存',
                type: 'success',
              },
            });
          } catch (err) {
            console.error('Auto-save failed:', err);
            dispatch({
              type: 'SHOW_TOAST',
              payload: {
                message: `自动保存失败: ${err instanceof Error ? err.message : '未知错误'}`,
                type: 'error',
              },
            });
          }
          saveTimers.current.delete(activeFile.id);
        }, 500)
      );
    }
  };

  return (
    <div className="editor-container">
      <MonacoEditor
        key={activeFile.id}
        height="100%"
        path={activeFile.path || activeFile.name}
        language={activeFile.language}
        theme={theme}
        value={activeFile.content}
        onChange={handleChange}
        beforeMount={handleBeforeMount}
        options={{
          fontSize: 14,
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
          wordWrap: 'on',
        }}
      />
    </div>
  );
}
