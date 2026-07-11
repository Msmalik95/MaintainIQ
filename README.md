# MaintainIQ

This repository contains the MaintainIQ frontend and backend.

## Deploy frontend to GitHub Pages

1. Create a GitHub repository and push this project.
2. Enable GitHub Pages in the repository settings.
3. In the Actions tab, run the Deploy frontend to GitHub Pages workflow.

## Backend

The backend is currently configured for local development. To host it, deploy the contents of the maintainiq-backend folder to a platform such as Render, Railway, or Fly.io and set the frontend environment variable VITE_API_BASE_URL to the deployed backend URL.
