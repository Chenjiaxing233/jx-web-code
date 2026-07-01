/**
 * 通用线性图标集合，统一使用 currentColor，便于跟随主题与 hover 变色。
 */
type IconProps = { size?: number; className?: string };

const baseProps = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

/** 新建文件图标（文件轮廓 + 加号） */
export const NewFileIcon = ({ size = 16, className }: IconProps) => (
  <svg {...baseProps(size)} className={className}>
    <path d="M3.5 2h4.8L11.5 5.2V14h-8z" />
    <path d="M8.2 2v3.3h3.3" />
    <path d="M6 9.5h3.4M7.7 7.8v3.4" />
  </svg>
);

/** 新建文件夹图标（文件夹 + 加号） */
export const NewFolderIcon = ({ size = 16, className }: IconProps) => (
  <svg {...baseProps(size)} className={className}>
    <path d="M2 4h3.6l1.2 1.4H14V13H2z" />
    <path d="M6.3 9.4h3.4M8 7.7v3.4" />
  </svg>
);

/** 删除图标（垃圾桶） */
export const TrashIcon = ({ size = 16, className }: IconProps) => (
  <svg {...baseProps(size)} className={className}>
    <path d="M2.8 4.3h10.4" />
    <path d="M5.5 4.3V2.8h5v1.5" />
    <path d="M4.4 4.3l.7 9.2h5.8l.7-9.2" />
    <path d="M6.7 6.6v5M9.3 6.6v5" />
  </svg>
);

/** 关闭图标（x） */
export const CloseIcon = ({ size = 16, className }: IconProps) => (
  <svg {...baseProps(size)} className={className}>
    <path d="M4 4l8 8M12 4l-8 8" />
  </svg>
);

/** 刷新图标（双半弧箭头） */
export const RefreshIcon = ({ size = 16, className }: IconProps) => (
  <svg {...baseProps(size)} className={className}>
    <path d="M3.6 8a4.4 4.4 0 0 1 7.6-3" />
    <path d="M11.6 2.6v2.8H8.8" />
    <path d="M12.4 8a4.4 4.4 0 0 1-7.6 3" />
    <path d="M4.4 13.4v-2.8h2.8" />
  </svg>
);

/** 右向箭头（chevron），用于文件夹展开指示（展开时旋转 90°） */
export const ChevronRightIcon = ({ size = 16, className }: IconProps) => (
  <svg {...baseProps(size)} className={className}>
    <path d="M6 3.5L10.5 8 6 12.5" />
  </svg>
);
