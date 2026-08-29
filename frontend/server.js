const http = require("http");
const fs = require("fs");

const PORT = 3000;

const server = http.createServer((req, res) => {

  if (req.url === "/" || req.url === "/index.html") {

    const html = fs.readFileSync("index.html");

    res.writeHead(200, {
      "Content-Type": "text/html"
    });

    res.end(html);

    return;
  }

  res.writeHead(404);
  res.end("Frontend route not found");
});

server.listen(PORT, () => {
  console.log(`Frontend running on port ${PORT}`);
});