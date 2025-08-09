# API Key Setup Guide

## How to Safely Store Your OpenAI API Key

### Step 1: Create Environment File
Create a file named `.env.local` in your project root directory (same level as `package.json`).

### Step 2: Add Your API Key
Add the following line to your `.env.local` file:

```
OPENAI_API_KEY=your_actual_openai_api_key_here
```

**Important:** Replace `your_actual_openai_api_key_here` with your real OpenAI API key.

### Step 3: Verify Security
- The `.env.local` file is already in your `.gitignore`, so it won't be committed to git
- This keeps your API key private and secure
- Never share this file or commit it to version control

### Step 4: Test Your Setup
After creating the file, restart your development server:
```bash
npm run dev
```

### For Production Deployment (Netlify)
If you're deploying to Netlify, you'll need to set the environment variable in your Netlify dashboard:

1. Go to your Netlify site dashboard
2. Navigate to Site settings > Environment variables
3. Add a new variable:
   - Key: `OPENAI_API_KEY`
   - Value: Your actual OpenAI API key

### Example .env.local file content:
```
OPENAI_API_KEY=sk-1234567890abcdef1234567890abcdef1234567890abcdef
```

**Security Notes:**
- ✅ `.env.local` is in `.gitignore` - safe from accidental commits
- ✅ Environment variables are secure for local development
- ✅ Netlify environment variables are encrypted and secure
- ❌ Never hardcode API keys in your source code
- ❌ Never commit API keys to git
