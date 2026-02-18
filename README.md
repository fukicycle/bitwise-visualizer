# BitWise Visualizer

ビット・バイト・エンディアンを可視化する、フロントエンドのみの静的 Web アプリです。

## Prerequisites

- Node.js 18 以上
- npm

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## GitHub Pages に公開する

Vite はデフォルトで `/` をベースパスに使うため、GitHub Pages ではリポジトリ名に合わせて `base` を設定してください。

例: リポジトリ名が `bitwise-visualizer` の場合、`frontend/vite.config.ts` に以下を追加:

```ts
export default defineConfig(() => ({
  base: '/bitwise-visualizer/',
  plugins: react(),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
}));
```

その後、`npm run build` で生成される `frontend/dist` を GitHub Pages の公開物として使ってください。
