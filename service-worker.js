



/////////////////////////////////////////////////////////////////////////////////////////////////////////////



const staticCacheName = 'media-sphere-v2.9';

const fonts = [
  'https://cdn.glitch.global/4604ff4b-6eb8-48c8-899f-321d23359af1/Poppins-Regular.woff2?v=1720415271771',
  'https://cdn.glitch.global/4604ff4b-6eb8-48c8-899f-321d23359af1/Raleway-Regular.woff2?v=1720415279863'
];
const assets = [
  /*
  'https://cdn.glitch.global/4604ff4b-6eb8-48c8-899f-321d23359af1/fullscreen.svg?v=1720502110723',
  'https://cdn.glitch.global/4604ff4b-6eb8-48c8-899f-321d23359af1/picture_in_picture.svg?v=1720502115220',
  'https://cdn.glitch.global/4604ff4b-6eb8-48c8-899f-321d23359af1/settings.svg?v=1720503275108',
  'https://cdn.glitch.global/4604ff4b-6eb8-48c8-899f-321d23359af1/pause.svg?v=1720867026860',
  'https://cdn.glitch.global/4604ff4b-6eb8-48c8-899f-321d23359af1/load.svg?v=1720870567725',
  'https://cdn.glitch.global/4604ff4b-6eb8-48c8-899f-321d23359af1/mute.svg?v=1720880526225',
  'https://cdn.glitch.global/4604ff4b-6eb8-48c8-899f-321d23359af1/upload.svg?v=1720947329500',
  'https://cdn.glitch.global/4604ff4b-6eb8-48c8-899f-321d23359af1/play.svg?v=1720968680771',
  'https://cdn.glitch.global/4604ff4b-6eb8-48c8-899f-321d23359af1/play_png.png?v=1720969234660',
  'https://cdn.glitch.global/4604ff4b-6eb8-48c8-899f-321d23359af1/settings_w.svg?v=1721565436819',
  'https://cdn.glitch.global/4604ff4b-6eb8-48c8-899f-321d23359af1/web_upload.svg?v=1721565884097',
  'https://cdn.glitch.global/4604ff4b-6eb8-48c8-899f-321d23359af1/Media%20Player%20OG%20Image.png?v=1721623654736',
  'https://cdn.glitch.global/4604ff4b-6eb8-48c8-899f-321d23359af1/play_video.svg?v=1721638402042',*/

  'play.png',
  'play.svg',
  'play_maskable.png',
  'play_maskable_monochrome.png',
  'play_maskable_monochrome_409.png',
  'play_small.png',
  'web_upload.png',
  'png/error.png',
  'png/warning.png',

  'png/youtube.png',
  'png/instagram.png',
  'png/x.png',
  'png/facebook.png',
  'png/spotify.png',
  'png/amazon.png',
  'png/soundcloud.png',
  'png/reddit.png',
  'png/pinterest.png',
  'png/linktree.png',
  'png/discord.png',
  'png/twitch.png',
  'png/linkedin.png',
  'png/patreon.png',
  'png/kofi.png',
  'png/tiktok.png',
  'png/snapchat.png',

  'index.js',
  'js/dev.js',
  'js/msc.js',
  'js/network.js',
  'js/request.js',
  'js/script.js',
  'js/video.js',

  'css/main.css',
  'css/new.css',
  'css/res_m.css',
  'css/style.css',

  'svg/install.svg',
  'svg/pause.svg',
  'svg/play.svg',
  'svg/fullscreen.svg',
  'svg/fullscreen_exit.svg',
  'svg/pip.svg',
  'svg/pip_exit.svg',
  'svg/seek.svg',
  'svg/rewind.svg',
  'svg/fitscreen.svg',
  'svg/settings.svg',
  'svg/skip_previous.svg',
  'svg/skip_forward.svg',
  'svg/replay.svg',
  'svg/error.svg',
  'svg/chevron.svg',
  'svg/close.svg',
  'svg/cast.svg',
  'svg/cast_connected.svg',
  'svg/open.svg',
  'svg/link.svg',
  'svg/globe.svg',
  'svg/profile.svg',
  'svg/home.svg',
  'svg/trending.svg',
  'svg/search.svg',
  'svg/info.svg',
  'svg/playlist_play.svg',
  'svg/radio.svg',
  'svg/liked.svg',
  'svg/watch.svg',
  'svg/playlists.svg',
  'svg/shuffle.svg',
  'svg/audio.svg'
];

const cacheItems = [...assets, ...fonts];

/*
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(staticCacheName).then((cache) => {
      console.log('caching shell assets');
      cache.addAll(assets);
    })
  );
});*/

// Install event: Cache all assets
self.addEventListener('install', (evt) => {
  evt.waitUntil(
      caches.open(staticCacheName).then((cache) => {
          console.log('Caching shell assets...');
          return Promise.all(
              cacheItems.map((url) =>
                  cache.add(url).catch((err) => {
                      console.error(`Failed to cache ${url}:`, err);
                  })
              )
          );
      })
  );
});

