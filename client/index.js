const io = require('socket.io-client');
const screenshot = require('screenshot-desktop')
const socket = io("wss://YOUR-APP-DETAILS.appspot.com/", {
  reconnectionDelayMax: 1000
});
const os = require('os');
const resizeImg = require('resize-img');

const id = os.hostname().replace(/[^a-z0-9]/ig, '-');
console.log("Init: " + id);

var sHbTo = 0;
var hbTo = 0;
function heartbeat() {
	socket.emit('heartbeat', id);
}

socket.on('connect', () => {
	console.log("Connected");

	heartbeat();
	if (hbTo) clearInterval(hbTo);
	setInterval(heartbeat, 60 * 1000);
});

socket.on('disconnect', (reason) => {
	console.log("Disconnected: " + reason);
	if (hbTo) clearInterval(hbTo);
	socket.connect();
});

socket.on('connect_error', (error) => {
	console.log("Error: " + error);
	if (hbTo) clearInterval(hbTo);
	socket.connect();
});

socket.on('get', (data) => {
	if (data == id) {
		console.log("Screenshot requested");
		screenshot().then((img) => {
			resizeImg(img, {width: 1024}).then((img) => {
				var base64data = Buffer.from(img).toString('base64');
				socket.emit('ss', data + ' <img src="data:image/png;base64,' + base64data + '" width="100%"/>');
			});
		}).catch((error) => {
			console.log("Screenshot error: " + error);
		});
	}
});

socket.on('heartbeat', (data) => {
	console.log("Server heartbeat")
	if (sHbTo) clearTimeout(sHbTo);
	sHbTo = setTimeout(function() {
		console.log("No server heartbeat... disconnecting")
		sHbTo = 0;
		socket.close();
	}, 5 * 60 * 1000);
});