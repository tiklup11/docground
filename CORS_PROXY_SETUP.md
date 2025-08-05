# CORS Proxy Setup for GitHub OAuth

Due to CORS limitations, GitHub's OAuth token endpoint cannot be accessed directly from the browser. 

## Quick Setup (Development Only)

1. Visit: https://cors-anywhere.herokuapp.com/corsdemo
2. Click "Request temporary access to the demo server"
3. Return to your app and try GitHub authentication

## Alternative Solutions

For production, you'll need either:
- A backend proxy endpoint
- Netlify/Vercel functions
- A dedicated CORS proxy service

This is a temporary development solution only.