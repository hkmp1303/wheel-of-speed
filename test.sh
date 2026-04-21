#!/usr/bin/env bash

# Server Xunit testing
dotnet test wheel-of-speed.sln

# Frontend Playwright testing
cd frontend
npx playwright install --with-deps chromium
npm run test:e2e

# API testing
#npm run test:api
npx newman run ../Testing/ApiTests/wheel-of-speed.postman_collection.json -e ../Testing/ApiTests/local.postman_environment.json -r progress,emojitrain --bail failure