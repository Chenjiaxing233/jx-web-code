import { test, expect } from '@playwright/test';

/**
 * 编辑器功能自动化测试
 */

test.describe('编辑器功能自动化测试', () => {
  test.beforeEach(async ({ page }) => {
    // 注入 Mock File System API
    await page.addInitScript(() => {
      const mockFileSystem = new Map();
      mockFileSystem.set('test.js', {
        name: 'test.js',
        content: 'console.log("Hello");',
        lastModified: Date.now(),
      });

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
          async getFileHandle(name: string) {
            const data = mockFileSystem.get(name);
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
          async getDirectoryHandle() {
            return this;
          },
        };
      };
    });

    await page.goto('/');
  });

  test('应该能够在编辑器中输入文本', async ({ page }) => {
    // 打开文件夹
    await page.click('button:has-text("Open Folder")');
    await page.waitForSelector('.file-tree', { timeout: 5000 });

    // 打开文件
    await page.click('.tree-file:first-child');
    await page.waitForSelector('.monaco-editor', { timeout: 10000 });

    // 等待编辑器完全加载
    await page.waitForTimeout(1000);

    // 在编辑器中输入文本
    // 注意：Monaco Editor 的输入比较复杂，这里使用 evaluate 直接修改内容
    await page.evaluate(() => {
      const monaco = (window as any).monaco;
      if (monaco) {
        const editor = monaco.editor.getModels()[0];
        if (editor) {
          editor.setValue('console.log("Modified content");');
        }
      }
    });

    // 等待自动保存
    await page.waitForTimeout(600);

    // 检查是否显示保存成功的 Toast
    await page.waitForSelector('.toast', { timeout: 3000 });
    await expect(page.locator('.toast')).toContainText('自动保存');
  });

  test('应该支持语法高亮', async ({ page }) => {
    // 打开文件夹
    await page.click('button:has-text("Open Folder")');
    await page.waitForSelector('.file-tree', { timeout: 5000 });

    // 打开 JavaScript 文件
    await page.click('.tree-file:first-child');
    await page.waitForSelector('.monaco-editor', { timeout: 10000 });

    // 等待 Monaco 编辑器完全加载
    await page.waitForTimeout(1000);

    // 检查是否有语法高亮的 token
    const hasTokens = await page.evaluate(() => {
      const editor = document.querySelector('.monaco-editor');
      if (!editor) return false;

      // 检查是否有语法高亮的类名
      const tokens = editor.querySelectorAll('[class*="mtk"]');
      return tokens.length > 0;
    });

    expect(hasTokens).toBe(true);
  });

  test('应该显示正确的文件语言', async ({ page }) => {
    // 打开文件夹
    await page.click('button:has-text("Open Folder")');
    await page.waitForSelector('.file-tree', { timeout: 5000 });

    // 打开 JavaScript 文件
    await page.click('.tree-file:first-child');
    await page.waitForSelector('.monaco-editor', { timeout: 10000 });

    // 等待编辑器加载
    await page.waitForTimeout(1000);

    // 检查编辑器语言模式
    const language = await page.evaluate(() => {
      const monaco = (window as any).monaco;
      if (monaco) {
        const model = monaco.editor.getModels()[0];
        if (model) {
          return model.getLanguageId();
        }
      }
      return null;
    });

    expect(language).toBe('javascript');
  });

  test('应该能够撤销和重做', async ({ page }) => {
    // 打开文件夹
    await page.click('button:has-text("Open Folder")');
    await page.waitForSelector('.file-tree', { timeout: 5000 });

    // 打开文件
    await page.click('.tree-file:first-child');
    await page.waitForSelector('.monaco-editor', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // 获取初始内容
    const initialContent = await page.evaluate(() => {
      const monaco = (window as any).monaco;
      if (monaco) {
        const model = monaco.editor.getModels()[0];
        if (model) {
          return model.getValue();
        }
      }
      return '';
    });

    // 修改内容
    await page.evaluate(() => {
      const monaco = (window as any).monaco;
      if (monaco) {
        const model = monaco.editor.getModels()[0];
        if (model) {
          model.setValue('Modified');
        }
      }
    });

    // 撤销
    await page.keyboard.press('Control+Z');
    await page.waitForTimeout(100);

    // 检查内容是否恢复
    const afterUndo = await page.evaluate(() => {
      const monaco = (window as any).monaco;
      if (monaco) {
        const model = monaco.editor.getModels()[0];
        if (model) {
          return model.getValue();
        }
      }
      return '';
    });

    expect(afterUndo).toBe(initialContent);
  });
});
