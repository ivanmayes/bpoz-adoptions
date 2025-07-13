# Vercel Deployment Guide

This guide explains how to deploy the Big Paws Adoptable Dogs application to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup) (free)
2. [Vercel CLI](https://vercel.com/cli) installed (optional but recommended)
   ```bash
   npm i -g vercel
   ```

## Method 1: Deploy via Vercel Dashboard (Recommended)

### 1. Import Your Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Connect your GitHub account if not already connected
4. Select your `bpoz-ai-chat` repository
5. Click "Import"

### 2. Configure Project

1. **Framework Preset**: Select "Other"
2. **Root Directory**: Leave as `./` (default)
3. **Build & Output Settings**: Leave defaults (already configured in vercel.json)

### 3. Add Environment Variables

Click "Environment Variables" and add the following:

| Name | Value | Description |
|------|-------|-------------|
| `ASM_USERNAME` | Your ASM username | Required for API access |
| `ASM_PASSWORD` | Your ASM password | Required for API access |
| `ASM_ACCOUNT` | `km2607` | Your ASM account ID |
| `OPENAI_API_KEY` | Your OpenAI API key | Required for chat feature |

### 4. Deploy

Click "Deploy" and wait for the deployment to complete (usually 1-2 minutes).

## Method 2: Deploy via CLI

### 1. Login to Vercel

```bash
vercel login
```

### 2. Deploy

From your project root directory:

```bash
vercel
```

Follow the prompts:
- Set up and deploy: `Y`
- Which scope: Select your account
- Link to existing project: `N` (first time) or `Y` (subsequent deploys)
- Project name: `bpoz-ai-chat` (or your preferred name)
- Directory: `./` (press Enter)
- Override settings: `N`

### 3. Set Environment Variables

```bash
vercel env add ASM_USERNAME
vercel env add ASM_PASSWORD
vercel env add ASM_ACCOUNT
vercel env add OPENAI_API_KEY
```

Enter the values when prompted.

### 4. Deploy to Production

```bash
vercel --prod
```

## Your Deployed URLs

After deployment, you'll get URLs like:
- Preview: `https://bpoz-ai-chat-[hash].vercel.app`
- Production: `https://bpoz-ai-chat.vercel.app` (or your custom domain)

## Automatic Deployments

Vercel automatically deploys:
- **Production**: When you push to `main` branch
- **Preview**: When you create pull requests

## Custom Domain (Optional)

1. Go to your project settings on Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Troubleshooting

### Environment Variables Not Working

1. Go to Project Settings → Environment Variables
2. Ensure all variables are added
3. Redeploy by clicking "Redeploy" → "Redeploy with existing Build Cache"

### 404 Errors on Routes

The `vercel.json` file handles routing. If you get 404s:
1. Check that `vercel.json` exists in your root directory
2. Ensure the routes configuration matches your app structure

### API Calls Failing

1. Check browser console for CORS errors
2. Verify environment variables are set correctly
3. Check Vercel function logs: Project → Functions tab

### Build Failing

Check the build logs in Vercel dashboard for specific errors. Common issues:
- Missing dependencies: Ensure all required packages are in `dependencies` (not `devDependencies`)
- Node version: Vercel uses Node 18.x by default, which matches your configuration

## Local Development with Vercel

To test Vercel environment locally:

```bash
vercel dev
```

This runs your app with Vercel's local development server.

## Monitoring

- **Function Logs**: Project → Functions → View logs
- **Analytics**: Project → Analytics (requires Pro plan)
- **Speed Insights**: Automatically enabled for performance monitoring

## Updating Your Deployment

### Via Git

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Vercel automatically deploys the changes.

### Via CLI

```bash
vercel --prod
```

## Environment-Specific Configurations

You can set different environment variables for:
- **Production**: Applied to main branch deployments
- **Preview**: Applied to pull request deployments
- **Development**: Used with `vercel dev`

Set these in Project Settings → Environment Variables and select the appropriate environments.

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support)
- [Community Forum](https://github.com/vercel/next.js/discussions)