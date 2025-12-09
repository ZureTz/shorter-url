# Shorter-URL Frontend

This is the frontend part of the project, built with React, TypeScript, Next.js, and Tailwind CSS.

## Getting Started

First, run the development server:

```bash
bun dev
```

Open your browser and navigate to [http://localhost:3000](http://localhost:3000) to see the application in action.

You may need to use `.env.local` file to set environment variables for your application.

```bash
cp .env.local.example .env.local
```

Then, modify the `.env.local` file to set your environment variables.

Also, before you start the development server, make sure to enable rewrites in your Next.js configuration. This is necessary for the application to correctly handle API requests. Uncomment the `rewrites` function, and comment out the `output`, `trailingSlash`, and `distDir` options in the `next.config.js` file.

```typescript
const nextConfig: NextConfig = {
  /* config options here */

  // Generate static HTML for all pages
  /// output: "export",
  /// trailingSlash: true,
  /// distDir: 'dist',

  async rewrites() {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};
```

## Building for Production

To build the application for production, you need first to rollback the rewrites in the `next.config.js` file to their original state, which is commented out in the development section.

```typescript
const nextConfig: NextConfig = {
  /* config options here */

  // Generate static HTML for all pages
  output: "export",
  trailingSlash: true,
  distDir: "dist"

  // async rewrites() {
  //   const backendUrl =
  //     process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

  //   return [
  //     {
  //       source: "/api/:path*",
  //       destination: `${backendUrl}/api/:path*`,
  //     },
  //     {
  //       source: "/:path*",
  //       destination: `${backendUrl}/:path*`,
  //     },
  //   ];
  // },
  // // This is required to support PostHog trailing slash API requests
  // skipTrailingSlashRedirect: true,
};
```

Then, you can proceed with the following steps:

1. Generate a production build of the application by running:

```bash
bun run build
```

2. Put the `dist` directory in your web server's directory, we now call it YOUR_FRONTEND_PATH. This directory contains the static files for your application.

3. Make sure you have got a domain name pointing to your server, we now call it YOUR_DOMAIN_NAME. You can use services like [Freenom](https://www.freenom.com/) to get a free domain name.

4. Make sure you have a backend server running, we now call it YOUR_BACKEND_URL. This is the URL where your backend API is hosted.

5. Use the template nginx configuration file provided in the `nginx` directory to set up your server(for example, `/etc/nginx/`). You must need to modify YOUR_DOMAIN_NAME, YOUR_FRONTEND_PATH, YOUR_BACKEND_URL to match your setup.
