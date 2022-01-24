const os = require('os');
const spawn = require("child_process").spawn;
const { listOpenWindows } = require('@josephuspaye/list-open-windows');
const https = require('https');
const fs = require('fs');

var rulesList = require('./rulesList.json');
var _desktopWindows = [];

updateRules = function(newRulesTxt) {
	try {
		rulesList = JSON.parse(newRulesTxt);
		fs.writeFile('./rulesList.json', newRulesTxt, function (err) {
			if (err) throw err;
		});
	} catch(e) {
		log("Error writing new rules: " + e)
	}
}

getDesktopWindows = function() {
	return _desktopWindows;
}

function targetsRunning(targets) {
	var found = false;
	targets.forEach(target => {
		var pnRe = new RegExp(target.ProcessName, 'i');
		var mwtRe = new RegExp(target.MainWindowTitle, 'i');
		_desktopWindows.forEach(window => {
			if (window.processPath.match(pnRe)) {
				if (window.caption.match(mwtRe)) {
					 found = true;
				}
			}
		});
	});
	return found;
}


function processTargets(targets, action) {
	targets.forEach(target => {
		var pnRe = new RegExp(target.ProcessName, 'i');
		var mwtRe = new RegExp(target.MainWindowTitle, 'i');
		_desktopWindows.forEach(window => {
			if (window.processPath.match(pnRe)) {
				if (window.caption.match(mwtRe)) {
					// we have a target match

					var url = CALLBACK_URL;
					url = url.replace('{what}', encodeURIComponent(action));
					url = url.replace('{app}', encodeURIComponent(target.ProcessName + " " + target.MainWindowTitle));
					url = url.replace('{where}', encodeURIComponent(os.hostname()));
					https.get(url);

					switch(action) {
						case 'kill':
							log("Killing " + target.ProcessName + " / " + target.MainWindowTitle);
							killProcess(window.processId);
							break;
						default:
							log('Undefined action: ' + action);
					}
				}
			}
		});
	});
}

function processRulesList() {
	rulesList.rules.forEach(rule => {
		switch(rule.trigger.type) {
			case 'process':
				var pnRe = new RegExp(rule.trigger.ProcessName, 'i');
				var mwtRe = new RegExp(rule.trigger.MainWindowTitle, 'i');
				_desktopWindows.forEach(window => {
					if (window.processPath.match(pnRe)) {
						if (window.caption.match(mwtRe)) {
							// we have a trigger match
							processTargets(rulesList.targets[rule.target], rule.action);
						}
					}
				});
				break;
			case 'interval':
				var h = new Date().getHours();
				if (h >= rule.trigger.endHour || h < rule.trigger.startHour) {
					processTargets(rulesList.targets[rule.target], rule.action);
				}
				break;
			case 'time':
				if (targetsRunning(rulesList.targets[rule.target])) {
					if (addTime()/60 >= rule.trigger.minutes) {
						processTargets(rulesList.targets[rule.target], rule.action);
					}
				}
				break;
		}
	});
}

function killProcess(id) {
	var child = spawn("powershell.exe",["Stop-Process -Id " + id]);
	child.stderr.on("data",function(data){
	    log("Powershell Errors: " + data);
	});
	child.stdin.end();
}

function listProcesses() {
	var concatenatedText = '';
	var cnt = 0;
	_desktopWindows = listOpenWindows();
	processRulesList();
}

_pl = 0;

stopProcessList = function() {
	clearInterval(_pl);
	_pl = 0;
}

REFRESH_RATE = 5;
startProcessList = function() {
	if (!_pl) {
		_pl = setInterval(listProcesses, 1000 * REFRESH_RATE);
		listProcesses();
	}
}

startProcessList();

addTime = function() {

	var timeJson;
	try {
		timeJson = JSON.parse(fs.readFileSync('time.json'));
	} catch(e) {
		timeJson = {date:'', time:0};
	}

	var today = new Date().toISOString().slice(0, 10);
	if (timeJson.date != today) {
		timeJson.date = today;
		timeJson.time = 0;
	}
	timeJson.time += REFRESH_RATE;

	fs.writeFileSync('time.json', JSON.stringify(timeJson));

	return timeJson.time;
}
