using System.Text.Json.Serialization;
using WheelOfSpeed.Api;
using WheelOfSpeed.Hubs;
using WheelOfSpeed.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy => policy
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()
        .SetIsOriginAllowed(_ => true));
});

builder.Services.AddSignalR()
    .AddJsonProtocol(options =>
    {
        options.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddSingleton<IWordBankService, WordBankService>();
builder.Services.AddSingleton<IMatchEngine, MatchEngine>();
builder.Services.AddSingleton<IMatchService, InMemoryMatchService>();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors();

// Ensure CORS response headers are present on all responses, including
// error responses. Use a lightweight middleware that echoes the request
// Origin when present (required when AllowCredentials is used) and
// short-circuits OPTIONS preflight requests.
app.Use(async (context, next) =>
{
    context.Response.OnStarting(() => {
        var origin = context.Request.Headers["Origin"].ToString();
        if (!string.IsNullOrEmpty(origin))
        {
            context.Response.Headers["Access-Control-Allow-Origin"] = origin;
        }
        else
        {
            context.Response.Headers["Access-Control-Allow-Origin"] = "*";
        }

        context.Response.Headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
        context.Response.Headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS";
        context.Response.Headers["Access-Control-Allow-Credentials"] = "true";
        return Task.CompletedTask;
    });

    if (HttpMethods.IsOptions(context.Request.Method))
    {
        // Return 204 for preflight
        context.Response.StatusCode = StatusCodes.Status204NoContent;
        return;
    }

    await next();
});

app.Use(async (context, next) =>
{
    try
    {
        await next(context);
    }
    catch (InvalidOperationException ex)
    {
        context.Response.StatusCode = 400;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { error = ex.Message });
    }
    catch (KeyNotFoundException ex)
    {
        context.Response.StatusCode = 404;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { error = ex.Message });
    }
    catch (ArgumentException ex)
    {
        context.Response.StatusCode = 400;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { error = ex.Message });
    }
});

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));
app.MapMatchEndpoints();
app.MapHub<MatchHub>("/hubs/match");

app.Run();
