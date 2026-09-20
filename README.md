# 潮汐渔场

## 直接运行

双击 `index.html` 可继续使用本地离线模式。

## GitHub Pages 发布

1. 把当前目录中的全部文件上传到一个公开 GitHub 仓库的根目录。
2. 在仓库 `Settings → Pages` 选择 `main` 分支的 `/ (root)` 目录。
3. 访问 `https://用户名.github.io/仓库名/`。

## 在线排行

将 Supabase URL 和公开 anon key 填入 `leaderboard-config.js`，并按照 `SUPABASE_SETUP.md` 执行数据库脚本和 Edge Function 部署步骤。

未配置 Supabase 时，游戏仍可完整离线运行，排行榜显示本地缓存和离线档案。