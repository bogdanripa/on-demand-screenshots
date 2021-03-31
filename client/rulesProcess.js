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

function processTarget(target, action) {
	var pnRe = new RegExp(target.ProcessName, 'i');
	var mwtRe = new RegExp(target.MainWindowTitle, 'i');
	_desktopWindows.forEach(window => {
		if (window.ProcessName.match(pnRe)) {
			if (window.MainWindowTitle.match(mwtRe)) {
				// we have a target match
				switch(action) {
					case 'kill':
						killProcess(window.Id);
						break;
					default:
						log('Undefined action: ' + action);
				}
			}
		}
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
					processTarget(rule.target, rule.action);
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
	var child = spawn("powershell.exe",['Get-Process | Where-Object {$_.MainWindowTitle -ne ""} | Select-Object Id, ProcessName, MainWindowTitle | ConvertTo-Json'], {maxBuffer: 1024 * 1024 });
	child.stdout.on("data",function(data){
		try {
			data = (data + "").replace(/[^\s\d\w"'{}\(\)--\._\[\]<>\/=:]/g, ' ');
	    	_desktopWindows = JSON.parse(data);
	    	processRulesList();
	    } catch(e) {
	    	log("Error listing processes: " + e + "\n" + data);
	    }
	});
	child.stderr.on("data",function(data){
	    log("Powershell Errors: " + data);
	});
	child.stdin.end();
}

listProcesses();
setInterval(listProcesses, 1000*30);