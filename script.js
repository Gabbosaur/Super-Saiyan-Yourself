const URL = 'https://teachablemachine.withgoogle.com/models/p-FDPxask/';
let model, webcam, ctx, labelContainer, maxPredictions;

let audio_bg = new Audio("/audio/dbzssj3.mp3")
let audio_is = new Audio("/audio/initial-stance.mp3");
let audio_ab = new Audio("/audio/auraburst.mp3");
audio_is.loop = false;
audio_ab.loop = false;

let flag_neutral = true;
let flag_initial_pose = null;
let flag_border_reset = null;
// let flag_aura_burst = false;

function playOnce(audio) {
    // audio.load();
    audio.volume = 1;
    audio.play();
}

function playBGAudio(audio) {
    // audio.load();
    audio.volume = .3;
    audio.play();
}

function stopBGAudio(audio) {
    audio.pause();
}

function fadeAudio(sound) {
    // Set the point in playback that fadeout begins. This is for a 2 second fade out.
    var fadePoint = sound.duration - 2;

    var fadeAudio = setInterval(function () {

        // Only fade if past the fade out point or not at zero already
        if ((sound.currentTime >= fadePoint) && (sound.volume > 0.1)) {
            sound.volume -= 0.1; // It seems the substraction isn't functioning as expected.
            // console.log("ENTRA NEL IF con: ", sound.volume);
        }
        // When volume at zero stop all the intervalling
        if (sound.volume === 0.0) {
            clearInterval(fadeAudio);
        }
    }, 200);

}

async function init() {
    // const modelURL = URL + 'model.json';
    // const metadataURL = URL + 'metadata.json';
    const modelURL = './model.json';
    const metadataURL = './metadata.json';

    width = 500;
    height = 500;

    // load the model and metadata
    // Refer to tmPose.loadFromFiles() in the API to support files from a file picker
    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Convenience function to setup a webcam
    const flip = true; // whether to flip the webcam
    webcam = new tmPose.Webcam(width, height, flip); // width, height, flip
    await webcam.setup(); // request access to the webcam
    webcam.play();
    window.requestAnimationFrame(loop);

    // append/get elements to the DOM
    const canvas = document.getElementById('canvas');
    canvas.width = width; canvas.height = height;
    ctx = canvas.getContext('2d');
    labelContainer = document.getElementById('label-container');
    for (let i = 0; i < maxPredictions; i++) { // and class labels
        labelContainer.appendChild(document.createElement('div'));
    }
}

async function loop(timestamp) {
    webcam.update(); // update the webcam frame
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    // Prediction #1: run input through posenet
    // estimatePose can take in an image, video or canvas html element
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    // Prediction 2: run input through teachable machine classification model
    const prediction = await model.predict(posenetOutput);

    if (checkKeypointVisibility(pose)) {
        playBGAudio(audio_bg);

        for (let i = 0; i < maxPredictions; i++) {
            const classPrediction =
                prediction[i].className + ': ' + prediction[i].probability.toFixed(2);
            labelContainer.childNodes[i].innerHTML = classPrediction;

            if (prediction[0].probability > 0.95) {
                flag_initial_pose = false;
                flag_neutral = true;
                flag_border_reset = true;
                toggleAuraOff();
                deleteShake();
            }
            if (flag_neutral == true && prediction[1].probability > 0.95) {
                playOnce(audio_is);
                flag_initial_pose = true;
                flag_neutral = false;
                switchAuraLevel(2);
            }

            if (flag_initial_pose == true && prediction[2].probability > 0.95) {
                playOnce(audio_ab);
                toggleAuraOn();
                activateShake();
                console.log("SUPER SAIYAN");

                flag_initial_pose = false;
                flag_border_reset = false;
                // draw yellow border
                setBorder("5px solid yellow");
                fadeAudio(audio_ab);

            }
        }
    }

    // finally draw the poses
    drawPose(pose);

}

function drawPose(pose) {
    ctx.drawImage(webcam.canvas, 0, 0);
    // draw the keypoints and skeleton
    if (pose) {
        const minPartConfidence = 0.5;
        tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
        tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
    }
}

function checkKeypointVisibility(pose) {
    let selectedBodyParts = [0, 1, 2, 5, 6, 7, 8, 9, 10, 11, 12];
    let flag = false;
    if (typeof pose === "undefined") {
        console.log("il primo loop è undefined.");
        return false;
    }

    for (let i = 0; i < selectedBodyParts.length; i++) {

        if (pose.keypoints[i].score < 0.6) {
            // console.log("move further");
            // draw red border
            if (flag_border_reset) {
                setBorder("5px solid red");
            }

            flag = false;
        } else {
            // console.log("ok:", pose.keypoints[i].part);
            // draw green border
            if (flag_border_reset) {
                setBorder("5px solid rgb(0,230,0");
            }

            flag = true;
        }

    }

    return flag;

}

function setBorder(color) {
    for (let i = 0; i < document.getElementsByClassName("center").length; i++) {
        var el = document.getElementsByClassName("center")[i];
        el.style.border = color;
    }
}

function toggleAuraOn() {
    var off = document.getElementById('toggleAura');
    off.style.display = "block";
    switchAuraLevel(3);
}

function switchAuraLevel(level) {
    // aura level 1 to 3
    document.getElementsByClassName('aurabox')[0].style.animation = "pulse"+level+" 1.5s ease-in-out infinite";
}

function toggleAuraOff() {
    var off = document.getElementById('toggleAura');
    off.style.display = "none";
    switchAuraLevel(1);
}


function activateShake() {
    var x = document.querySelector("h1");
    x.setAttribute("id", "shake");
    // var y = document.querySelector("div");
    // y.setAttribute("id", "shake");
}

function deleteShake() {
    document.querySelector("h1").removeAttribute("id");
    // document.querySelector("div").removeAttribute("id");
}



// function playAudio(x) {
//     var audio = new Audio(x);
//     audio.load();
//     audio.play();
// }

// function pauseAudio(x) {
//     x.pause();
// }