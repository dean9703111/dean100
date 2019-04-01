//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; 						//stream from getUserMedia()
var rec; 							//Recorder.js object
var input; 							//MediaStreamAudioSourceNode we'll be recording

// shim for AudioContext when it's not avb. 
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext //audio context to help us record

var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");
var recognition;
//add events to those 2 buttons
// recordButton.addEventListener("click", startRecording);
// stopButton.addEventListener("click", stopRecording);
var recordStatus = 'stop'
$(document).ready(function () {
	// 先詢問音訊
	// created()
	// 偵測磁場
	if (!('webkitSpeechRecognition' in window)) {
		upgrade();
	} else {
		recognition = new webkitSpeechRecognition();
	}
	let sensor = new Magnetometer();
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
		}
	};
	sensor.onerror = event => console.log(event.error.name, event.error.message);
});
var show = document.getElementById('show');
var finalPlace = document.getElementById('place');
function startDetect () {
	created()
	recognition.continuous = true;
	recognition.interimResults = true;
	recognition.lang = "cmn-Hant-TW";

	recognition.onstart = function () {
		console.log('開始辨識...');
	};


	recognition.onresult = function (event) {
		var i = event.resultIndex;
		var j = event.results[i].length - 1;
		var testCase = event.results[i][j].transcript;
		show.innerHTML = testCase
		if (testCase !== undefined) {
			
			var i = event.resultIndex;
			var j = event.results[i].length - 1;
			show.innerHTML = event.results[i][j].transcript;
			text = testCase
			console.log(text)
			let startIndex = text.indexOf("可以"),
				endIndex = text.indexOf("沒問題");
			if (startIndex !== -1 && endIndex !== -1) {
				let place = text.substring(startIndex, endIndex);
				finalPlace = place
				window.location.replace(
					`https://www.google.com.tw/maps/place/${place}`
				);
			}
		}
	};
	recognition.onend = function () {
		console.log('停止辨識!');
		window.location.replace(
			`https://www.google.com.tw/maps/place/台灣`
		);
	};
	recognition.start();
}

function created () {
	/*
		Simple constraints object, for more advanced audio features see
		https://addpipe.com/blog/audio-constraints-getusermedia/
	*/

	var constraints = { audio: true, video: false }

	/*
	  Disable the record button until we get a success or fail from getUserMedia() 
  */


	/*
    	We're using the standard promise based getUserMedia() 
    	https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
	*/
	if (navigator.getUserMedia) { }
	navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
		console.log("getUserMedia() success, stream created, initializing Recorder.js ...");

		/*
			create an audio context after getUserMedia is called
			sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
			the sampleRate defaults to the one set in your OS for your playback device

		*/
		// audioContext = new AudioContext();

		//update the format 
		// document.getElementById("formats").innerHTML = "Format: 1 channel pcm @ " + audioContext.sampleRate / 1000 + "kHz"

		/*  assign to gumStream for later use  */
		// gumStream = stream;

		/* use the stream */
		// input = audioContext.createMediaStreamSource(stream);

		/* 
			Create the Recorder object and configure to record mono sound (1 channel)
			Recording 2 channels  will double the file size
		*/
		// rec = new Recorder(input, { numChannels: 1 })
	}).catch(function (err) {
		//enable the record button if getUserMedia() fails
		// recordButton.disabled = false;
		// stopButton.disabled = true;
	});
}

function startRecording () {
	//start the recording process
	recordButton.disabled = true;
	stopButton.disabled = false;

	rec.record()

	console.log("Recording started");
}
var data = {
	audio: {
		content: null
	},
	config: {
		encoding: "LINEAR16",
		sampleRateHertz: 44100,
		languageCode: null
	}
}
var babysecret = ''
function stopRecording () {
	console.log("stopButton clicked");

	//disable the stop button, enable the record too allow for new recordings
	stopButton.disabled = true;
	recordButton.disabled = false;


	//tell the recorder to stop the recording
	rec.stop();

	//stop microphone access
	gumStream.getAudioTracks()[0].stop();

	//create the wav blob and pass it on to createDownloadLink
	// rec.exportWAV(createDownloadLink);
	rec.exportWAV(function (blob) {
		console.log('exportWAV音訊處理')
		var reader = new window.FileReader();
		reader.readAsDataURL(blob);
		reader.onloadend = () => {
			console.log('音訊處理')
			const baseData = reader.result;
			const base64Data = baseData.replace("data:audio/wav;base64,", "");
			data.audio.content = base64Data;
			data.config.languageCode = 'cmn-Hant-TW';
			console.log(data)
			$.post(
				`https://speech.googleapis.com/v1/speech:recognize?key=${
				babysecret
				}`,
				data
			)
				.then(response => {
					console.log(response)
					if (!_isEmpty(response.data)) {
						const result = response.data.results[0].alternatives[0];
						let textResult = result.transcript;

						let startIndex = textResult.indexOf("可以"),
							endIndex = textResult.indexOf("沒問題");

						let Place = textResult.substring(startIndex, endIndex);
						textResult = Place;
						alert(textResult)
						console.log(textResult)
						// window.location.replace(
						//   "https://www.google.com.tw/maps/place/"
						// );
					} else {
						alert("nodata")
						console.log("nodata");
						// window.location.replace(
						//   "https://www.google.com.tw/maps/place/"
						// );
					}
				})
				.catch(error => {
					console.log("ERROR:" + error);
				});
		};
	});
}

function createDownloadLink (blob) {

	var url = URL.createObjectURL(blob);
	var au = document.createElement('audio');
	var li = document.createElement('li');
	var link = document.createElement('a');

	//name of .wav file to use during upload and download (without extendion)
	var filename = new Date().toISOString();

	//add controls to the <audio> element
	au.controls = true;
	au.src = url;

	//save to disk link
	link.href = url;
	link.download = filename + ".wav"; //download forces the browser to donwload the file using the  filename
	link.innerHTML = "Save to disk";

	//add the new audio element to li
	li.appendChild(au);

	//add the filename to the li
	li.appendChild(document.createTextNode(filename + ".wav "))

	//add the save to disk link to li
	li.appendChild(link);

	//upload link
	var upload = document.createElement('a');
	upload.href = "#";
	upload.innerHTML = "Upload";
	upload.addEventListener("click", function (event) {
		var xhr = new XMLHttpRequest();
		xhr.onload = function (e) {
			if (this.readyState === 4) {
				console.log("Server returned: ", e.target.responseText);
			}
		};
		var fd = new FormData();
		fd.append("audio_data", blob, filename);
		xhr.open("POST", "upload.php", true);
		xhr.send(fd);
	})
	li.appendChild(document.createTextNode(" "))//add a space in between
	li.appendChild(upload)//add the upload link to li

	//add the li element to the ol
	recordingsList.appendChild(li);
}