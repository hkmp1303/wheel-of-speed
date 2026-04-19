#!/bin/bash

# Build React frontend
echo "Building React frontend..."
cd Frontend
npm install
npm run build
cd ..

# Build .NET backend
echo "Building .NET backend..."
dotnet build

echo "Build complete! Run 'dotnet run --project Server/EverySecondLetter.csproj' to start the server."