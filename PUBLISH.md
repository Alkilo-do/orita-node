# Publishing to npm

The SDK is ready to publish. Steps when you have an npm token:

## 1. Set up auth
```bash
# Option A: Login interactively
npm login

# Option B: Set token directly
echo "//registry.npmjs.org/:_authToken=<YOUR_NPM_TOKEN>" > ~/.npmrc
```

## 2. Publish
```bash
cd /Users/guillermobueno/.openclaw/workspace/orita-node
npm publish --access public
```

## 3. Verify
```bash
npm view orita-sdk
# https://www.npmjs.com/package/orita-sdk
```

## Notes
- The build (`npm run build`) runs automatically via `prepublishOnly`
- Package name: `orita-sdk` — confirmed available at time of creation (2026-07-26)
- `npm whoami` to verify you're logged in as the right account
