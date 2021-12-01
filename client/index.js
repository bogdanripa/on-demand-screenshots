SOCKET_URL = "wss://YOUR-APP.appspot.com/";
CALLBACK_URL = "https://maker.ifttt.com/trigger/Closed/with/key/YOUR-KEY?value1={what}&value2={app}&value3={where}";

var lastLog = '';
log = function(msg) {
	if (lastLog != msg) {
		console.log('[' + new Date().toUTCString() + '] ' + msg);
		lastLog = msg;
	}
}

require("./rulesProcess.js");
require("./client.js");
