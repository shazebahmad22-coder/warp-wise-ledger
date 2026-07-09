import { RootRoute, Router } from '@tanstack/react-router';
import React from 'react';

const Root = () => {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Warp Wise Ledger</title>
      </head>
      <body>
        <div id="app"></div>
      </body>
    </html>
  );
};

const rootRoute = new RootRoute({
  component: Root,
});

export const Route = rootRoute;

export const routeTree = rootRoute.addChildren([]);

export const router = new Router({ routeTree });
