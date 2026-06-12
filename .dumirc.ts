import { defineConfig } from 'dumi';
import fs from 'fs';
import path from 'path';

interface LocalConfig {
  apiParser?: boolean;
}

const localConfigPath = path.join(__dirname, '.dumirc.local.json');
const localConfig: LocalConfig = fs.existsSync(localConfigPath)
  ? JSON.parse(fs.readFileSync(localConfigPath, 'utf-8'))
  : {};

const enableApiParser = localConfig.apiParser ?? true;

export default defineConfig({
  outputPath: 'docs-dist',
  base: '/rc-grid-table/',
  publicPath: '/rc-grid-table/',
  themeConfig: {
    name: 'rc-grid-table',
    logo: false,
    prefersColor: {
      default: 'auto',
    },
    socialLinks: {
      github: 'https://github.com/helloworldzjx/rc-grid-table',
    },
  },
  ...(enableApiParser ? { apiParser: {} } : {}),
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
