"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const port = normalizePort(process.env.PORT || 3000);
server_1.default.set('port', port);
console.log(`Server listening on port ${port}`);
const server = server_1.default;
server.listen(port);
function normalizePort(val) {
    const portNumber = typeof val === 'string' ? parseInt(val, 10) : val;
    if (isNaN(portNumber))
        return val;
    else if (portNumber >= 0)
        return portNumber;
    else
        return false;
}
//# sourceMappingURL=index.js.map