# GitHub Pages 与 Supabase 部署说明

## 1. 发布 GitHub Pages

1. 新建一个公开 GitHub 仓库，把本目录内容放在仓库根目录。
2. 提交并推送 `main` 分支。
3. 打开仓库 `Settings → Pages`。
4. `Build and deployment` 选择 `Deploy from a branch`。
5. 分支选择 `main`，目录选择 `/ (root)`，保存。
6. 等待约 1 分钟，访问 `https://你的用户名.github.io/仓库名/`。

项目没有构建步骤，不需要 Node.js 或 npm。`.nojekyll` 已经用于禁止 Jekyll 处理静态文件。

## 2. 启用 Supabase 在线排行

1. 创建免费 Supabase 项目。
2. 在 SQL Editor 中执行 `supabase/schema.sql`。
3. 部署 `supabase/functions/claim-profile.ts`、`change-profile.ts`、`submit-score.ts`、`delete-profile.ts` 四个 Edge Function。
4. 为这些 Function 配置环境变量：
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. 复制 Supabase 项目 URL 和公开 `anon key`，填写到 `leaderboard-config.js`：
   - `enabled: true`
   - `supabaseUrl`
   - `supabaseAnonKey`
6. 在 Supabase 的 Auth/API 设置中添加 GitHub Pages 域名到允许来源。
7. 不要在前端填写 `service_role key`。

## 3. 存档迁移

公开网站首次启动时会创建舰长档案。当前本地 `file://` 版本的进度可以通过“舰长档案 → 导出存档”导出 JSON，然后在新网站中通过“导入存档”恢复。

导入会覆盖网站当前存档，但不会自动上传完整本地存档到排行榜；排行榜只接收进度摘要快照。

## 4. 自定义域名

如果使用自定义域名，相对资源路径不需要修改；只需把新域名加入 Supabase 的允许来源。