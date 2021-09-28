SOCKET_URL = "wss://YOUR-APP.appspot.com/";

var lastLog = '';
log = function(msg) {
	if (lastLog != msg) {
		console.log('[' + new Date().toUTCString() + '] ' + msg);
		lastLog = msg;
	}
}

require("./rulesProcess.js");
require("./client.js");
