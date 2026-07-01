import { createHighlighter, type Highlighter } from 'shiki';
import type { Theme } from '../types';

/** 预加载的语言（覆盖项目 getLanguageFromFileName 的常见类型） */
const LANGS = [
  'typescript',
  'javascript',
  'tsx',
  'jsx',
  'vue',
  'json',
  'html',
  'css',
  'scss',
  'less',
  'markdown',
  'python',
  'go',
  'java',
  'yaml',
  'xml',
  'sql',
  'shellscript',
  'rust',
  'c',
  'cpp',
];

/** Monaco 主题名（vs/vs-dark） -> Shiki 主题名（VS Code 同款） */
export const SHIKI_THEMES: Record<Theme, string> = {
  'vs-dark': 'dark-plus',
  vs: 'light-plus',
};

let highlighterPromise: Promise<Highlighter> | null = null;

/** 惰性创建并复用单例 Shiki highlighter */
export const getHighlighter = (): Promise<Highlighter> => {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['dark-plus', 'light-plus'],
      langs: LANGS,
    });
  }
  return highlighterPromise;
};
