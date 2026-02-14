const MEDIA_SOURCE = "./media.json";
const stage = document.getElementById("stage");
const uiCompactToggle = document.getElementById("ui-compact-toggle");
const openMessageMenu = document.getElementById("open-message-menu");
const secretPanel = document.getElementById("secret-panel");
const secretCodeInput = document.getElementById("secret-code-input");
const secretCodeSubmit = document.getElementById("secret-code-submit");
const secretCodeError = document.getElementById("secret-code-error");
const secretMessage = document.getElementById("secret-message");
const secretMainText = document.getElementById("secret-main-text");
const noteCard = document.getElementById("note-card");
const musicPlayer = document.getElementById("music-player");
const musicToggle = document.getElementById("music-toggle");
const eqLane = document.getElementById("eq-lane");
const romanticAudio = document.getElementById("romantic-audio");
const CARD_LIFETIME_MS = 10000;
const FADE_IN_MS = 2000;
const FADE_OUT_MS = 2000;
const SPAWN_DELAY_MIN_MS = 1420;
const SPAWN_DELAY_MAX_MS = 3060;
const PHOTO_REPEAT_COOLDOWN = 20;
const VIDEO_REPEAT_COOLDOWN = 20;
const PLACEMENT_SAMPLES = 36;
const PLACEMENT_PADDING = 56;
const IMAGE_PRELOAD_AHEAD = 3;
const IMAGE_PRELOAD_CONCURRENCY = 1;
const VIDEO_PRELOAD_AHEAD = 2;
const VIDEO_PRELOAD_CONCURRENCY = 1;
const VIDEO_METADATA_TIMEOUT_MS = 2400;
const SECRET_CODE = "помню в саратове";
const SECRET_MESSAGE_KEY = 91;
const SECRET_MESSAGE_PAYLOAD =
	"i8SL5Yvni+aK1XuL6XuL+ovrituL64rZi+WL6Yvue4vpituL5Yvvi+57itmL64vhi+uK1HuK2YrYi+SL64rUe4rfituL64vsi+t3e4vmi+V7i+SL5Yrci+6L54rYdorZi+V7i+aL64rae4rae4vmi+6L7nuK2Yvli+iL74vre4rZi+uL4XuL5IvlituL6Yvri+CL5Xd7ityK2Yvle4vli+aL63uK2orZi+uL4Ivre4vmi+uK04vji+d7eYvki+uK24vli+CL7ovneXuL6XuL5ovrityL64vgi+57itqL4IrYi+2L6orQdVFRi/R7itmL7ovqitR7i+CK1Yvqi+CK1Xp7i8SK24vri+mL74vrdovkituL64vpi++L63p7i/qL44vgiteL5ovldorai+OL4IrXi+aL5Xp7i/mK0HuK2HuL54vui+aK1HuK2ovri+eL64rUe4vgitiK3IrTi+uK1HuL43uK2ovri+eL64rUe4vhituL64rai+OL6YvritR7YXJRUYv5itiK2XuK1HuK2ovli+qK24vri+B7i+GK2Ircith7ituL64vsi+aK0Iree4vni+WL54vui+aK2Yvli+l7c4vkituL44rUitmL5orQit57i+N7i+mK2orbi+uK2YrQit5ye4rae4vmi+uK04vui+J7i+OK2orZi+WK24vji+N1e4vFityL7ovmitd7i+CK1Yvqi+CK1XuK2Yvui+qK1Hd7itqL5IvritqL44vqi+V7ityK2Yvle4rZitB7i+6K2orZitd7YXJRUYvHi+WL7YvuitOK13uK2ovhituK0IrZitd7i+OL5orZi+6K24rfi+6L4orae4vmi+t7i+GL5ovli+SL4YrYe4vpe4vkituL64vpi+WL53uL6YvuituK3ovmi+6L53uK2Ivoi+CK2HuL43uL5ovritqL4Ivri++L44rZiteK2orUe4rai+CL64vii++K04vlith7YXI=";
const EQ_BAR_COUNT_DESKTOP = 148;
const EQ_MIN_LEVEL = 0.001;
const EQ_MAX_LEVEL = 1.3;
const EQ_AGC_FLOOR = 0.11;
const EQ_AGC_DECAY = 0.986;
const EQ_AGC_TARGET = 0.24;
const EQ_AUTO_GAIN_MAX = 1.9;
const EQ_ATTACK = 0.9;
const EQ_FLUX_BOOST = 2.15;
const EQ_TOP_SOFT_START = 0.78;
const EQ_ROLLBACK_SEC = 0.2;
const EQ_LOW_TRIM = 0.6;
const EQ_HIGH_TILT = 1.55;
const EQ_BAND_FLOOR_RISE = 0.004;
const EQ_BAND_FLOOR_FALL = 0.32;
const EQ_BAND_PEAK_DECAY = 0.978;
const EQ_BAND_MIN_RANGE = 0.08;
const EQ_FPS_PHONE = 30;
const EQ_FPS_MOBILE = 40;
const EQ_FPS_DESKTOP = 60;
const EQ_BIN_STEP_PHONE = 2;

const musicVizState = {
	audioContext: null,
	analyser: null,
	sourceNode: null,
	freqData: null,
	timeData: null,
	bandRanges: [],
	bars: [],
	smoothedLevels: [],
	previousBandLevels: [],
	bandFloorLevels: [],
	bandPeakLevels: [],
	energyCeil: 0.3,
	lastFrameTimeMs: 0,
	lastRenderTimeMs: 0,
	rafId: 0,
};

function isPhoneViewport() {
	return window.innerWidth <= 430;
}

function isCompactMobileViewport() {
	return window.innerWidth < 700;
}

function isMobileLowPowerDevice() {
	const coarsePointer =
		window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
	const lowMemory =
		typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 4;
	const lowCpu =
		typeof navigator.hardwareConcurrency === "number" &&
		navigator.hardwareConcurrency <= 4;
	return isCompactMobileViewport() && (coarsePointer || lowMemory || lowCpu);
}

function getMaxActiveCount() {
	if (isPhoneViewport()) return isMobileLowPowerDevice() ? 6 : 7;
	if (window.innerWidth < 800) return isMobileLowPowerDevice() ? 6 : 8;
	return 14;
}

function getEqBarCountForViewport() {
	if (window.innerWidth <= 375) return 64;
	if (window.innerWidth <= 430) return 76;
	if (window.innerWidth < 700) return 96;
	return EQ_BAR_COUNT_DESKTOP;
}

function getVideoProbability() {
	if (isPhoneViewport()) return 0.08;
	if (isCompactMobileViewport()) return 0.12;
	return 0.18;
}

