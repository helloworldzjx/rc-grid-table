import { defineConfig } from 'dumi';
import path from 'path';

export default defineConfig({
  outputPath: 'docs-dist',
  base: '/rc-grid-table/',
  publicPath: '/rc-grid-table/',
  themeConfig: {
    name: 'rc-grid-table',
    logo: false,
    socialLinks: {
      github: 'https://github.com/helloworldzjx/rc-grid-table',
    },
  },
  apiParser: {},
  resolve: {
    // 配置入口文件路径，API 解析将从这里开始
    entryFile: './src/index.ts',
  },
  alias: {
    'rc-grid-table/lib': path.join(__dirname, 'src'),
    'rc-grid-table/es': path.join(__dirname, 'src'),
    'rc-grid-table': path.join(__dirname, 'src'),
  },
});
