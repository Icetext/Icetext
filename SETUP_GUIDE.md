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
5. Set **Value** to a classic GitHub Personal Access Token generated with `repo` and `read:user` scopes.
   Fine-grained tokens are rejected because the generator cannot verify that every private repository was selected.
6. If you contribute to private organization repositories that enforce SAML SSO, authorize the token for each organization.
7. Click **Add secret**.

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

The generator intentionally exits with an error when the token is missing, belongs to a different user,
lacks the required classic PAT scopes, or leaves restricted contributions inaccessible. Mock data can only
be enabled explicitly from code for development and tests.

`commitAuthorAliases` in `config.json` lists historical Git author names or email addresses that belong to
you. The generator scans the default branch of every accessible owned, collaborator, and organization
repository—public or private—and uses these aliases to include commits that GitHub cannot link to your
account because of an old or unverified email. Forks and commits that exist only on non-default branches
are intentionally excluded to stay aligned with GitHub's contribution rules.
