var recognition;

var recordStatus = 'stop'
var MagnetometerText = document.getElementById('MagnetometerValue');

$(document).ready(function () {
	// 先詢問音訊
	created()
	// 偵測磁場
	if (!('webkitSpeechRecognition' in window)) {
		upgrade();
	} else {
		recognition = new webkitSpeechRecognition();
		recognition.continuous = true;
		recognition.interimResults = true;
	}
	// startDetect()
	let sensor = new Magnetometer({ frequency: 10 });
	let sensorValue = 0;
	sensor.start();
	sensor.onreading = () => {
		sensorValue = Math.round(Math.abs(sensor.x) + Math.abs(sensor.y) + Math.abs(sensor.z))
		MagnetometerText.innerHTML = sensorValue
		if (sensorValue > 200 && recordStatus === 'stop') {
			recordStatus = 'start'
			console.log('開始錄音')
			startDetect()
		}
		if (sensorValue < 200 && recordStatus === 'start') {
			clearPage()
			recordStatus = 'end'
			console.log('結束錄音')
			//如果這個時候還沒有導向地圖，那基本沒救惹，直接導到自爆ㄅ
			window.location.replace(
				`https://www.google.com.tw/maps/place/台灣`
			);
			goGoogle() 
		}
	};
	sensor.onerror = event => console.log(event.error.name, event.error.message);
});
var show = document.getElementById('show');
var finalPlace = document.getElementById('place');
var preTimestamp;
function startDetect () {
	//目前實測重新紀錄的時間大概是3~5秒，但是只要持續收音，時間就會一直跑
	//實際表演，就是用講幹話做開場（最多兩句話），然後開始說關鍵字
	console.log('startDetect')

	recognition.lang = $('input[name=lanSelect]:checked').val();

	recognition.onstart = function () {
		preTimestamp = Date.now()
		console.log('開始辨識...');
		if ($('input.vibrate').is(':checked')) {
			console.log('震動')
			window.navigator.vibrate(150);
			window.navigator.vibrate(0)
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
				clearPage()
				window.location.replace(
					`https://www.google.com.tw/maps/${mapSelect}/${place}`
				);
				goGoogle() 
			}
		}
	};
	recognition.onend = function () {
		console.log('重開辨識!');
		console.log((Date.now() - preTimestamp) / 1000)
		recognition.start();
	};
	recognition.start();
}

function created () {
	var constraints = { audio: true, video: false }
	if (navigator.getUserMedia) { }
	navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
		console.log("getUserMedia() success, stream created, initializing Recorder.js ...");
	}).catch(function (err) {
		console.log(err)
	});
}


function copyFlag () {
	var copyText = document.getElementById("chromeFlag");
	copyText.select();
	document.execCommand("copy");

	var tooltip = document.getElementById("myTooltip");
	tooltip.innerHTML = "Copied "
}

function testMap () {
	clearPage()
	window.location.replace(
		`https://www.google.com.tw/maps/place/台灣`
	)
	goGoogle() 
}
function goGoogle () {
	setTimeout(function () {//如果是會彈窗的googlemap，讓瀏覽器導向到google
		window.location.replace(
			`https://www.google.com.tw`
		);
	}, 3000)

}
function clearPage(){
	window.history.pushState(null, null, "");
	$("body").css("display","none");
}