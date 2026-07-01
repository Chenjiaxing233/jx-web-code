/**
 * UI 操作图标：使用 VS Code 官方 Codicon 字体图标（@vscode/codicons）。
 * 颜色随 currentColor 继承，尺寸由 size（font-size）控制。
 */
type IconProps = { size?: number; className?: string };

const Codicon = ({
  name,
  size = 16,
  className,
}: { name: string } & IconProps) => (
  <i
    className={`codicon codicon-${name}${className ? ` ${className}` : ''}`}
    style={{ fontSize: size }}
    aria-hidden="true"
  />
);

/** 新建文件 */
export const NewFileIcon = (props: IconProps) => (
  <Codicon name="new-file" {...props} />
);

/** 新建文件夹 */
export const NewFolderIcon = (props: IconProps) => (
  <Codicon name="new-folder" {...props} />
);

/** 删除（垃圾桶） */
export const TrashIcon = (props: IconProps) => (
  <Codicon name="trash" {...props} />
);

/** 关闭 */
export const CloseIcon = (props: IconProps) => (
  <Codicon name="close" {...props} />
);

/** 刷新 */
export const RefreshIcon = (props: IconProps) => (
  <Codicon name="refresh" {...props} />
);

/** 右向箭头（折叠指示，展开时旋转 90°） */
export const ChevronRightIcon = (props: IconProps) => (
  <Codicon name="chevron-right" {...props} />
);

/** GitHub */
export const GithubIcon = (props: IconProps) => (
  <Codicon name="github" {...props} />
);
