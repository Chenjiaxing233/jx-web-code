import { getIconForFilePath } from 'vscode-material-icons';

/**
 * 通过 Vite 的 import.meta.glob 把 Material 图标 SVG 作为资源 URL 全量引入，
 * 由 Vite 资源管线处理（dev 直出、build 带 hash），无需复制到 public。
 */
const modules = import.meta.glob(
  '/node_modules/vscode-material-icons/generated/icons/*.svg',
  { eager: true, query: '?url', import: 'default' }
) as Record<string, string>;

/** 图标名 -> 资源 URL */
const iconUrlByName: Record<string, string> = {};
for (const path in modules) {
  const name = path.split('/').pop()!.replace('.svg', '');
  iconUrlByName[name] = modules[path];
}

/** 取图标 URL，未命中回退到通用 file 图标 */
const resolveIconUrl = (iconName: string): string =>
  iconUrlByName[iconName] ?? iconUrlByName.file;

/**
 * 使用 VSCode Material Icon Theme 图标渲染文件/文件夹图标。
 * - 文件：根据文件名推断对应图标
 * - 文件夹：folder / folder-open
 */
export function FileIcon({
  name,
  type,
  isOpen,
  className,
}: {
  name?: string;
  type: 'file' | 'directory';
  isOpen?: boolean;
  className?: string;
}) {
  const iconName =
    type === 'directory'
      ? isOpen
        ? 'folder-open'
        : 'folder'
      : getIconForFilePath(name ?? '');

  return (
    <img
      className={`${className ?? ''} file-icon-image`}
      src={resolveIconUrl(iconName)}
      alt=""
      aria-hidden="true"
    />
  );
}
