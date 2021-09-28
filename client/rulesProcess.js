var spawn = require("child_process").spawn,child;
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
	rulesList.forEach(rule => {
		var pnRe = new RegExp(rule.trigger.ProcessName, 'i');
		var mwtRe = new RegExp(rule.trigger.MainWindowTitle, 'i');
		_desktopWindows.forEach(window => {
			if (window.ProcessName.match(pnRe)) {
				if (window.MainWindowTitle.match(mwtRe)) {
					// we have a trigger match
					processTargets(rule.targets, rule.action);
				}
			}
		});
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

listProcesses();
_pl = setInterval(listProcesses, 1000*30);

stopProcessList = function() {
	clearInterval(_pl)
}