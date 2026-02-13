const MEDIA_SOURCE = "./media.json";
const stage = document.getElementById("stage");
const uiCompactToggle = document.getElementById("ui-compact-toggle");
const openMessageMenu = document.getElementById("open-message-menu");
const secretPanel = document.getElementById("secret-panel");
const secretCodeInput = document.getElementById("secret-code-input");
const secretCodeSubmit = document.getElementById("secret-code-submit");
const secretCodeError = document.getElementById("secret-code-error");
const secretMessage = document.getElementById("secret-message");
const CARD_LIFETIME_MS = 10000;
const FADE_IN_MS = 2000;
const FADE_OUT_MS = 2000;
const SPAWN_DELAY_MIN_MS = 1420;
const SPAWN_DELAY_MAX_MS = 3060;
const PHOTO_REPEAT_COOLDOWN = 20;
const PLACEMENT_SAMPLES = 36;
const PLACEMENT_PADDING = 56;
const SECRET_CODE = "помню в саратове";

function getMaxActiveCount() {
	if (window.innerWidth <= 375) return 7;
	if (window.innerWidth < 800) return 10;
	return 14;
}

const state = {
	items: [],
	images: [],
	videos: [],
	activeCount: 0,
	maxActive: getMaxActiveCount(),
	zCounter: 10,
	placementCounter: 0,
	activePlacements: new Map(),
	recentPhotoQueue: [],
	recentPhotoCounts: new Map(),
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
	} catch (error) {
		console.error("Не удалось загрузить media.json:", error);
		state.items = [];
		state.images = [];
		state.videos = [];
	}
}

function randomBetween(min, max) {
	return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
	return Math.floor(randomBetween(min, max + 1));
}

function pickRandomVideoItem() {
	if (state.videos.length === 0) return null;
	return state.videos[randomInt(0, state.videos.length - 1)];
}

function pickRandomImageItem() {
	if (state.images.length === 0) return null;

	const availableImages = state.images.filter((image) => {
		return !state.recentPhotoCounts.has(image.url);
	});

	const source = availableImages.length > 0 ? availableImages : state.images;
	return source[randomInt(0, source.length - 1)];
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

function pickRandomItem() {
	const hasImages = state.images.length > 0;
	const hasVideos = state.videos.length > 0;

	if (hasImages && hasVideos) {
		return Math.random() < 0.82 ? pickRandomImageItem() : pickRandomVideoItem();
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
		return video;
	}
	const image = document.createElement("img");
	image.src = item.url;
	image.alt = item.name || "Наше фото";
	image.loading = "eager";
	image.decoding = "async";
	return image;
}

function buildFloatElement(item) {
	const tile = document.createElement("article");
	tile.className = "media-float";

	const size = Math.round(
		window.innerWidth <= 375
			? randomBetween(280, 420)
			: window.innerWidth < 800
				? randomBetween(450, 640)
				: randomBetween(620, 780),
	);
	const ratio = randomBetween(0.82, 1.24);
	const width = Math.max(120, Math.round(size * ratio));
	const height = size;

	tile.style.width = `${width}px`;
	tile.style.height = `${height}px`;
	state.zCounter += 1;
	tile.style.zIndex = `${state.zCounter}`;
	tile.style.filter = `saturate(${randomBetween(0.9, 1.2).toFixed(2)})`;

	const mediaNode = createMediaNode(item);
	tile.appendChild(mediaNode);

	return { tile, width, height };
}

function createPlacementRect(x, y, width, height) {
	return {
		x: x - PLACEMENT_PADDING,
		y: y - PLACEMENT_PADDING,
		width: width + PLACEMENT_PADDING * 2,
		height: height + PLACEMENT_PADDING * 2,
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
	for (let i = 0; i < PLACEMENT_SAMPLES; i += 1) {
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
	const startX = start.x;
	const startY = start.y;
	const endX = startX + randomBetween(-90, 90);
	const endY = startY + randomBetween(-80, 80);
	const swayX = randomBetween(-45, 45);
	const swayY = randomBetween(-40, 40);
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

function spawnFloatingItem() {
	if (state.items.length === 0) return;
	if (state.activeCount >= state.maxActive) return;

	const item = pickRandomItem();
	if (!item) return;
	if (item.type === "image") rememberImageShown(item);
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

	const keyframes = [
		{
			opacity: 0,
			transform: `translate3d(${path.startX}px, ${path.startY}px, 0) scale(${path.startScale}) rotate(${path.rotateStart}deg)`,
			filter: "blur(14px)",
		},
		{
			opacity: 0.42,
			transform: `translate3d(${path.startX + path.swayX * 0.28}px, ${path.startY + path.swayY * 0.28}px, 0) scale(${(path.startScale + path.midScale) / 2}) rotate(${(path.rotateStart + path.rotateMid) / 2}deg)`,
			filter: "blur(8px)",
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
			filter: "blur(12px)",
		},
	];

	const animation = tile.animate(keyframes, {
		duration,
		easing: profile.easing,
		fill: "forwards",
	});

	animation.onfinish = () => {
		tile.remove();
		state.activePlacements.delete(placementId);
		state.activeCount = Math.max(0, state.activeCount - 1);
	};
}

function startFloatingScene() {
	for (let i = 0; i < Math.min(3, state.maxActive); i += 1) {
		setTimeout(spawnFloatingItem, i * randomInt(260, 420));
	}

	const scheduler = () => {
		const delay = randomInt(SPAWN_DELAY_MIN_MS, SPAWN_DELAY_MAX_MS);
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

function openSecretMessage() {
	if (!secretMessage) return;
	secretMessage.hidden = false;
	secretMessage.classList.remove("is-open");
	// Force reflow so animation can replay when needed.
	void secretMessage.offsetWidth;
	secretMessage.classList.add("is-open");
}

function openSecretPanel() {
	if (!secretPanel) return;
	secretPanel.hidden = false;
	secretPanel.classList.remove("is-open");
	// Force reflow so animation can replay.
	void secretPanel.offsetWidth;
	secretPanel.classList.add("is-open");

	if (openMessageMenu) {
		openMessageMenu.hidden = true;
	}
	if (secretCodeInput) {
		secretCodeInput.focus();
	}
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
	state.maxActive = getMaxActiveCount();
});

async function init() {
	await loadMediaItems();
	startFloatingScene();
	initUiCompactToggle();
	initMessageMenuButton();
	initSecretCodeUnlock();
}

init();
