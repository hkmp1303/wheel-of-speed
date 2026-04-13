#!/bin/bash

# Build React frontend
echo "Building React frontend..."
cd frontend
npm install
npm run build
cd ..

# Build .NET backend
echo "Building .NET backend..."
dotnet build

echo "Build complete! Run 'dotnet run --project backend/backend.csproj' to start the server."