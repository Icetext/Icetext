# GitHub Profile Stats Generator - Setup Guide

An automated tool designed to generate customizable SVG cards for GitHub profile statistics targeting user account **Icetext**.

## 🚀 Features

- **GitHub GraphQL API Integration**: Fetches statistics using `@octokit/graphql`.
- **Private Repository Support**: Captures commits across private and public repos via PAT authentication.
- **Customizable Themes**: Full control over SVG colors, borders, and dimensions.
- **Automated CI/CD Workflows**: Scheduled GitHub Actions workflow to auto-update SVG cards daily.

---

## 🔑 Authentication & Token Setup

### Repository Secret Setup (`METRICS_TOKEN`)

1. Open your repository [`Icetext/Icetext`](https://github.com/Icetext/Icetext) on GitHub.
2. Navigate to **Settings** > **Secrets and variables** > **Actions**.
3. Click **New repository secret**.
4. Set **Name** to: `METRICS_TOKEN`
5. Set **Value** to your GitHub Personal Access Token (PAT) generated with `repo` and `user` scopes.
6. Click **Add secret**.

### Local Development (`.env`)
1. Duplicate `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Add your PAT:
   ```env
   GITHUB_TOKEN=ghp_your_personal_access_token
   GITHUB_USERNAME=Icetext
   ```

---

## 🏃 Running Locally

```bash
npm install
npm start
```
