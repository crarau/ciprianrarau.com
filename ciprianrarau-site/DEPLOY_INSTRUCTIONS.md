# Deployment Instructions

## Vercel Deployment

We use a custom deployment script to manage Vercel deployments securely.

### Setup

The `vercel-deploy.sh` script is already configured with your Vercel token. This file is gitignored and should **never** be committed to version control.

### Usage

```bash
# Pull latest project settings from Vercel
./vercel-deploy.sh pull

# Deploy to production
./vercel-deploy.sh deploy

# Start development server
./vercel-deploy.sh dev

# Build project locally
./vercel-deploy.sh build

# Link to Vercel project
./vercel-deploy.sh link

# Manage environment variables
./vercel-deploy.sh env [command]
```

### Security Notes

- The `vercel-deploy.sh` file contains sensitive authentication tokens
- It's automatically excluded from git via `.gitignore`
- Never share or commit this file
- If you need to update the token, edit the `VERCEL_TOKEN` variable in the script

### Mermaid Diagrams

Before deploying, if you've added or modified any Mermaid diagrams in your blog posts:

```bash
npm run process-mermaid
```

This will generate static PNG images with your branded footer for all Mermaid diagrams.