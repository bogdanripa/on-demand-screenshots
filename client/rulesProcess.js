const os = require('os');
const spawn = require("child_process").spawn;
const https = require('https');

var rulesList = require('./rulesList.json');
var _desktopWindows = [];

updateRules = function(newRulesTxt) {
	try {
		rulesList = JSON.parse(newRulesTxt);
		var fs = require('fs');
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

function processTargets(targets, action) {
	targets.forEach(target => {
		var pnRe = new RegExp(target.ProcessName, 'i');
		var mwtRe = new RegExp(target.MainWindowTitle, 'i');
		_desktopWindows.forEach(window => {
			if (window.ProcessName.match(pnRe)) {
				if (window.MainWindowTitle.match(mwtRe)) {
					// we have a target match

					var url = CALLBACK_URL;
					url = url.replace('{what}', encodeURIComponent(action));
					url = url.replace('{app}', encodeURIComponent(target.ProcessName + " " + target.MainWindowTitle));
					url = url.replace('{where}', encodeURIComponent(os.hostname()));
					https.get(url);

					switch(action) {
						case 'kill':
							log("Killing " + target.ProcessName + " / " + target.MainWindowTitle);
							killProcess(window.Id);
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
					if (window.ProcessName.match(pnRe)) {
						if (window.MainWindowTitle.match(mwtRe)) {
							// we have a trigger match
							processTargets(rulesList.targets[rule.target], rule.action);
						}
					}
				});
				break;
			case 'time':
				var h = new Date().getHours();
				if (h < rule.trigger.startHour || h >= rule.trigger.endHour) {
					processTargets(rulesList.targets[rule.target], rule.action);
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
	var child = spawn("powershell.exe",['Get-Process | Where-Object {$_.MainWindowTitle -ne ""} | Select-Object Id, ProcessName, MainWindowTitle | ConvertTo-Json']);
	child.stdout.on("data",function(data){
		try {
			data = (data + "").replace(/[^\s\d\w":,\[\]{}]/g, ' ');
			data = data.replace(/":\s+".*"(,?)$/mg, function(match, contents, offset, input_string) {
					match = match.replace(/",?$/, '');
					match = match.replace(/^":\s+"/, '');
			        return '": "' + match.replace(/"/g, ' ') + '"' + contents;
			    }
			);

	    	concatenatedText += data;
	    	_desktopWindows = JSON.parse(concatenatedText);
	    	processRulesList();
	    } catch(e) {
	    	if (!(e + "").includes('SyntaxError'))
	    		log("Error listing processes: " + e);

			var fs = require('fs');
			fs.writeFile('./dataError'+(cnt++)+'.json', data, function (err) {
				if (err)
					log("Error writing json: " + err);
			});
	    }
	});
	child.stderr.on("data",function(data){
	    log("Powershell Errors: " + data);
	});
	child.stdin.end();
}

_pl = 0;

stopProcessList = function() {
	clearInterval(_pl);
	_pl = 0;
}

startProcessList = function() {
	if (!_pl) {
		_pl = setInterval(listProcesses, 1000*5);
		listProcesses();
	}
}

startProcessList();