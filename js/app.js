var recognition;

var recordStatus = 'stop'
$(document).ready(function () {
	// 先詢問音訊
	created()
	// 偵測磁場
	if (!('webkitSpeechRecognition' in window)) {
		upgrade();
	} else {
		recognition = new webkitSpeechRecognition();
	}
	// startDetect()
	let sensor = new Magnetometer({frequency: 10});
	let sensorValue = 0;
	sensor.start();
	sensor.onreading = () => {
		sensorValue = Math.round(Math.abs(sensor.x) + Math.abs(sensor.y) + Math.abs(sensor.z))
		if (sensorValue > 200 && recordStatus === 'stop') {
			recordStatus = 'start'
			console.log('開始錄音')
			startDetect()
		}
		if (sensorValue < 200 && recordStatus === 'start') {
			recordStatus = 'end'
			console.log('結束錄音')
			//如果這個時候還沒有導向地圖，那基本沒救惹，直接導到自爆ㄅ
			window.location.replace(
				`https://www.google.com.tw/maps/place/台灣`
			);
		}
	};
	sensor.onerror = event => console.log(event.error.name, event.error.message);
});
var show = document.getElementById('show');
var finalPlace = document.getElementById('place');
function startDetect() {
	console.log('startDetect')
	recognition.continuous = true;
	recognition.interimResults = true;
	recognition.lang = "cmn-Hant-TW";

	recognition.onstart = function () {
		console.log('開始辨識...');
		if ($('.vibrate').is(':checked')) {
			window.navigator.vibrate(150); 
		}
	};


	recognition.onresult = function (event) {
		var i = event.resultIndex;
		var j = event.results[i].length - 1;
		var testCase = event.results[i][j].transcript;
		show.innerHTML = testCase
		if (testCase !== undefined) {
			text = testCase
			console.log(text)
			//可以用的開頭結尾
			let startArray = ['可以', '很好', '好', '以', '號', 'curry']
			let endArray = ['沒問題', '美問題', '很可以', 'OK', '跟我想的一樣', '沒問', '跟我']
			let startIndex = -1, endIndex = -1;
			for (var i = 0; i < 4; i++) {
				if (text.indexOf(startArray[i]) !== -1) {//如果符合就算當下位置+開頭長度
					startIndex = text.indexOf(startArray[i]) + startArray[i].length
				}
			}
			for (var i = 0; i < 6; i++) {
				if (text.indexOf(endArray[i]) !== -1) {//如果符合就算當下位置
					endIndex = text.indexOf(endArray[i])
				}
			}
			if (startIndex !== -1 && endIndex !== -1) {
				let place = text.substring(startIndex, endIndex);
				finalPlace = place
				let mapSelect = $('input[name=mapSelect]:checked').val()
				window.location.replace(
					`https://www.google.com.tw/maps/${mapSelect}/${place}`
				);
			}
		}
	};
	recognition.onend = function () {
		console.log('重開辨識!');
		recognition.start();
	};
	recognition.start();
}

function created() {
	var constraints = { audio: true, video: false }
	if (navigator.getUserMedia) { }
	navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
		console.log("getUserMedia() success, stream created, initializing Recorder.js ...");
	}).catch(function (err) {
		console.log(err)
	});
}


function copyFlag() {
	var copyText = document.getElementById("chromeFlag");
	copyText.select();
	document.execCommand("copy");

	var tooltip = document.getElementById("myTooltip");
	tooltip.innerHTML = "Copied "
}