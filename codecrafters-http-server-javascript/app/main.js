const net = require('net');
const fs = require('fs');
const server = net.createServer((socket) => {
    socket.on('close', () => {
        socket.end();
        server.close();
    });
    socket.on('data', (req) => {
        req = req.toString('utf-8');
        req = parseReq(req);
        let res = 'HTTP/1.1 ';
        const path = req.path.split('/');
        if (req.method == 'GET') {
            if (req.path == '/') {
                res += '200 OK\r\n\r\n';
            } else {
                if (path[1] == 'echo') {
                    res += '200 OK\r\nContent-Type: text/plain\r\n';
                    const random = path.slice(2).join('/');
                    res += `Content-Length: ${random.length}\r\n\r\n${random}`;
                } else if (path[1] == 'user-agent') {
                    res += `200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${req.data.length}\r\n\r\n${req.data}`;
                } else if (path[1] == 'files') {
                    const file = path[2];
                    const dir = process.argv[3];
                    const files = fs.readdirSync(dir);
                    if (!files.includes(file)) {
                        res += '404 Not Found\r\n\r\n';
                    } else {
                        const text = fs.readFileSync(`${dir}/${file}`, 'utf-8');
                        res += `200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${text.length}\r\n\r\n${text}`;
                    }
                } else {
                    res += '404 Not Found\r\n\r\n';
                }
            }
        } else if (req.method == 'POST') {
            if (path[1] == 'files') {
                const file = path[2];
                const dir = process.argv[3];
                fs.writeFileSync(`${dir}/${file}`, req.body);
                res += '201 OK\r\n\r\n';
            }
        } else {
            res += '404 Not Found\r\n\r\n';
        }
        socket.write(res);
        socket.end();
    });
});
const parseReq = (req) => {
    const [f, , t, , , , body] = req.split('\r\n');
    const [method, path] = f.split(' ');
    const data = t.split(': ')[1];
    return { method, path, data, body };
};

server.listen(4221, 'localhost');