function getSpawnDelayRange() {
	if (isPhoneViewport()) {
		return { min: SPAWN_DELAY_MIN_MS, max: SPAWN_DELAY_MAX_MS };
	}
	if (isCompactMobileViewport()) return { min: 1750, max: 3400 };
	return { min: SPAWN_DELAY_MIN_MS, max: SPAWN_DELAY_MAX_MS };
}

function getPlacementSamples() {
	if (isPhoneViewport()) return 12;
	if (isCompactMobileViewport()) return 20;
	return PLACEMENT_SAMPLES;
}

function getPlacementPadding() {
	if (isPhoneViewport()) return 28;
	if (isCompactMobileViewport()) return 42;
	return PLACEMENT_PADDING;
}

function getEqFrameIntervalMs() {
	if (isPhoneViewport()) return 1000 / EQ_FPS_PHONE;
	if (isCompactMobileViewport()) return 1000 / EQ_FPS_MOBILE;
	return 1000 / EQ_FPS_DESKTOP;
}

function getAnalyserFftSize() {
	if (isPhoneViewport()) return 1024;
	if (isCompactMobileViewport()) return 2048;
	return 4096;
}

function syncMobilePerformanceMode() {
	document.body.classList.toggle("mobile-optimized", isMobileLowPowerDevice());
}

const state = {
	items: [],
	images: [],
	videos: [],
	imageResolvedUrl: new Map(),
	imageWarmStatus: new Map(),
	imageWarmQueue: [],
	imageWarmActive: 0,
	videoWarmStatus: new Map(),
	videoWarmQueue: [],
	videoWarmActive: 0,
	activeCount: 0,
	maxActive: getMaxActiveCount(),
	zCounter: 10,
	placementCounter: 0,
	activePlacements: new Map(),
	recentPhotoQueue: [],
	recentPhotoCounts: new Map(),
	recentVideoQueue: [],
	recentVideoCounts: new Map(),
};

async function loadMediaItems() {
	try {
		const response = await fetch(MEDIA_SOURCE, { cache: "no-store" });
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		const data = await response.json();
		if (!Array.isArray(data.items)) throw new Error("items is not an array");
		state.items = data.items.filter((item) => {
			return (
				item &&
				(item.type === "image" || item.type === "video") &&
				typeof item.url === "string" &&
				item.url.length > 0
			);
		});
		state.images = state.items.filter((item) => item.type === "image");
		state.videos = state.items.filter((item) => item.type === "video");
		state.imageResolvedUrl.clear();
		state.imageWarmStatus.clear();
		state.imageWarmQueue = [];
		state.imageWarmActive = 0;
		state.videoWarmStatus.clear();
		state.videoWarmQueue = [];
		state.videoWarmActive = 0;
		state.recentPhotoQueue = [];
		state.recentPhotoCounts.clear();
		state.recentVideoQueue = [];
		state.recentVideoCounts.clear();
	} catch (error) {
		console.error("Не удалось загрузить media.json:", error);
		state.items = [];
		state.images = [];
		state.videos = [];
		state.imageResolvedUrl.clear();
		state.imageWarmStatus.clear();
		state.imageWarmQueue = [];
		state.imageWarmActive = 0;
		state.videoWarmStatus.clear();
		state.videoWarmQueue = [];
		state.videoWarmActive = 0;
		state.recentPhotoQueue = [];
		state.recentPhotoCounts.clear();
		state.recentVideoQueue = [];
		state.recentVideoCounts.clear();
	}
}

function randomBetween(min, max) {
	return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
	return Math.floor(randomBetween(min, max + 1));
}

function pickRandomUniqueEntries(entries, count) {
	const pool = [...entries];
	const picked = [];
	while (pool.length > 0 && picked.length < count) {
		const index = randomInt(0, pool.length - 1);
		picked.push(pool.splice(index, 1)[0]);
	}
	return picked;
}

function getWebpCandidateUrl(url) {
	if (typeof url !== "string") return url;
	if (url.toLowerCase().endsWith(".webp")) return url;
	return url.replace(/\.(jpe?g|png)$/i, ".webp");
}

function warmupImageWithPreferredFormat(originalUrl) {
	return new Promise((resolve) => {
		const webpCandidate = getWebpCandidateUrl(originalUrl);
		const primaryUrl =
			webpCandidate !== originalUrl ? webpCandidate : originalUrl;
		const probeImage = new Image();
		probeImage.decoding = "async";

		probeImage.onload = () => {
			resolve(primaryUrl);
		};

		probeImage.onerror = () => {
			if (primaryUrl === originalUrl) {
				resolve(null);
				return;
			}
			const fallbackImage = new Image();
			fallbackImage.decoding = "async";
			fallbackImage.onload = () => resolve(originalUrl);
			fallbackImage.onerror = () => resolve(null);
			fallbackImage.src = originalUrl;
		};

		probeImage.src = primaryUrl;
	});
}

function enqueueImageWarmup(url) {
	if (!url) return;
	const status = state.imageWarmStatus.get(url);
	if (status === "loading" || status === "ready" || status === "failed") return;
	if (state.imageWarmQueue.includes(url)) return;
	state.imageWarmQueue.push(url);
	drainImageWarmupQueue();
}

function drainImageWarmupQueue() {
	while (
		state.imageWarmActive < IMAGE_PRELOAD_CONCURRENCY &&
		state.imageWarmQueue.length > 0
	) {
		const url = state.imageWarmQueue.shift();
		state.imageWarmActive += 1;
		state.imageWarmStatus.set(url, "loading");
		warmupImageWithPreferredFormat(url)
			.then((resolvedUrl) => {
				if (resolvedUrl) {
					state.imageResolvedUrl.set(url, resolvedUrl);
					state.imageWarmStatus.set(url, "ready");
					return;
				}
				state.imageResolvedUrl.delete(url);
				state.imageWarmStatus.set(url, "failed");
			})
			.catch(() => {
				state.imageResolvedUrl.delete(url);
				state.imageWarmStatus.set(url, "failed");
			})
			.finally(() => {
				state.imageWarmActive = Math.max(0, state.imageWarmActive - 1);
				drainImageWarmupQueue();
			});
	}
}

function warmupVideoMetadata(url) {
	return new Promise((resolve) => {
		const video = document.createElement("video");
		let finished = false;
		const finalize = (ready) => {
			if (finished) return;
			finished = true;
			video.removeAttribute("src");
			video.load();
			resolve(ready);
		};

		const timeoutId = window.setTimeout(
			() => finalize(false),
			VIDEO_METADATA_TIMEOUT_MS,
		);
		video.preload = "metadata";
		video.muted = true;
		video.playsInline = true;
		video.onloadedmetadata = () => {
			window.clearTimeout(timeoutId);
			finalize(true);
		};
		video.onerror = () => {
			window.clearTimeout(timeoutId);
			finalize(false);
		};
		video.src = url;
		video.load();
	});
}

