# Drift Coffee ordering system

A simple React kiosk for taking coffee orders, showing a staff queue, and managing menu items and sales.

## Run it locally

From this `coffee-shop` folder:

```powershell
npm run dev
```

The root script starts the React application kept in `frontend`. If dependencies have not been installed yet, run:

```powershell
npm run install:frontend
npm run dev
```

To test the offline-ready production version:

```powershell
npm run build
npm run preview
```

After the production app has loaded once, its service worker caches the app shell and its loaded assets for offline use.

## Data and synchronisation

Orders and menu changes are stored in browser `localStorage`. Other open tabs under the same browser profile and site origin synchronise immediately using the browser storage event and `BroadcastChannel`.

Browser localStorage cannot synchronise separate devices or browser profiles by itself. If multiple physical kiosks need to share a live queue, replace the storage layer in `frontend/src/useCoffeeShop.js` with a shared API or realtime database.
# coffee-shop
# coffee-shop
