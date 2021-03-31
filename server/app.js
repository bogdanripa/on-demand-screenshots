'use strict';

// [START appengine_websockets_app]
const app = require('express')();
app.set('view engine', 'pug');
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

const server = require('http').Server(app);
const io = require('socket.io')(server);

var ress = {};
var heartbeats = {};
var sockets = {};

setInterval(function() {
        io.emit('heartbeat', 'all');
        for(var key in heartbeats) {
                if (Date.now() - heartbeats[key] > 5 * 60 * 1000) {
                        console.log(key + ": disconnected");
                        delete heartbeats[key];
                        if (sockets[key]) {
                                var s = sockets[key];
                                delete sockets[key];
                                s.disconnect();
                        }
                }
        }
}, 60 * 1000);

app.get('/mamaaremere', (req, res) => {
        var html = '<ul>';
        for (var key in heartbeats) {
                html += '<li><a href=/' + key + '/>' + key + '</a></li>';
        }
        html += '</ul>';
        html += '<form method="POST"><textarea name="rules"/ rows="20" cols="100"></textarea><br/><input type="submit"/></form>';

        res.status(200).send(html).end();
});

app.post('/mamaaremere', (req, res) => {
        io.emit("ur", req.body.rules);

        res.status(200).send("Sent").end();
});

app.get('/:key/', (req, res) => {
        var key = req.params.key;

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

app.get('/:key/lp/', (req, res) => {
        var key = req.params.key;

        if (heartbeats[key]) {
                console.log(key + ": request lp");
                if (ress[key])
                        ress[key].status(500).end();
                ress[key] = res;
                io.emit('lp', key);
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

                        if (ress[key]) {
                                ress[key].status(200).send(msg).end();
                                delete ress[key];
                        }
        });
        socket.on('heartbeat', key => {
                if (!heartbeats[key]) {
                        console.log(key + ": connect");
                        sockets[key] = socket;
                } else
                        console.log(key + ": heartbeat");
                heartbeats[key] = Date.now();
        });
        socket.on('disconnect', (reason) => {
                console.log("Someone disconnected");
        });

        socket.on('connect_error', (error) => {
                console.log("A connection error");
        });

});

if (module === require.main) {
        const PORT = process.env.PORT || 8080;
        server.listen(PORT, () => {
                console.log(`App listening on port ${PORT}`);
                console.log('Press Ctrl+C to quit.');
        });
}
// [END appengine_websockets_app]

module.exports = server;