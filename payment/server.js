const http = require("http");

const PORT = 3000;

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");

  if (req.url === "/payment") {
    res.writeHead(200);
    res.end(JSON.stringify({
      service: "payment-service",
      message: "Hello from Payment Backend",
      status: "success"
    }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({
    message: "Payment endpoint not found"
  }));
});

server.listen(PORT, () => {
  console.log(`Payment service running on port ${PORT}`);
});