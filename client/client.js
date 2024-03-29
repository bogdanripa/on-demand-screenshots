const io = require('socket.io-client');
const screenshot = require('screenshot-desktop')
const socket = io(SOCKET_URL, {
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

log("Init: " + id);

socket.on('connect', () => {
	log("Connected");

	heartbeat();
	if (hbTo) clearInterval(hbTo);
	hbTo = setInterval(heartbeat, 60 * 1000);

	startProcessList();
});

socket.on('disconnect', (reason) => {
	log("Disconnected: " + reason);
	if (hbTo) clearInterval(hbTo);
	stopProcessList();
	//socket.connect();
});

socket.on('connect_error', (error) => {
	log("Error: " + error);
	if (hbTo) clearInterval(hbTo);
	stopProcessList();
});

socket.on('get', (data) => {
	if(data == id) {
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

socket.on('lp', (data) => {
	if(data == id) {
		log("Process list requested");
		socket.emit('ss', data + ' ' + JSON.stringify(getDesktopWindows()));
	}
});

socket.on('ur', (data) => {
	log("Rules update requested");
	updateRules(data);
});

socket.on('heartbeat', (data) => {
	if (sHbTo) clearTimeout(sHbTo);
	sHbTo = setTimeout(function() {
		sHbTo = 0;
		log("No server heartbeat... disconnecting")
		stopProcessList();
		socket.close();
	}, 5 * 60 * 1000);
});