// Activate event: Delete old caches
self.addEventListener('activate', (evt) => {
  evt.waitUntil(
      caches.keys().then((keys) => {
          return Promise.all(
              keys
                  .filter((key) => key !== staticCacheName)
                  .map((key) => caches.delete(key))
          );
      })
  );

  self.registration.getNotifications().then((notifications) => {
    notifications.forEach((notification) => notification.close());
  });

  console.log('Service worker activated!');
});


// Fetch event: Serve cached assets or fallback to network
self.addEventListener('fetch', (evt) => {
  evt.respondWith(
      caches.match(evt.request).then((cacheRes) => {
          return (
              cacheRes ||
              fetch(evt.request).catch(() => {
                  // Return fallback response if desired
                  if (evt.request.mode === 'navigate') {
                      return caches.match('/index.html');
                  }
              })
          );
      })
  );
});


self.addEventListener('notificationclick', event => {
  event.notification.close(); // Close the notification

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
        let hadWindowToFocus = false;
        
        // Check if a window with the target URL already exists
        for (const windowClient of clientsArr) {
            if (windowClient.url.indexOf(event.notification.data.url) >= 0) {
                hadWindowToFocus = true;
                return windowClient.focus(); // Focus the existing window
            }
        }

        // If no matching window exists, then open the URL in the same window
        if (!hadWindowToFocus) {
            return clients.openWindow(event.notification.data.url).then((windowClient) => {
                // Focus the newly opened window
                if (windowClient) {
                    windowClient.focus();
                }
            });
        }
    })
  );
});

// Register an event listener for Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'clear-notifications') {
      event.waitUntil(
          clearAllNotifications()
      );
  }
  /*
  if (event.tag === 'video-buffer-sync') {
    event.waitUntil(bufferVideoChunks(self.videoUrl));
  }*/
});

/*
async function bufferVideoChunks(videoUrl) {
  // const videoUrl = '<googlevideo-url>'; // Replace with the extracted googlevideo URL
  const chunkSize = 1024 * 1024; // Define a chunk size, e.g., 1 MB
  let start = 0;

  while (true) {
    const response = await fetch(videoUrl, {
      headers: {
        Range: `bytes=${start}-${start + chunkSize - 1}`,
      },
    });

    if (!response.ok) break;

    const chunk = await response.blob();
    await cacheVideoChunk(chunk, start);

    start += chunkSize;

    // Break if content length is exhausted
    const contentRange = response.headers.get('Content-Range');
    if (contentRange) {
      const [, , total] = contentRange.split(/[ -/]/);
      if (start >= parseInt(total)) break;
    }
  }
}

async function cacheVideoChunk(chunk, start) {
  const cache = await caches.open('video-cache');
  await cache.put(`/video-chunk-${start}`, new Response(chunk));
}*/

// Function to clear all notifications
async function clearAllNotifications() {
  const notifications = await self.registration.getNotifications();
  notifications.forEach((notification) => notification.close());
  console.log('All notifications cleared via Background Sync.');
}

async function doWorkBeforeShutdown() {
  console.log('Performing shutdown tasks');
  // Perform the necessary work here

  navigator.serviceWorker.getRegistration().then((registration) => {
    if (registration) {
      registration.getNotifications().then((notifications) => {
        notifications.forEach((notification) => notification.close());
      });
    }
  });
}

// Service worker (sw.js)
self.addEventListener('message', event => {

  const { type, url } = event.data;
  if (type === 'SET_VIDEO_URL') {
    // Store the URL for later use
    self.videoUrl = url;

    console.log('Received video URL in Service Worker:', url);
  }

  if (event.data.action === 'app_closing' || event.data.action === 'app_opened') {
      console.log('App is about to close/open');
      // Handle any pre-close logic

      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          registration.getNotifications().then((notifications) => {
            notifications.forEach((notification) => notification.close());
          });
        }
      });

      event.waitUntil(doWorkBeforeShutdown());
  }

  if (event.data && event.data.action === 'closeErrorNotification') {
      const targetTag = event.data.tag; // Tag sent from the main thread

      // Close all notifications (optional: add conditions to close specific ones)
      self.registration.getNotifications({ tag: targetTag }).then(notifications => {
          notifications.forEach(notification => {
              notification.close();
          });
      });
  }

  if (event.data && event.data.action === 'closeOfflineNotification') {
    const targetTag = event.data.tag; // Tag sent from the main thread

    // Close all notifications (optional: add conditions to close specific ones)
    self.registration.getNotifications({ tag: targetTag }).then(notifications => {
        notifications.forEach(notification => {
            notification.close();
        });
    });
  }

  if (event.data && event.data.action === 'closeSlowNotification') {
    const targetTag = event.data.tag; // Tag sent from the main thread

    // Close all notifications (optional: add conditions to close specific ones)
    self.registration.getNotifications({ tag: targetTag }).then(notifications => {
        notifications.forEach(notification => {
            notification.close();
        });
    });
  }
});


