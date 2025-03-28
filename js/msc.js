    
    // REFERENCED FROM MEDIUM: https://medium.com/js-bytes/how-to-keep-your-screen-awake-using-javascript-aa15775d9bff

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

function hardReload() {
    event.stopPropagation();

    if (videoControls.classList.contains('visible')) {

        $.ajax({
            // url: window.location.pathname + "?refresh=" + new Date().getTime(),
            url : window.location.href + "?nocache=" + new Date().getTime(),
            headers: {
                "Pragma": "no-cache",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Expires": "0"
            }
        }).done(function () {
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