function enqueueVideoWarmup(url) {
	if (!url) return;
	const status = state.videoWarmStatus.get(url);
	if (status === "loading" || status === "ready" || status === "failed") return;
	if (state.videoWarmQueue.includes(url)) return;
	state.videoWarmQueue.push(url);
	drainVideoWarmupQueue();
}

function drainVideoWarmupQueue() {
	while (
		state.videoWarmActive < VIDEO_PRELOAD_CONCURRENCY &&
		state.videoWarmQueue.length > 0
	) {
		const url = state.videoWarmQueue.shift();
		state.videoWarmActive += 1;
		state.videoWarmStatus.set(url, "loading");
		warmupVideoMetadata(url)
			.then((ready) => {
				state.videoWarmStatus.set(url, ready ? "ready" : "failed");
			})
			.catch(() => {
				state.videoWarmStatus.set(url, "failed");
			})
			.finally(() => {
				state.videoWarmActive = Math.max(0, state.videoWarmActive - 1);
				drainVideoWarmupQueue();
			});
	}
}

function warmupSomeImages(targetCount) {
	const candidates = state.images.filter((item) => {
		const status = state.imageWarmStatus.get(item.url);
		return status !== "ready" && status !== "loading" && status !== "failed";
	});
	const toWarm = pickRandomUniqueEntries(
		candidates,
		Math.min(targetCount, candidates.length),
	);
	for (const item of toWarm) {
		enqueueImageWarmup(item.url);
	}
}

function warmupSomeVideos(targetCount) {
	const candidates = state.videos.filter((item) => {
		const status = state.videoWarmStatus.get(item.url);
		return status !== "ready" && status !== "loading" && status !== "failed";
	});
	const toWarm = pickRandomUniqueEntries(
		candidates,
		Math.min(targetCount, candidates.length),
	);
	for (const item of toWarm) {
		enqueueVideoWarmup(item.url);
	}
}

function pickRandomVideoItem() {
	if (state.videos.length === 0) return null;
	warmupSomeVideos(isPhoneViewport() ? 1 : VIDEO_PRELOAD_AHEAD);
	const healthyVideos = state.videos.filter((item) => {
		return state.videoWarmStatus.get(item.url) !== "failed";
	});
	if (healthyVideos.length === 0) return null;

	const availableVideos = healthyVideos.filter((video) => {
		return !state.recentVideoCounts.has(video.url);
	});
	const source = availableVideos.length > 0 ? availableVideos : healthyVideos;

	const readyVideos = source.filter((item) => {
		return state.videoWarmStatus.get(item.url) === "ready";
	});
	if (readyVideos.length === 0) {
		for (const video of source) {
			enqueueVideoWarmup(video.url);
		}
		return null;
	}
	return readyVideos[randomInt(0, readyVideos.length - 1)];
}

function pickRandomImageItem() {
	if (state.images.length === 0) return null;

	const healthyImages = state.images.filter((item) => {
		return state.imageWarmStatus.get(item.url) !== "failed";
	});
	if (healthyImages.length === 0) return null;
	const imagePool = healthyImages;

	const availableImages = imagePool.filter((image) => {
		return !state.recentPhotoCounts.has(image.url);
	});

	const source = availableImages.length > 0 ? availableImages : imagePool;
	const readySource = source.filter((item) => {
		return state.imageWarmStatus.get(item.url) === "ready";
	});
	warmupSomeImages(isPhoneViewport() ? 2 : IMAGE_PRELOAD_AHEAD);
	if (readySource.length > 0) {
		return readySource[randomInt(0, readySource.length - 1)];
	}
	for (const image of source) {
		enqueueImageWarmup(image.url);
	}
	return null;
}

function rememberImageShown(imageItem) {
	if (!imageItem || imageItem.type !== "image") return;
	const key = imageItem.url;

	state.recentPhotoQueue.push(key);
	state.recentPhotoCounts.set(key, (state.recentPhotoCounts.get(key) || 0) + 1);

	if (state.recentPhotoQueue.length > PHOTO_REPEAT_COOLDOWN) {
		const oldestKey = state.recentPhotoQueue.shift();
		const nextCount = (state.recentPhotoCounts.get(oldestKey) || 1) - 1;
		if (nextCount <= 0) {
			state.recentPhotoCounts.delete(oldestKey);
		} else {
			state.recentPhotoCounts.set(oldestKey, nextCount);
		}
	}
}

function rememberVideoShown(videoItem) {
	if (!videoItem || videoItem.type !== "video") return;
	const key = videoItem.url;

	state.recentVideoQueue.push(key);
	state.recentVideoCounts.set(key, (state.recentVideoCounts.get(key) || 0) + 1);

	if (state.recentVideoQueue.length > VIDEO_REPEAT_COOLDOWN) {
		const oldestKey = state.recentVideoQueue.shift();
		const nextCount = (state.recentVideoCounts.get(oldestKey) || 1) - 1;
		if (nextCount <= 0) {
			state.recentVideoCounts.delete(oldestKey);
		} else {
			state.recentVideoCounts.set(oldestKey, nextCount);
		}
	}
}

function pickRandomItem() {
	const hasImages = state.images.length > 0;
	const hasVideos = state.videos.length > 0;
	const videoProbability = getVideoProbability();

	if (hasImages && hasVideos) {
		if (Math.random() < 1 - videoProbability) {
			const imageItem = pickRandomImageItem();
			return imageItem || pickRandomVideoItem();
		}
		const warmedVideo = pickRandomVideoItem();
		return warmedVideo || pickRandomImageItem();
	}
	if (hasImages) return pickRandomImageItem();
	if (hasVideos) return pickRandomVideoItem();
	return null;
}

function createMediaNode(item) {
	if (item.type === "video") {
		const video = document.createElement("video");
		video.src = item.url;
		video.muted = true;
		video.loop = true;
		video.autoplay = true;
		video.playsInline = true;
		video.preload = "metadata";
		video.setAttribute("playsinline", "");
		video.setAttribute("webkit-playsinline", "");
		video.disablePictureInPicture = true;
		video.controls = false;
		return video;
	}

	const image = document.createElement("img");
	const originalUrl = item.url;
	const knownResolvedUrl = state.imageResolvedUrl.get(originalUrl);
	const webpCandidate = getWebpCandidateUrl(originalUrl);
	const preferredUrl = knownResolvedUrl || webpCandidate;
	let activeUrl = preferredUrl;
	let fallbackUsed = preferredUrl === originalUrl;

	image.addEventListener("load", () => {
		state.imageResolvedUrl.set(originalUrl, activeUrl);
		state.imageWarmStatus.set(originalUrl, "ready");
	});

	image.addEventListener("error", () => {
		if (!fallbackUsed && originalUrl && activeUrl !== originalUrl) {
			fallbackUsed = true;
			activeUrl = originalUrl;
			image.src = originalUrl;
			return;
		}

		state.imageWarmStatus.set(originalUrl, "failed");
		state.imageResolvedUrl.delete(originalUrl);
		console.warn("Image failed to load in both formats:", originalUrl);
		// Hide broken icon / placeholder if both sources failed.
		image.style.opacity = "0";
		const failedTile = image.closest(".media-float");
		if (failedTile) failedTile.classList.add("is-media-failed");
	});

	image.src = activeUrl;

	image.alt = item.name || "Наше фото";
	image.loading = "eager";
	image.decoding = "async";
	return image;
}

