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
const siteUrl = 'https://helloworldzjx.github.io/rc-grid-table';
const siteDescription =
  'rc-grid-table is a React grid table and data table component with fixed columns, virtual list, drag sorting, resizable columns, tree data and editable cells.';
const siteKeywords = [
  'rc-grid-table',
  'React Table',
  'React Data Grid',
  'Grid Table',
  'data table',
  'fixed columns',
  'virtual table',
  'resizable columns',
  'drag sort table',
  'editable table',
  'tree table',
];

export default defineConfig({
  outputPath: 'docs-dist',
  base: '/rc-grid-table/',
  publicPath: '/rc-grid-table/',
  plugins: [path.join(__dirname, 'scripts/dumi-seo-plugin.js')],
  title: 'rc-grid-table - React Grid Table Component',
  metas: [
    { name: 'description', content: siteDescription },
    { name: 'keywords', content: siteKeywords.join(', ') },
    { name: 'author', content: 'helloworldzjx' },
    { name: 'robots', content: 'index,follow' },
    { name: 'theme-color', content: '#1677ff' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'rc-grid-table' },
    { property: 'og:description', content: siteDescription },
    { property: 'og:url', content: `${siteUrl}/` },
    { property: 'og:site_name', content: 'rc-grid-table' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: 'rc-grid-table' },
    { name: 'twitter:description', content: siteDescription },
  ],
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
