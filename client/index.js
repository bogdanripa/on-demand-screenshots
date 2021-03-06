const io = require('socket.io-client');
const screenshot = require('screenshot-desktop')
const socket = io("wss://YOUR-APP-DETAILS.appspot.com/", {
	reconnectionDelayMax: 1000
});
const os = require('os');
const resizeImg = require('resize-img');

const id = os.hostname().replace(/[^a-z0-9]/ig, '-');

var sHbTo = 0;
var hbTo = 0;
function heartbeat() {
	socket.emit('heartbeat', id);
}

function log(msg) {
	console.log('[' + new Date().toUTCString() + '] ' + msg);
}

log("Init: " + id);

socket.on('connect', () => {
	log("Connected");

	heartbeat();
	if (hbTo) clearInterval(hbTo);
	hbTo = setInterval(heartbeat, 60 * 1000);
});

socket.on('disconnect', (reason) => {
	log("Disconnected: " + reason);
	if (hbTo) clearInterval(hbTo);
	//socket.connect();
});

socket.on('connect_error', (error) => {
	log("Error: " + error);
	if (hbTo) clearInterval(hbTo);
	//socket.connect();
});

socket.on('get', (data) => {
	if (data == id) {
		log("Screenshot requested");
		screenshot().then((img) => {
			resizeImg(img, {width: 1024}).then((img) => {
				var base64data = Buffer.from(img).toString('base64');
				socket.emit('ss', data + ' <img src="data:image/png;base64,' + base64data + '" width="100%"/>');
			});
		}).catch((error) => {
			log("Screenshot error: " + error);
		});
	}
});

socket.on('heartbeat', (data) => {
	log("Server heartbeat")
	if (sHbTo) clearTimeout(sHbTo);
	sHbTo = setTimeout(function() {
		log("No server heartbeat... disconnecting")
		sHbTo = 0;
		socket.close();
	}, 5 * 60 * 1000);
});