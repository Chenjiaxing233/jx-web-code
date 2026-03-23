import { test, expect } from '@playwright/test';

/**
 * 自动化文件操作测试
 * 使用 Mock File System Access API
 */

test.describe('文件操作自动化测试', () => {
  test.beforeEach(async ({ page }) => {
    // 注入 Mock File System API
    await page.addInitScript(() => {
      // 创建一个简单的内存文件系统
      const mockFileSystem = new Map();
      mockFileSystem.set('test.txt', {
        name: 'test.txt',
        content: 'Hello, World!',
        lastModified: Date.now(),
      });
      mockFileSystem.set('App.tsx', {
        name: 'App.tsx',
        content: 'export default function App() {}',
        lastModified: Date.now(),
      });

      // Mock showDirectoryPicker
      (window as any).showDirectoryPicker = async () => {
        return {
          kind: 'directory',
          name: 'test-folder',
          async *entries() {
            for (const [name, data] of mockFileSystem.entries()) {
              yield [
                name,
                {
                  kind: 'file',
                  name: data.name,
                  async getFile() {
                    return new File([data.content], data.name, {
                      lastModified: data.lastModified,
                    });
                  },
                  async createWritable() {
                    return {
                      async write(content: string) {
                        data.content = content;
                        data.lastModified = Date.now();
                      },
                      async close() {},
                    };
                  },
                },
              ];
            }
          },
          async getFileHandle(name: string, options?: any) {
            let data = mockFileSystem.get(name);
            if (!data && options?.create) {
              data = {
                name,
                content: '',
                lastModified: Date.now(),
              };
              mockFileSystem.set(name, data);
            }
            if (!data) throw new Error('File not found');

            return {
              kind: 'file',
              name: data.name,
              async getFile() {
                return new File([data.content], data.name, {
                  lastModified: data.lastModified,
                });
              },
              async createWritable() {
                return {
                  async write(content: string) {
                    data.content = content;
                    data.lastModified = Date.now();
                  },
                  async close() {},
                };
              },
            };
          },
          async getDirectoryHandle(name: string, options?: any) {
            return this;
          },
          async removeEntry(name: string) {
            mockFileSystem.delete(name);
          },
        };
      };

      // Mock showOpenFilePicker
      (window as any).showOpenFilePicker = async () => {
        const data = {
          name: 'single-file.txt',
          content: 'Single file content',
          lastModified: Date.now(),
        };

        return [
          {
            kind: 'file',
            name: data.name,
            async getFile() {
              return new File([data.content], data.name, {
                lastModified: data.lastModified,
              });
            },
            async createWritable() {
              return {
                async write(content: string) {
                  data.content = content;
                  data.lastModified = Date.now();
                },
                async close() {},
              };
            },
          },
        ];
      };
    });

    await page.goto('/');
  });

  test('应该能够打开文件夹并显示文件树', async ({ page }) => {
    // 点击 Open Folder 按钮
    await page.click('button:has-text("Open Folder")');

    // 等待文件树加载
    await page.waitForSelector('.file-tree', { timeout: 5000 });

    // 检查文件树是否显示
    await expect(page.locator('.file-tree')).toBeVisible();

    // 检查文件是否显示
    await expect(page.locator('.tree-file')).toHaveCount(2);
  });

  test('应该能够打开文件并在编辑器中显示', async ({ page }) => {
    // 打开文件夹
    await page.click('button:has-text("Open Folder")');
    await page.waitForSelector('.file-tree', { timeout: 5000 });

    // 点击第一个文件
    await page.click('.tree-file:first-child');

    // 等待编辑器加载
    await page.waitForSelector('.monaco-editor', { timeout: 10000 });

    // 检查编辑器是否显示
    await expect(page.locator('.monaco-editor')).toBeVisible();

    // 检查标签页是否显示
    await expect(page.locator('.tab')).toHaveCount(1);
  });

  test('应该能够创建新文件', async ({ page }) => {
    // 打开文件夹
    await page.click('button:has-text("Open Folder")');
    await page.waitForSelector('.file-tree', { timeout: 5000 });

    // 点击新建文件按钮
    await page.click('.sidebar-action-btn[title="New File"]');

    // 等待输入框出现
    await page.waitForSelector('.tree-inline-input', { timeout: 2000 });

    // 输入文件名
    await page.fill('.tree-inline-input', 'newfile.txt');
    await page.keyboard.press('Enter');

    // 等待 Toast 提示
    await page.waitForSelector('.toast', { timeout: 3000 });

    // 检查成功提示
    await expect(page.locator('.toast')).toContainText('创建成功');
  });

  test('应该能够删除文件', async ({ page }) => {
    // 打开文件夹
    await page.click('button:has-text("Open Folder")');
    await page.waitForSelector('.file-tree', { timeout: 5000 });

    // 悬停在第一个文件上
    await page.hover('.tree-file:first-child');

    // 等待删除按钮出现
    await page.waitForSelector('.tree-delete-btn', { timeout: 2000 });

    // 设置对话框处理
    page.once('dialog', (dialog) => {
      expect(dialog.message()).toContain('确定要删除');
      dialog.accept();
    });

    // 点击删除按钮
    await page.click('.tree-delete-btn:first-child');

    // 等待 Toast 提示
    await page.waitForSelector('.toast', { timeout: 3000 });

    // 检查成功提示
    await expect(page.locator('.toast')).toContainText('删除成功');
  });

  test('应该能够打开单个文件', async ({ page }) => {
    // 点击 Open File 按钮
    await page.click('button:has-text("Open File")');

    // 等待文件加载
    await page.waitForSelector('.tab', { timeout: 5000 });

    // 检查标签页是否显示
    await expect(page.locator('.tab')).toHaveCount(1);
    await expect(page.locator('.tab')).toContainText('single-file.txt');

    // 检查编辑器是否显示
    await expect(page.locator('.monaco-editor')).toBeVisible();
  });

  test('应该能够切换文件标签页', async ({ page }) => {
    // 打开文件夹
    await page.click('button:has-text("Open Folder")');
    await page.waitForSelector('.file-tree', { timeout: 5000 });

    // 打开第一个文件
    await page.click('.tree-file:first-child');
    await page.waitForSelector('.tab', { timeout: 3000 });

    // 打开第二个文件
    await page.click('.tree-file:nth-child(2)');
    await page.waitForTimeout(500);

    // 检查是否有两个标签页
    await expect(page.locator('.tab')).toHaveCount(2);

    // 点击第一个标签页
    await page.click('.tab:first-child');

    // 检查第一个标签页是否激活
    await expect(page.locator('.tab:first-child')).toHaveClass(/tab-active/);
  });

  test('应该能够关闭标签页', async ({ page }) => {
    // 打开文件夹
    await page.click('button:has-text("Open Folder")');
    await page.waitForSelector('.file-tree', { timeout: 5000 });

    // 打开一个文件
    await page.click('.tree-file:first-child');
    await page.waitForSelector('.tab', { timeout: 3000 });

    // 悬停在标签页上
    await page.hover('.tab:first-child');

    // 等待关闭按钮出现
    await page.waitForSelector('.tab-close', { timeout: 2000 });

    // 点击关闭按钮
    await page.click('.tab-close:first-child');

    // 检查标签页是否关闭
    await expect(page.locator('.tab')).toHaveCount(0);

    // 检查是否显示占位符
    await expect(page.locator('.editor-placeholder')).toBeVisible();
  });
});
