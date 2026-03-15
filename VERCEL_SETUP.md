# 配置 GitHub Secrets 以启用自动部署

## 步骤 1：获取 Vercel 项目信息

在你的 Vercel 项目页面：https://vercel.com/fionatt-creators-projects/dist

点击 **Settings** → **General**，找到：
- **Project ID** (例如: prj_xxxxxx)
- **Team ID** 或 **Personal Account ID** (例如: team_xxxxxx)

## 步骤 2：配置 GitHub Secrets

1. 打开仓库：https://github.com/Fionatt-creator/ai-video-editor
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**，添加以下 3 个：

| Name | Value |
|------|-------|
| `VERCEL_TOKEN` | `vcp_5oPC3YCWTC7tCTg71wvahXKIEPAJ1zUL0pNIk8lT3p1YQGnlfV2LA0CW` |
| `VERCEL_ORG_ID` | 你的 Team ID 或 Personal Account ID |
| `VERCEL_PROJECT_ID` | 你的 Project ID |

## 步骤 3：验证自动部署

配置完成后，每次推送到 `main` 分支都会自动部署到 Vercel。

可以在 GitHub 仓库的 **Actions** 标签页查看部署状态。
