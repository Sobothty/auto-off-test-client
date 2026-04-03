# Auto Offensive Client

Next.js client auth app using:
- BetterAuth for session/cookie handling
- Keycloak for login
- FastAPI gateway for registration (which then creates Keycloak + Go DB user)

## Flow

1. **Register** (`/register`)
- Browser calls `POST /api/register` (Next.js route)
- Next.js route forwards to FastAPI `POST /users`
- FastAPI handles full registration transaction (Keycloak + Go DB via gRPC)

2. **Login** (`/login`)
- Browser starts BetterAuth OAuth2 flow
- BetterAuth redirects to Keycloak
- On success, BetterAuth sets HttpOnly session cookies

## Environment

Copy `.env.example` to `.env.local` and set values.

```bash
cp .env.example .env.local
```

Required:
- `NEXT_PUBLIC_APP_URL`
- `FASTAPI_GATEWAY_URL`
- `BETTER_AUTH_SECRET`
- `KEYCLOAK_ISSUER`
- `KEYCLOAK_WEB_CLIENT_ID`
- `KEYCLOAK_WEB_CLIENT_SECRET`

## Keycloak Client Setup

Use your `web_user` client and configure:
- Valid redirect URI: `http://localhost:3000/api/auth/oauth2/callback/keycloak`
- Web origin: `http://localhost:3000`

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.
