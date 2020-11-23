'use strict';

const app = require('express')();
app.set('view engine', 'pug');

const server = require('http').Server(app);
const io = require('socket.io')(server);

var ress = {};
var heartbeats = {};

app.get('/:key/', (req, res) => {
        var key = req.params.key;
        if (heartbeats[key] && Date.now() - heartbeats[key] > 5 * 60 * 1000) {
                console.log(key + ": disconnected");
                delete heartbeats[key];
                res.status(404).end();
                return;
        }

        if (heartbeats[key]) {
                console.log(key + ": request ss");
                if (ress[key])
                        ress[key].status(500).end();

                ress[key] = res;
                io.emit('get', key);
        } else {
                console.log(key + ": bad client id");
                res.status(404).end();
        }
});

io.on('connection', socket => {
        socket.on('ss', msg => {
                  var idx = msg.search(" ");
                var key = msg.substring(0, idx);
                        msg = msg.substring(idx+1);

                        console.log(key + ": new ss");

                        ress[key].status(200).send(msg).end();
                        delete ress[key];
        });
        socket.on('heartbeat', key => {
                if (!heartbeats[key])
                        console.log(key + ": connect");
                heartbeats[key] = Date.now();
        });
});

if (module === require.main) {
        const PORT = process.env.PORT || 8080;
        server.listen(PORT, () => {
                console.log(`App listening on port ${PORT}`);
                console.log('Press Ctrl+C to quit.');
        });
}

module.exports = server;
