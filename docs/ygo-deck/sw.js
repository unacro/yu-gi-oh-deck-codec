const CURRENT_DAY = Number.parseInt(Date.now() / 86400000); // 每日轮换(过期)
const CACHE_NAME = `ygo-card-database-v0-${CURRENT_DAY}`;

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((name) => {
					if (name !== CACHE_NAME) return caches.delete(name);
				}),
			);
		}),
	);
});

self.addEventListener("fetch", (event) => {
	if (event.request.method !== "GET") {
		return;
	}
	if (!event.request.url.startsWith("https://ygocdb.com/api/")) {
		return;
	}
	// 修改响应
	event.respondWith(
		caches.match(event.request).then((cachedResponse) => {
			// 命中缓存
			if (cachedResponse) {
				// && cachedResponse.type === "cors"
				return cachedResponse;
			}
			// 新的请求
			return fetch(event.request).then((response) => {
				// 不缓存无效响应
				if (!response || !response.ok || response.type === "opaque") {
					return response;
				}
				// 克隆响应(防止消耗)并缓存
				const responseClone = response.clone();
				console.debug(`在线请求百鸽卡查 API ${event.request.url}`);
				caches.open(CACHE_NAME).then((cache) => {
					cache.put(event.request, responseClone);
				});
				return response;
			});
		}),
	);
});
