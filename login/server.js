const http = require("http");

const PORT = 3000;

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");

  if (req.url === "/login") {
    res.writeHead(200);
    res.end(JSON.stringify({
      service: "login-service",
      message: "Hello from Login Backend",
      status: "success"
    }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({
    message: "Login endpoint not found"
  }));
});

server.listen(PORT, () => {
  console.log(`Login service running on port ${PORT}`);
});