function buildFloatElement(item) {
	const tile = document.createElement("article");
	tile.className = "media-float";
	const phone = isPhoneViewport();
	const compact = isCompactMobileViewport();

	const size = Math.round(
		phone
			? randomBetween(214, 329)
			: compact
				? randomBetween(300, 470)
				: randomBetween(620, 780),
	);
	const ratio = randomBetween(compact ? 0.9 : 0.82, compact ? 1.14 : 1.24);
	const width = Math.max(120, Math.round(size * ratio));
	const height = size;

	tile.style.width = `${width}px`;
	tile.style.height = `${height}px`;
	state.zCounter += 1;
	tile.style.zIndex = `${state.zCounter}`;
	tile.style.filter = compact
		? "none"
		: `saturate(${randomBetween(0.9, 1.2).toFixed(2)})`;

	const mediaNode = createMediaNode(item);
	tile.appendChild(mediaNode);
	attachTileMediaState(tile, mediaNode, item);

	return { tile, width, height };
}

function attachTileMediaState(tile, mediaNode, item) {
	if (!tile || !mediaNode || !item) return;
	const markPending = () => tile.classList.add("is-media-pending");
	const clearPending = () => tile.classList.remove("is-media-pending");
	const markFailed = () => {
		tile.classList.remove("is-media-pending");
		tile.classList.add("is-media-failed");
	};

	if (item.type === "image" && mediaNode instanceof HTMLImageElement) {
		if (mediaNode.complete && mediaNode.naturalWidth > 0) {
			clearPending();
			return;
		}
		markPending();
		const timeoutId = window.setTimeout(() => {
			if (mediaNode.complete && mediaNode.naturalWidth > 0) {
				clearPending();
				return;
			}
			if (state.imageWarmStatus.get(item.url) === "failed") {
				markFailed();
			}
		}, 2800);

		mediaNode.addEventListener(
			"load",
			() => {
				window.clearTimeout(timeoutId);
				clearPending();
			},
			{ once: true },
		);
		mediaNode.addEventListener("error", () => {
			// First error can be normal WEBP->JPG fallback.
			window.setTimeout(() => {
				const isFailed = state.imageWarmStatus.get(item.url) === "failed";
				const isBrokenComplete =
					mediaNode.complete && mediaNode.naturalWidth === 0;
				if (isFailed || isBrokenComplete) {
					window.clearTimeout(timeoutId);
					markFailed();
				}
			}, 0);
		});
		return;
	}

	if (item.type === "video" && mediaNode instanceof HTMLVideoElement) {
		if (mediaNode.readyState >= 2) {
			clearPending();
			return;
		}
		markPending();
		const timeoutId = window.setTimeout(() => {
			if (mediaNode.readyState < 2) {
				console.warn("Video load timeout:", item.url);
				markFailed();
			}
		}, 2400);
		const onReady = () => {
			window.clearTimeout(timeoutId);
			clearPending();
		};
		const onError = () => {
			window.clearTimeout(timeoutId);
			console.warn("Video failed to load:", item.url);
			markFailed();
		};
		mediaNode.addEventListener("loadeddata", onReady, { once: true });
		mediaNode.addEventListener("canplay", onReady, { once: true });
		mediaNode.addEventListener("error", onError, { once: true });
	}
}

function createPlacementRect(x, y, width, height) {
	const padding = getPlacementPadding();
	return {
		x: x - padding,
		y: y - padding,
		width: width + padding * 2,
		height: height + padding * 2,
	};
}

function rectOverlapArea(a, b) {
	const overlapX = Math.max(
		0,
		Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x),
	);
	const overlapY = Math.max(
		0,
		Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y),
	);
	return overlapX * overlapY;
}

function rectSeparation(a, b) {
	const dx = Math.max(b.x - (a.x + a.width), a.x - (b.x + b.width), 0);
	const dy = Math.max(b.y - (a.y + a.height), a.y - (b.y + b.height), 0);
	return Math.hypot(dx, dy);
}

function scorePlacement(candidate) {
	const placements = [...state.activePlacements.values()];
	if (placements.length === 0) return Number.MAX_SAFE_INTEGER;

	let totalOverlapArea = 0;
	let minSeparation = Number.POSITIVE_INFINITY;
	let totalCenterDistance = 0;
	const cx = candidate.x + candidate.width / 2;
	const cy = candidate.y + candidate.height / 2;

	for (const placement of placements) {
		totalOverlapArea += rectOverlapArea(candidate, placement);
		minSeparation = Math.min(
			minSeparation,
			rectSeparation(candidate, placement),
		);
		const px = placement.x + placement.width / 2;
		const py = placement.y + placement.height / 2;
		totalCenterDistance += Math.hypot(cx - px, cy - py);
	}

	// Avoid overlaps first, then prefer positions farther from occupied zones.
	return -totalOverlapArea * 10 + minSeparation * 120 + totalCenterDistance;
}

function findBestStartPosition(width, height) {
	const viewWidth = window.innerWidth;
	const viewHeight = window.innerHeight;
	const margin = 24;
	const minX = margin;
	const minY = margin;
	const maxX = Math.max(minX, viewWidth - width - margin);
	const maxY = Math.max(minY, viewHeight - height - margin);

	if (state.activePlacements.size === 0) {
		return {
			x: randomBetween(minX, maxX),
			y: randomBetween(minY, maxY),
		};
	}

	let best = null;
	const samples = getPlacementSamples();
	for (let i = 0; i < samples; i += 1) {
		const x = randomBetween(minX, maxX);
		const y = randomBetween(minY, maxY);
		const candidate = createPlacementRect(x, y, width, height);
		const score = scorePlacement(candidate);
		if (!best || score > best.score) {
			best = { x, y, score };
		}
	}

	return {
		x: best ? best.x : randomBetween(minX, maxX),
		y: best ? best.y : randomBetween(minY, maxY),
	};
}

