const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = 8000;
const HOST = "localhost";

const MIME_TYPES = {
	".html": "text/html; charset=utf-8",
	".css": "text/css",
	".js": "text/javascript",
	".json": "application/json",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".png": "image/png",
	".gif": "image/gif",
	".svg": "image/svg+xml",
	".mov": "video/quicktime",
	".mp4": "video/mp4",
	".webm": "video/webm",
	".txt": "text/plain",
};

const server = http.createServer((req, res) => {
	let filePath = "." + req.url;
	if (filePath === "./") filePath = "./index.html";

	const ext = path.extname(filePath).toLowerCase();
	const contentType = MIME_TYPES[ext] || "application/octet-stream";

	fs.readFile(filePath, (err, data) => {
		if (err) {
			res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
			res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>404</title>
        </head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>404 - Файл не найден</h1>
          <p>Запрашиваемый файл: ${req.url}</p>
          <a href="/">← Вернуться на главную</a>
        </body>
        </html>
      `);
			return;
		}

		res.writeHead(200, { "Content-Type": contentType });
		res.end(data);
	});
});

server.listen(PORT, HOST, () => {
	console.log("\n");
	console.log("╔════════════════════════════════════════════╗");
	console.log("║   💝 Веб-сервер запущен успешно! 💝      ║");
	console.log("╚════════════════════════════════════════════╝");
	console.log("\n");
	console.log("🌐 Откройте браузер и перейдите по адресу:");
	console.log("\n");
	console.log(`   👉 http://${HOST}:${PORT}`);
	console.log("\n");
	console.log("⏹️  Для остановки нажмите Ctrl+C");
	console.log("\n");
});
