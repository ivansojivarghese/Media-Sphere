    
// REFERENCED FROM MEDIUM: https://medium.com/js-bytes/how-to-keep-your-screen-awake-using-javascript-aa15775d9bff

var liveSfr = 0;
var liveCPU = 0;
var livePerformance = 0;

let screenLock;

function isScreenLockSupported() {
    return ('wakeLock' in navigator);
}

async function getScreenLock() {
    if (isScreenLockSupported()){
        // let screenLock;
        try {
            screenLock = await navigator.wakeLock.request('screen');
        } catch(err) {
            console.log(err.name, err.message);
        }
        // return screenLock;
    }
}

async function releaseScreenLock(screenLock) {
    await screenLock.release().then(() => {
        screenLock = null;
    });
}

// getScreenLock();

function mean(ar) {
    var res = 0;
    for (i = 0; i <= ar.length - 1; i++) {
        res += ar[i];
    }
    return (res / ar.length);
}

function pL() { // site parameters loop
    if (!op.iPef && op.pSpd && op.sfr && op.pCores) { // capture initial device performance value, to be used as reference
        op.iPef = devicePerformance(op.pSpd, op.sfr, op.pCores);
        op.pSpdL = op.pSpda.length;
        op.pSpda = [];
    } else if (!op.getPefCon) { // get (live) subsequent frame-rate/CPU usage values every 3 sec.
        op.getPefCon = true;
        setTimeout(function() {
            op.getPefCon = false;
        }, (3000));
        if (op.getPef) {
            op.getPef();
        }
    }
    liveSfr = mean(op.sfra.slice(-1 * (3000))), // get screen refresh rates from last 3 seconds (mean)
    liveCPU = mean(op.pSpda.slice(-5)), // get live CPU usage values (previous 5)
    livePerformance = devicePerformance(liveCPU, liveSfr, op.pCores);
}

function devicePerformance(p, r, c) { // estimate device performance using parameters

    var pScore = (p >= op.pMin[0]) ? ((((p - op.pMin[0]) / (op.pMin[1] - op.pMin[0])) * 100) + 1) : 0, // performance score 
        rScore = (r >= op.sfrMin[0]) ? ((((r - op.sfrMin[0]) / (op.sfrMin[1] - op.sfrMin[0])) * 100) + 1) : 0, // screen refresh rate score
        cScore = (c >= op.pCoresMin[0]) ? ((((c - op.pCoresMin[0]) / (op.pCoresMin[1] - op.pCoresMin[0])) * 100) + 1) : 0; // logic cores score

    if (pScore > 100) {
        pScore = 0.6;
    } else if (pScore > 0) {
        pScore = (pScore / 100) * 0.6; // 60%
    } else {
        pScore = -1;
    }
    if (rScore > 100) {
        rScore = 0.3;
    } else if (rScore > 0) {
        rScore = (rScore / 100) * 0.3; // 30%
    } else {
        rScore = -1;
    }
    if (cScore > 100) {
        cScore = 0.1;
    } else if (cScore > 0) {
        cScore = (cScore / 100) * 0.1; // 10%
    } else {
        cScore = -1;
    }
    
    // MINS
    // 60% 1. p >= 8 GHZ
    // 30% 2. r >= 50 fps
    // 10% 3. c >= 2 cores
    // RECS
    // 60% 1. p >= 15 GHZ
    // 30% 2. r >= 60 fps
    // 10% 3. c >= 6 cores

    if (pScore !== -1 && rScore !== -1 && cScore !== -1) {
        return (pScore + rScore + cScore);
    } else {
        return 0;
    }
}

function hardReload() {
    event.stopPropagation();

    if (videoControls.classList.contains('visible')) {

        $.ajax({
            // url: window.location.pathname + "?refresh=" + new Date().getTime(),
            // url : window.location.href + "?nocache=" + new Date().getTime(),
            url :  window.location.href,
            headers: {
                "Pragma": "no-cache",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Expires": "0"
            }
        }).done(function () {
            if ('caches' in window) {
                caches.keys().then(names => {
                  names.forEach(name => caches.delete(name));
                });
            }
            window.location.reload(true);
        });

    }
}

const PROJECT_ID = "prj_zWXe0vOldJ8rnwrhBTxKawnXXBKU";
const TOKEN = "QtRRZQY0PY6caQhxwUAiXzVy";
const API_URL = `https://api.vercel.com/v6/deployments?projectId=${PROJECT_ID}`;

let lastDeployment = null;

const updateBtn = document.querySelector("#updateBtn");

async function checkNewDeployment() {
    try {
        const response = await fetch(API_URL, {
            headers: { Authorization: `Bearer ${TOKEN}` }
        });
        const data = await response.json();
        if (data.deployments && data.deployments.length > 0) {
            const latestDeployment = data.deployments[0];
            if (!lastDeployment) {
                lastDeployment = latestDeployment.uid;
                return;
            }
            if (latestDeployment.uid !== lastDeployment) {
                console.log("New deployment detected!");
                // window.location.reload(); // Reload to get the latest version
                updateBtn.style.display = "block";
                showVideoControls();
            }
        }
    } catch (error) {
        console.error("Error checking for new deployment:", error);
    }
}

// Poll every 30 seconds
setInterval(checkNewDeployment, 30000);

// op.L = setInterval(pL, 1000/60); 
