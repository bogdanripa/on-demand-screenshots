SOCKET_URL = "wss://ssproxy2-327407.ey.r.appspot.com/";
CALLBACK_URL = "https://maker.ifttt.com/trigger/Closed/with/key/bWKT4o3AQ19MMPkx_7yMUf?value1={what}&value2={app}&value3={where}";

var lastLog = '';
log = function(msg) {
	if (lastLog != msg) {
		console.log('[' + new Date().toUTCString() + '] ' + msg);
		lastLog = msg;
	}
}

require("./rulesProcess.js");
require("./client.js");
