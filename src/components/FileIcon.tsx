import cssIcon from '../assets/fileicons/css.svg';
import htmlIcon from '../assets/fileicons/html.svg';
import jsIcon from '../assets/fileicons/js.svg';
import jsonIcon from '../assets/fileicons/json.svg';
import newFileIcon from '../assets/fileicons/newFile.svg';
import newFolderIcon from '../assets/fileicons/newFolder.svg';
import reactIcon from '../assets/fileicons/react.svg';
import svgIcon from '../assets/fileicons/svg.svg';
import tsIcon from '../assets/fileicons/ts.svg';
import txtIcon from '../assets/fileicons/txt.svg';
import unknownIcon from '../assets/fileicons/unknown.svg';
import vueIcon from '../assets/fileicons/vue.svg';

const fileIconMap: Record<string, string> = {
  css: cssIcon,
  htm: htmlIcon,
  html: htmlIcon,
  js: jsIcon,
  json: jsonIcon,
  jsx: reactIcon,
  md: txtIcon,
  svg: svgIcon,
  ts: tsIcon,
  tsx: reactIcon,
  txt: txtIcon,
  vue: vueIcon,
};

/**
 * 根据文件名选择 fileicons 目录中的 SVG 图标。
 */
function getFileIconSource(name: string): string {
  const extension = name.split('.').pop()?.toLowerCase();

  if (!extension) {
    return newFileIcon;
  }

  return fileIconMap[extension] ?? unknownIcon;
}

export function FileIcon({
  name,
  type,
  className,
}: {
  name?: string;
  type: 'file' | 'directory';
  isOpen?: boolean;
  className?: string;
}) {
  const src =
    type === 'directory' ? newFolderIcon : getFileIconSource(name ?? '');

  return (
    <span
      className={`${className ?? ''} file-icon-frame file-icon-frame--${type}`}
      aria-hidden="true"
    >
      <img className="file-icon-image" src={src} alt="" />
    </span>
  );
}