function chooseFlightPath(width, height) {
	const start = findBestStartPosition(width, height);
	const compact = isCompactMobileViewport();
	const startX = start.x;
	const startY = start.y;
	const endX = startX + randomBetween(compact ? -54 : -90, compact ? 54 : 90);
	const endY = startY + randomBetween(compact ? -48 : -80, compact ? 48 : 80);
	const swayX = randomBetween(compact ? -28 : -45, compact ? 28 : 45);
	const swayY = randomBetween(compact ? -26 : -40, compact ? 26 : 40);
	const startScale = randomBetween(0.82, 0.98);
	const midScale = randomBetween(0.98, 1.1);
	const endScale = randomBetween(0.88, 1.02);
	const rotateStart = randomBetween(-4, 4);
	const rotateMid = rotateStart + randomBetween(-5, 5);
	const rotateEnd = rotateMid + randomBetween(-6, 6);
	return {
		startX,
		startY,
		endX,
		endY,
		swayX,
		swayY,
		startScale,
		midScale,
		endScale,
		rotateStart,
		rotateMid,
		rotateEnd,
	};
}

function chooseAnimationProfile() {
	return {
		duration: CARD_LIFETIME_MS,
		easing: "cubic-bezier(0.22, 0.61, 0.36, 1)",
	};
}

function primeMediaWarmups() {
	const imageAhead = isPhoneViewport() ? 2 : IMAGE_PRELOAD_AHEAD;
	const videoAhead = isPhoneViewport() ? 1 : VIDEO_PRELOAD_AHEAD;
	warmupSomeImages(imageAhead);
	warmupSomeVideos(videoAhead);
}

function spawnFloatingItem() {
	if (state.items.length === 0) return;
	if (state.activeCount >= state.maxActive) return;
	const compact = isCompactMobileViewport();

	const item = pickRandomItem();
	if (!item) return;
	if (item.type === "image") rememberImageShown(item);
	if (item.type === "video") rememberVideoShown(item);
	const { tile, width, height } = buildFloatElement(item);
	const path = chooseFlightPath(width, height);
	const placementId = ++state.placementCounter;
	state.activePlacements.set(
		placementId,
		createPlacementRect(path.startX, path.startY, width, height),
	);
	const profile = chooseAnimationProfile();
	const duration = profile.duration;
	const fadeInOffset = FADE_IN_MS / duration;
	const fadeOutStartOffset = (duration - FADE_OUT_MS) / duration;

	stage.appendChild(tile);
	state.activeCount += 1;
	const blurEnter = compact ? "blur(0px)" : "blur(14px)";
	const blurMid = compact ? "blur(0px)" : "blur(8px)";
	const blurExit = compact ? "blur(0px)" : "blur(12px)";

	const keyframes = [
		{
			opacity: 0,
			transform: `translate3d(${path.startX}px, ${path.startY}px, 0) scale(${path.startScale}) rotate(${path.rotateStart}deg)`,
			filter: blurEnter,
		},
		{
			opacity: 0.42,
			transform: `translate3d(${path.startX + path.swayX * 0.28}px, ${path.startY + path.swayY * 0.28}px, 0) scale(${(path.startScale + path.midScale) / 2}) rotate(${(path.rotateStart + path.rotateMid) / 2}deg)`,
			filter: blurMid,
			offset: fadeInOffset * 0.55,
		},
		{
			opacity: 0.9,
			transform: `translate3d(${path.startX + path.swayX * 0.5}px, ${path.startY + path.swayY * 0.5}px, 0) scale(${path.midScale}) rotate(${path.rotateMid}deg)`,
			filter: "blur(0px)",
			offset: fadeInOffset,
		},
		{
			opacity: 0.9,
			transform: `translate3d(${path.startX + path.swayX * 0.72}px, ${path.startY + path.swayY * 0.72}px, 0) scale(${(path.midScale + path.endScale) / 2}) rotate(${(path.rotateMid + path.rotateEnd) / 2}deg)`,
			filter: "blur(0px)",
			offset: (fadeInOffset + fadeOutStartOffset) / 2,
		},
		{
			opacity: 0.86,
			transform: `translate3d(${path.endX - path.swayX * 0.35}px, ${path.endY - path.swayY * 0.35}px, 0) scale(${(path.midScale + path.endScale) / 2}) rotate(${(path.rotateMid + path.rotateEnd) / 2}deg)`,
			filter: "blur(0px)",
			offset: fadeOutStartOffset,
		},
		{
			opacity: 0,
			transform: `translate3d(${path.endX}px, ${path.endY}px, 0) scale(${path.endScale}) rotate(${path.rotateEnd}deg)`,
			filter: blurExit,
		},
	];

	const animation = tile.animate(keyframes, {
		duration,
		easing: profile.easing,
		fill: "forwards",
	});

	animation.onfinish = () => {
		const videoNode = tile.querySelector("video");
		if (videoNode) {
			videoNode.pause();
			videoNode.removeAttribute("src");
			videoNode.load();
		}
		tile.remove();
		state.activePlacements.delete(placementId);
		state.activeCount = Math.max(0, state.activeCount - 1);
	};

	warmupSomeImages(1);
	warmupSomeVideos(isPhoneViewport() ? 0 : 1);
}

function startFloatingScene() {
	const initialSpawnCount = Math.min(3, state.maxActive);
	for (let i = 0; i < initialSpawnCount; i += 1) {
		setTimeout(spawnFloatingItem, i * randomInt(260, 420));
	}

	const scheduler = () => {
		const delayRange = getSpawnDelayRange();
		const delay = randomInt(delayRange.min, delayRange.max);
		setTimeout(() => {
			spawnFloatingItem();
			scheduler();
		}, delay);
	};

	scheduler();
}

