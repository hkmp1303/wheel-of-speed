# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY Server/WheelOfSpeed.Server.csproj Server/
RUN dotnet restore Server/WheelOfSpeed.Server.csproj

COPY Server/ Server/
RUN dotnet publish Server/WheelOfSpeed.Server.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish ./

# Render injects PORT at runtime. Fall back to 10000 for local container runs.
CMD ["sh", "-c", "ASPNETCORE_URLS=http://+:${PORT:-10000} dotnet WheelOfSpeed.Server.dll"]