function normalizeCode(value) {
	return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function updateNoteScrollHint() {
	if (!noteCard) return;
	const canScroll = noteCard.scrollHeight - noteCard.clientHeight > 28;
	const atBottom =
		noteCard.scrollTop + noteCard.clientHeight >= noteCard.scrollHeight - 8;
	noteCard.classList.toggle("show-scroll-hint", canScroll && !atBottom);
}

function scheduleNoteScrollHintUpdate() {
	window.requestAnimationFrame(() => {
		window.requestAnimationFrame(updateNoteScrollHint);
	});
}

function initNoteScrollHint() {
	if (!noteCard) return;
	noteCard.addEventListener("scroll", updateNoteScrollHint, { passive: true });
	scheduleNoteScrollHintUpdate();
}

function decodeUtf8Bytes(bytes) {
	if (typeof TextDecoder !== "undefined") {
		try {
			return new TextDecoder("utf-8").decode(bytes);
		} catch {
			// Fallback below.
		}
	}

	try {
		let percentEncoded = "";
		for (let i = 0; i < bytes.length; i += 1) {
			percentEncoded += `%${bytes[i].toString(16).padStart(2, "0")}`;
		}
		return decodeURIComponent(percentEncoded);
	} catch {
		let latin1 = "";
		for (let i = 0; i < bytes.length; i += 1) {
			latin1 += String.fromCharCode(bytes[i]);
		}
		return latin1;
	}
}

function decodeSecretMessage() {
	try {
		const encoded = atob(SECRET_MESSAGE_PAYLOAD.replace(/\s+/g, ""));
		const bytes = new Uint8Array(encoded.length);
		for (let i = 0; i < encoded.length; i += 1) {
			bytes[i] = encoded.charCodeAt(i) ^ SECRET_MESSAGE_KEY;
		}
		const decoded = decodeUtf8Bytes(bytes).trim();
		return decoded;
	} catch (error) {
		console.error("Не удалось расшифровать текст послания:", error);
		return "";
	}
}

function ensureSecretMessageText() {
	if (!secretMainText) return;
	if (secretMainText.dataset.ready === "1") return;
	const decoded = decodeSecretMessage();
	secretMainText.textContent = decoded || "Ошибка расшифровки послания.";
	secretMainText.dataset.ready = "1";
}

function openSecretMessage() {
	if (!secretMessage) return;
	ensureSecretMessageText();
	secretMessage.hidden = false;
	secretMessage.classList.remove("is-open");
	// Force reflow so animation can replay when needed.
	void secretMessage.offsetWidth;
	secretMessage.classList.add("is-open");
	scheduleNoteScrollHintUpdate();
}

function openSecretPanel() {
	if (!secretPanel) return;
	secretPanel.hidden = false;
	secretPanel.classList.remove("is-open");
	// Force reflow so animation can replay.
	void secretPanel.offsetWidth;
	secretPanel.classList.add("is-open");
	scheduleNoteScrollHintUpdate();

	if (openMessageMenu) {
		openMessageMenu.hidden = true;
	}
	if (secretCodeInput && shouldAutoFocusSecretCode()) {
		try {
			secretCodeInput.focus({ preventScroll: true });
		} catch {
			secretCodeInput.focus();
		}
	}
}

function shouldAutoFocusSecretCode() {
	const coarsePointer =
		window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
	const isIOS =
		/iPad|iPhone|iPod/.test(navigator.userAgent) ||
		(navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
	return !coarsePointer && !isIOS;
}

function handleSecretCodeSubmit() {
	if (!secretCodeInput || !secretCodeError || !secretMessage) return;
	const entered = normalizeCode(secretCodeInput.value);
	if (entered === SECRET_CODE) {
		secretCodeError.hidden = true;
		openSecretMessage();
		return;
	}
	secretCodeError.hidden = false;
}

function initSecretCodeUnlock() {
	if (!secretCodeInput || !secretCodeSubmit) return;
	secretCodeSubmit.addEventListener("click", handleSecretCodeSubmit);
	secretCodeInput.addEventListener("keydown", (event) => {
		if (event.key === "Enter") {
			event.preventDefault();
			handleSecretCodeSubmit();
		}
	});
	secretCodeInput.addEventListener("input", () => {
		if (secretCodeError) secretCodeError.hidden = true;
	});
}

function initMessageMenuButton() {
	if (!openMessageMenu) return;
	openMessageMenu.addEventListener("click", openSecretPanel);
}

function setMusicPlayerState(isPlaying) {
	if (!musicPlayer || !musicToggle) return;
	musicPlayer.classList.toggle("is-playing", isPlaying);
	musicToggle.classList.toggle("is-playing", isPlaying);
	musicToggle.setAttribute("aria-label", isPlaying ? "Пауза" : "Плей");
	musicToggle.title = isPlaying ? "Пауза" : "Плей";
	const musicToggleLabel = musicToggle.querySelector(".music-toggle-label");
	if (musicToggleLabel) {
		musicToggleLabel.textContent = isPlaying ? "Пауза" : "Плей";
	}
}

function averageRange(data, from, to) {
	let sum = 0;
	const end = Math.max(from + 1, Math.min(to, data.length));
	for (let i = from; i < end; i += 1) {
		sum += data[i];
	}
	return sum / (end - from);
}

function rebuildEqBandRanges() {
	if (
		!musicVizState.audioContext ||
		!musicVizState.freqData ||
		musicVizState.bars.length === 0
	) {
		return;
	}

	const nyquist = musicVizState.audioContext.sampleRate / 2;
	const minHz = 34;
	const maxHz = Math.min(19000, nyquist * 0.98);
	const hzPerBin = nyquist / musicVizState.freqData.length;
	const barCount = musicVizState.bars.length;
	musicVizState.bandRanges = [];

	for (let i = 0; i < barCount; i += 1) {
		const tStart = i / barCount;
		const tEnd = (i + 1) / barCount;
		const startHz = minHz * Math.pow(maxHz / minHz, tStart);
		const endHz = minHz * Math.pow(maxHz / minHz, tEnd);
		const start = Math.max(1, Math.floor(startHz / hzPerBin));
		const end = Math.max(
			start + 1,
			Math.min(musicVizState.freqData.length, Math.floor(endHz / hzPerBin)),
		);
		musicVizState.bandRanges.push({ start, end });
	}
}

function rebuildEqBars(count) {
	if (!eqLane) return;
	const normalizedCount = Math.max(24, Math.floor(count));
	eqLane.textContent = "";
	for (let i = 0; i < normalizedCount; i += 1) {
		const bar = document.createElement("span");
		bar.className = "eq-bar";
		bar.style.setProperty("--level", `${EQ_MIN_LEVEL}`);
		eqLane.appendChild(bar);
	}
	musicVizState.bars = [...eqLane.querySelectorAll(".eq-bar")];
	musicVizState.smoothedLevels = new Array(musicVizState.bars.length).fill(
		EQ_MIN_LEVEL,
	);
	musicVizState.previousBandLevels = new Array(musicVizState.bars.length).fill(
		0,
	);
	musicVizState.bandFloorLevels = new Array(musicVizState.bars.length).fill(0);
	musicVizState.bandPeakLevels = new Array(musicVizState.bars.length).fill(0);
	musicVizState.lastRenderTimeMs = 0;
	rebuildEqBandRanges();
}

function updateEqBars(timestampMs) {
	if (musicVizState.bars.length === 0) return;

	const isPlaying = Boolean(
		romanticAudio &&
		!romanticAudio.paused &&
		!romanticAudio.ended &&
		romanticAudio.readyState > 1,
	);
	const isUiCollapsed = document.body.classList.contains("ui-collapsed");
	const opacityMultiplier = 1;
	const previousFrameTime = musicVizState.lastFrameTimeMs || timestampMs;
	const deltaSec = Math.max(
		0.001,
		Math.min(0.05, (timestampMs - previousFrameTime) / 1000),
	);
	musicVizState.lastFrameTimeMs = timestampMs;
	const rollbackStep =
		((EQ_MAX_LEVEL - EQ_MIN_LEVEL) * deltaSec) / EQ_ROLLBACK_SEC;

	if (
		isPlaying &&
		musicVizState.analyser &&
		musicVizState.freqData &&
		musicVizState.timeData
	) {
		musicVizState.analyser.getByteFrequencyData(musicVizState.freqData);
		musicVizState.analyser.getByteTimeDomainData(musicVizState.timeData);

		if (musicVizState.bandRanges.length !== musicVizState.bars.length) {
			rebuildEqBandRanges();
		}

		let rms = 0;
		for (let i = 0; i < musicVizState.timeData.length; i += 1) {
			const centered = (musicVizState.timeData[i] - 128) / 128;
			rms += centered * centered;
		}
		rms = Math.sqrt(rms / musicVizState.timeData.length);

		const bandCount = musicVizState.bars.length;
		const rawBands = new Array(bandCount);
		let frameEnergy = 0;
		let frameMaxRaw = 0.0001;
		const binStep = isPhoneViewport() ? EQ_BIN_STEP_PHONE : 1;

		for (let i = 0; i < bandCount; i += 1) {
			const range = musicVizState.bandRanges[i];
			const start = range ? range.start : 1;
			const end = range ? range.end : start + 1;
			let sum = 0;
			let max = 0;
			const count = Math.max(1, Math.ceil((end - start) / binStep));
			for (let bin = start; bin < end; bin += binStep) {
				const value = musicVizState.freqData[bin] / 255;
				sum += value;
				if (value > max) max = value;
			}
			const avg = sum / count;
			const combined = avg * 0.55 + max * 0.45;
			const pos = i / Math.max(1, bandCount - 1);
			const lowTrim = EQ_LOW_TRIM + pos * 0.42;
			const highTilt = 0.82 + pos * EQ_HIGH_TILT;
			const compensated = combined * lowTrim * highTilt;
			rawBands[i] = compensated;
			frameEnergy += compensated;
			frameMaxRaw = Math.max(frameMaxRaw, compensated);
		}

		frameEnergy /= bandCount;
		musicVizState.energyCeil = Math.max(
			frameEnergy,
			musicVizState.energyCeil * EQ_AGC_DECAY,
		);
		const autoGain = Math.min(
			EQ_AUTO_GAIN_MAX,
			EQ_AGC_TARGET / Math.max(EQ_AGC_FLOOR, musicVizState.energyCeil),
		);

		const lowEnergy = averageRange(rawBands, 0, Math.floor(bandCount * 0.24));
		const midEnergy = averageRange(
			rawBands,
			Math.floor(bandCount * 0.24),
			Math.floor(bandCount * 0.64),
		);
		const highEnergy = averageRange(
			rawBands,
			Math.floor(bandCount * 0.64),
			bandCount,
		);

		for (let i = 0; i < bandCount; i += 1) {
			const bar = musicVizState.bars[i];
			const raw = rawBands[i];
			const gate = Math.max(0, raw - musicVizState.energyCeil * 0.27);
			const previousFloor = musicVizState.bandFloorLevels[i] ?? gate * 0.4;
			const bandFloor =
				gate < previousFloor
					? previousFloor * (1 - EQ_BAND_FLOOR_FALL) + gate * EQ_BAND_FLOOR_FALL
					: previousFloor * (1 - EQ_BAND_FLOOR_RISE) +
						gate * EQ_BAND_FLOOR_RISE;
			const previousPeak =
				musicVizState.bandPeakLevels[i] ??
				Math.max(bandFloor + EQ_BAND_MIN_RANGE, gate);
			const bandPeak = Math.max(
				gate,
				previousPeak * EQ_BAND_PEAK_DECAY,
				bandFloor + EQ_BAND_MIN_RANGE,
			);
			musicVizState.bandFloorLevels[i] = bandFloor;
			musicVizState.bandPeakLevels[i] = bandPeak;
			const bandRange = Math.max(EQ_BAND_MIN_RANGE, bandPeak - bandFloor);
			const bandNormalized = Math.max(
				0,
				Math.min(1, (gate - bandFloor) / bandRange),
			);
			const previousBand =
				musicVizState.previousBandLevels[i] ?? bandNormalized;
			const spectralFlux = Math.max(0, bandNormalized - previousBand);
			musicVizState.previousBandLevels[i] =
				previousBand * 0.4 + bandNormalized * 0.6;
			const pos = i / Math.max(1, bandCount - 1);
			const lowWeight = Math.max(0, 1 - pos * 2.2);
			const highWeight = Math.max(0, (pos - 0.45) * 1.95);
			const midWeight = 1 - Math.min(1, Math.abs(pos - 0.5) * 2);
			const toneFactor =
				0.76 +
				lowEnergy * lowWeight * 0.18 +
				midEnergy * midWeight * 0.36 +
				highEnergy * highWeight * 0.58;
			const frameRelative = Math.min(1, raw / frameMaxRaw);
			const normalized = Math.min(1, bandNormalized * autoGain * toneFactor);
			const shaped = Math.pow(normalized, 1.12);
			let targetLevel =
				EQ_MIN_LEVEL +
				shaped * 1.18 +
				spectralFlux * (EQ_FLUX_BOOST * 0.42) +
				rms * 0.006;

			// Real-EQ cap: weak bands cannot jump to full height.
			const maxAllowed =
				EQ_MAX_LEVEL * (0.2 + Math.pow(frameRelative, 1.85) * 0.8);
			targetLevel = Math.min(targetLevel, Math.max(EQ_MIN_LEVEL, maxAllowed));

			// Early soft ceiling: prevents long "fully-filled" plateaus.
			if (targetLevel > EQ_MAX_LEVEL * EQ_TOP_SOFT_START) {
				const over = targetLevel - EQ_MAX_LEVEL * EQ_TOP_SOFT_START;
				targetLevel = EQ_MAX_LEVEL * EQ_TOP_SOFT_START + over * 0.08;
			}
			targetLevel = Math.max(EQ_MIN_LEVEL, Math.min(EQ_MAX_LEVEL, targetLevel));

			const prev = musicVizState.smoothedLevels[i] ?? EQ_MIN_LEVEL;
			let next = prev;
			if (targetLevel > prev) {
				const attackResponse =
					prev > EQ_MAX_LEVEL * 0.7 ? EQ_ATTACK - 0.28 : EQ_ATTACK;
				next = prev + (targetLevel - prev) * attackResponse;
			} else {
				next = Math.max(targetLevel, prev - rollbackStep);
			}
			const displayLevel = Math.max(EQ_MIN_LEVEL, Math.min(EQ_MAX_LEVEL, next));
			musicVizState.smoothedLevels[i] = displayLevel;
			bar.style.setProperty("--level", `${displayLevel.toFixed(3)}`);
			bar.style.backgroundColor = isUiCollapsed ? "rgba(255, 255, 255, 1)" : "";
			bar.style.opacity = isUiCollapsed
				? "0.98"
				: `${Math.min(
						0.96,
						(0.16 + displayLevel * 0.68) * opacityMultiplier,
					).toFixed(3)}`;
		}
		return;
	}

	for (let i = 0; i < musicVizState.bars.length; i += 1) {
		const bar = musicVizState.bars[i];
		const idleFlicker = isUiCollapsed
			? 0.014 + ((Math.sin(timestampMs * 0.006 + i * 0.9) + 1) / 2) * 0.08
			: 0;
		const targetLevel = EQ_MIN_LEVEL + idleFlicker;
		const prev = musicVizState.smoothedLevels[i] ?? EQ_MIN_LEVEL;
		const next = Math.max(targetLevel, prev - rollbackStep);
		musicVizState.smoothedLevels[i] = next;
		musicVizState.previousBandLevels[i] = 0;
		musicVizState.bandFloorLevels[i] = 0;
		musicVizState.bandPeakLevels[i] = 0;
		bar.style.setProperty("--level", `${next.toFixed(3)}`);
		bar.style.backgroundColor = isUiCollapsed ? "rgba(255, 255, 255, 1)" : "";
		bar.style.opacity = isUiCollapsed
			? "0.92"
			: `${Math.min(0.44, (0.1 + next * 0.34) * opacityMultiplier).toFixed(3)}`;
	}
}

function runMusicVisualizer(timestampMs) {
	const frameIntervalMs = getEqFrameIntervalMs();
	const shouldRender =
		!musicVizState.lastRenderTimeMs ||
		timestampMs - musicVizState.lastRenderTimeMs >= frameIntervalMs;
	if (shouldRender) {
		updateEqBars(timestampMs);
		musicVizState.lastRenderTimeMs = timestampMs;
	}
	musicVizState.rafId = window.requestAnimationFrame(runMusicVisualizer);
}

async function ensureMusicVisualizerReady() {
	if (!romanticAudio) return false;
	if (musicVizState.audioContext) return true;

	const AudioContextClass = window.AudioContext || window.webkitAudioContext;
	if (!AudioContextClass) return false;

	try {
		const audioContext = new AudioContextClass();
		const analyser = audioContext.createAnalyser();
		analyser.fftSize = getAnalyserFftSize();
		analyser.minDecibels = -108;
		analyser.maxDecibels = -12;
		analyser.smoothingTimeConstant = isCompactMobileViewport() ? 0.05 : 0.03;
		const sourceNode = audioContext.createMediaElementSource(romanticAudio);
		sourceNode.connect(analyser);
		analyser.connect(audioContext.destination);

		musicVizState.audioContext = audioContext;
		musicVizState.analyser = analyser;
		musicVizState.sourceNode = sourceNode;
		musicVizState.freqData = new Uint8Array(analyser.frequencyBinCount);
		musicVizState.timeData = new Uint8Array(analyser.fftSize);
		rebuildEqBandRanges();
		return true;
	} catch (error) {
		console.error("Не удалось инициализировать аудио-анализатор:", error);
		return false;
	}
}

async function resumeMusicContextIfNeeded() {
	if (!musicVizState.audioContext) return;
	if (musicVizState.audioContext.state !== "suspended") return;
	try {
		await musicVizState.audioContext.resume();
	} catch (error) {
		console.error("Не удалось возобновить AudioContext:", error);
	}
}

async function toggleMusicPlayback() {
	if (!romanticAudio) return;
	if (romanticAudio.paused) {
		await ensureMusicVisualizerReady();
		await resumeMusicContextIfNeeded();
		try {
			await romanticAudio.play();
		} catch (error) {
			console.error("Не удалось включить музыку:", error);
		}
		return;
	}
	romanticAudio.pause();
}

function initMusicPlayer() {
	if (!musicPlayer || !musicToggle || !romanticAudio) return;

	rebuildEqBars(getEqBarCountForViewport());
	if (!musicVizState.rafId) {
		musicVizState.rafId = window.requestAnimationFrame(runMusicVisualizer);
	}

	musicToggle.addEventListener("click", () => {
		void toggleMusicPlayback();
		musicToggle.blur();
		if (
			document.activeElement &&
			document.activeElement instanceof HTMLElement &&
			document.activeElement !== secretCodeInput
		) {
			document.activeElement.blur();
		}
	});

	romanticAudio.addEventListener("play", () => {
		void resumeMusicContextIfNeeded();
		setMusicPlayerState(true);
	});
	romanticAudio.addEventListener("pause", () => setMusicPlayerState(false));
	romanticAudio.addEventListener("ended", () => setMusicPlayerState(false));

	setMusicPlayerState(!romanticAudio.paused);
}

function setUiCollapsed(collapsed) {
	document.body.classList.toggle("ui-collapsed", collapsed);
	if (!uiCompactToggle) return;
	uiCompactToggle.textContent = collapsed ? "+" : "−";
	uiCompactToggle.setAttribute(
		"aria-label",
		collapsed ? "Показать интерфейс" : "Скрыть интерфейс",
	);
	uiCompactToggle.title = collapsed ? "Показать интерфейс" : "Скрыть интерфейс";
}

function initUiCompactToggle() {
	if (!uiCompactToggle) return;
	uiCompactToggle.addEventListener("click", () => {
		const isCollapsed = !document.body.classList.contains("ui-collapsed");
		setUiCollapsed(isCollapsed);
	});
	setUiCollapsed(false);
}

window.addEventListener("resize", () => {
	syncMobilePerformanceMode();
	state.maxActive = getMaxActiveCount();
	scheduleNoteScrollHintUpdate();
	if (musicVizState.analyser) {
		const targetFftSize = getAnalyserFftSize();
		if (musicVizState.analyser.fftSize !== targetFftSize) {
			musicVizState.analyser.fftSize = targetFftSize;
			musicVizState.freqData = new Uint8Array(
				musicVizState.analyser.frequencyBinCount,
			);
			musicVizState.timeData = new Uint8Array(musicVizState.analyser.fftSize);
			rebuildEqBandRanges();
		}
	}
	if (eqLane) {
		const expected = getEqBarCountForViewport();
		if (musicVizState.bars.length !== expected) {
			rebuildEqBars(expected);
		} else {
			rebuildEqBandRanges();
		}
	}
});

async function init() {
	syncMobilePerformanceMode();
	await loadMediaItems();
	primeMediaWarmups();
	startFloatingScene();
	initUiCompactToggle();
	initMusicPlayer();
	initMessageMenuButton();
	initSecretCodeUnlock();
	initNoteScrollHint();
}

init();
