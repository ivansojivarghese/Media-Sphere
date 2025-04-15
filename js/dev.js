
var developer = true, // // toggle between develop(er/ing) mode: FOR DEVELOPER PURPOSE ONLY! - ACTIVATE WHEN NEEDED (or OFFLINE)
    keyStatus = {}, // keys down/up status
    disabledEvent, // function declaration (global)
    checkDevTools, // function, check for devTools presence (global)
    minimalUserResponseInMiliseconds = 200, // assumed user response time
    checkInterval = 100,
    devActivity = 0, // no. of times devTools opened by user
    devStatus = false,
    devError = false,
    devErrorMessage = false,
    devErrorAlert = false,
    devForm = true,
    timeout = 20000; // default timeout (.ms)

// var domain = window.location.href;

let hasBeenInStandaloneMode;
let hasPlayStoreTwaHash;

var uA_L,
    tDevice, // check if device is touch-based
    op = { // site 'options'
        // as : false, // anchor scrolling?
        sys : "", // operating system
        uA : navigator.userAgent, // user agent
        Ls : 1000/60, // loop (interval) speed - sec./rev.
        // i : 60, // iterations (per sec.)
        pwa : {
            // s : (getPWADisplayMode() === "twa" || getPWADisplayMode() === "standalone" || getPWADisplayMode() === "browser") ? true : false // check whether if opened as app
            // s : isInstalledPwaSession() ? true : false 
            s : null,
            p : null,
            a : null
        },
        Lf : {
            fb : document.hasFocus()
        },

        // device performance metrics
        _L : null,
        getPef : null, // get device performance function
        getPefCon : false, // "" usage control
        iPef : 0, // initial device performance
        pSpda : [], 
        pSpd : 0, // device processor speed (average estimated in GHZ)
        pSpdL : 0, // "" initial array length
        pMin : [8, 15], // min./rec. processor speed
        pCores : navigator.hardwareConcurrency, // no. of cpu logical cores
        pCoresMin : [2, 6], // cores min./rec.
        sfra : [],
        sfr : 0, // screen refresh rate
        sfrMin : [1, 60], // fps min./rec.
        sfrx : false, // execution
    };

// CODE referenced from user @molnarg from 'https://stackoverflow.com/users/1463900/molnarg', stackoverflow 2022
// Other references:
// https://x-c3ll.github.io/posts/javascript-antidebugging/
// https://weizman.github.io/page-js-anti-debug-2/
// https://blog.allenchou.cc/post/js-anti-debugging/


function osCheck() {
    if (op.uA) {
        if (op.uA.match(/iPhone|iPad|iPod/i)) { // iOS
            op.sys = "iOS";
        } else if (op.uA.match(/Android/i)) {// android
            op.sys = "Android";
        } else if (op.uA.match(/Windows/i)) { // windows
            op.sys = "Windows";
        } else if (op.uA.match(/Mac/i)) { // mac
            op.sys ="MacOS";
        } else if (op.uA.match(/X11/i) && !op.uA.match(/Linux/i)) { // unix
            op.sys = "UNIX";
        } else if (op.uA.match(/Linux/i) && op.uA.match(/X11/i)) { // linux
            op.sys = "Linux";
        } else {
            op.sys = null; // unknown (unsupported)
        }
    }
}

function isTouchSupported() {
    var msTouchEnabled = window.navigator.msMaxTouchPoints;
    var generalTouchEnabled = "ontouchstart" in document.createElement("div");

    if ((msTouchEnabled || generalTouchEnabled || developer) && (op.sys === "iOS" || op.sys === "Android")) {
        return true;
    }
    return false;
}

// REFERENCED FROM: https://micahjon.com/2021/pwa-twa-detection/

function isInStandaloneMode() {
    return Boolean(
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
      || window.navigator.standalone, // Fallback for iOS
    );
  }

// Run this code as soon as possible (before user has a chance to change display mode)

if (isInStandaloneMode()) {
  hasBeenInStandaloneMode = true;
  sessionStorage.setItem('is_standalone_mode', 'yes');
} else {
  hasBeenInStandaloneMode = sessionStorage.getItem('is_standalone_mode') === 'yes';
}

function isInstalledPwaSession() {
    return hasBeenInStandaloneMode;
}

if (window.location.hash === '#play-store-twa') { // ENSURE THAT "startUrl": "/#play-store-twa: is placed in TWA manifest file
    hasPlayStoreTwaHash = true;
    sessionStorage.setItem('is_play_store_twa', 'yes');
} else {
    hasPlayStoreTwaHash = sessionStorage.getItem('is_play_store_twa') === 'yes';
}

function isTwaSession() {
  return hasPlayStoreTwaHash;
}

op.pwa.s = true;
op.pwa.p = isInstalledPwaSession() ? true : false;
op.pwa.a = isTwaSession() ? true : false;

/*
function getPWADisplayMode() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (document.referrer.startsWith('android-app://')) {
        return 'twa';
    } else if (navigator.standalone || isStandalone) { // return APP mode & BROWSER (effective 140524)
        return 'standalone';
    } else {
        return 'browser';
    }
}*/

if (!developer && localStorage.getItem("devtools") === null) { // anti-debugging features
    checkDevTools = function() {
        if (!devErrorAlert) {
            console.log(Object.defineProperties(new Error, { // check if DevTools are open
                message: {
                    get() { // Chrome/Firefox/Opera/Edge
                        alert('Close Developer Tools.'),
                        devActivity++;
                        devErrorAlert = true,
                        devError = true
                    }
                },
                toString: {
                    value() { // Safari
                        (new Error).stack.includes('toString@') && alert('Close Developer Tools.');
                        if (op.b.s) {
                            devActivity++;
                            devError = true,
                            devErrorAlert = true 
                        }
                    }
                }
                // enumerable: true
            }));
        } else { // continue checking if DevTools is open
            console.log(Object.defineProperties(new Error, { 
                message: {
                    get() { // Chrome/Firefox/Opera/Edge
                        // alert('Close Developer Tools.')
                        devStatus = true
                    }
                },
                toString: {
                    value() { // Safari
                        (new Error).stack.includes('toString@') /*&& alert('Close Developer Tools.')*/
                        if (op.b.s) {
                            devStatus = true
                        }
                    }
                }
                // enumerable: true
            }));
            if (devStatus) { // devtools still open
                devError = true;
                devStatus = false;
            } else { // devtools closed
                devError = false;
                devErrorAlert = false;
            }
        }

        setTimeout(checkDevTools, checkInterval); // check at intervals
    }

    checkDevTools();

    // CODE referenced from 'https://doodstream.com/'

    function check() { 
        console.clear(); // clear console always
        before = new Date().getTime();
        eval('debugger'); // check for dev tools usage, break if detected
        after = new Date().getTime();
        if (((after - before) > minimalUserResponseInMiliseconds && !devErrorMessage) || (devError && !devErrorMessage)) {
            document.write("<h1 style='width: auto; font-size: 3rem; font-family: sans-serif; margin: 1em; line-height: 1.3em;'>Close<br>Developer<br>Tools.</h1>");
            document.documentElement.style.overflow = "hidden";
            document.documentElement.style.userSelect = "none";
            document.title = "Ivan Varghese";
            devErrorMessage = true;
            devError = true;

            document.querySelector("main").style.display = "none";

            // self.location.replace(window.location.protocol + window.location.href.substring(window.location.protocol.length)); // reload
        } else {
            before = null;
            after = null;
            delete before;
            delete after;
        }
        if (!devError && devActivity) {
            // console.log("reL");
            reL(); // reload after devTools are closed
        }
        setTimeout(check, checkInterval); // check every 100ms
    }

    check(); 

    disabledEvent = function(e) { // cancel any event
        if (e.stopPropagation) {
            e.stopPropagation();
        } else if (window.event) {
            window.event.cancelBubble = true;
        }
        e.preventDefault();
        return false;
    };

    window.addEventListener("DOMContentLoaded", function() {
        document.addEventListener("contextmenu", function(e) { // prevent right context-menu from showing
            e.preventDefault();
        }, false);
        document.addEventListener("wheel", function(e) { // prevent mouse wheel scrolling zoom
            if (keyStatus.Control || e.ctrlKey) {
                disabledEvent(e);
                e.preventDefault();
            } 
        }, {
            passive : false
        }); 
        document.addEventListener("keydown", function(e) { // disable access to DevTools via various keyboard shortcuts
            var p = e.code;
            keyStatus[p] = true;
            
            if (e.ctrlKey && (e.keyCode == 67 || e.code === "KeyC")) { // ctrl + c
                disabledEvent(e);
            }
            if (e.ctrlKey && (e.keyCode == 88 || e.code === "KeyX")) { // ctrl + x
                disabledEvent(e);
            }
            if (e.ctrlKey && (e.keyCode == 86 || e.code === "KeyV")) { // ctrl + v
                disabledEvent(e);
            }   
            if (e.ctrlKey && e.shiftKey && (e.keyCode == 73 || e.code === "KeyI")) { // Ctrl + shift + i (dev tools)
                disabledEvent(e);
            }
            if (e.ctrlKey && e.shiftKey && (e.keyCode == 74 || e.code === "KeyJ")) { // Ctrl + shift + j (dev tools)
                disabledEvent(e);
            }
            if (e.ctrlKey && e.shiftKey && (e.keyCode == 67 || e.code === "KeyC")) { // Ctrl + shift + c (dev tools)
                disabledEvent(e);
            }
            if ((e.keyCode == 83 || e.code === "KeyS") && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) { // cmd + s (save page)
                disabledEvent(e);
            }
            if (e.ctrlKey && (e.keyCode == 85 || e.code === "KeyU")) {  // Ctrl + u (view source)
                disabledEvent(e);
            }
            if (e.ctrlKey && (e.keyCode == 80 || e.code === "KeyP")) { // Ctrl + p (print page)
                disabledEvent(e);
            }
            if (e.ctrlKey && (e.keyCode == 79 || e.code === "KeyO")) { // Ctrl + o (open page)
                disabledEvent(e);
            }
            if (event.keyCode == 114 || e.code === "F3") { // F3 (search in page)
                disabledEvent(e);
            }
            if (e.ctrlKey && (e.keyCode == 70 || e.code === "KeyF")) { // Ctrl + f (search in page)
                disabledEvent(e);
            }
            if (e.ctrlKey && (e.keyCode == 71 || e.code === "KeyG")) { // Ctrl + g (search in page)
                disabledEvent(e);
            }
            if (e.ctrlKey && e.shiftKey && (e.keyCode == 71 || e.code === "KeyG")) { // Ctrl + shift + g (search in page)
                disabledEvent(e);
            }
            if (e.shiftKey && (e.keyCode == 114 || e.code === "F3")) { // shift + F3 (search in page)
                disabledEvent(e);
            }
            if (e.ctrlKey && (e.code === "NumpadAdd" || e.code === "NumpadSubtract" || e.keyCode == "61" || e.keyCode == "107" || e.keyCode == "173" || e.keyCode == "109" || e.keyCode == "187" || e.keyCode == "189")) { // Ctrl + '+/-' (prevent zoom in/out)
                disabledEvent(e);
                e.preventDefault();
            }
            if ((e.altKey && (e.keyCode == 37 || e.code === "ArrowLeft")) || (e.keyCode == 8 || e.code === "Backspace")) { // go back, 'alt' + back arrow
                disabledEvent(e);
            }
            if ((e.altKey && (e.keyCode == 39 || e.code === "ArrowRight")) || e.shiftKey && (e.keyCode == 8 || e.code === "Backspace")) { // go forward, 'alt' + forward arrow
                disabledEvent(e);
            }
            if (e.keyCode == 122 || e.code === "F11") { // F11 (fullscreen)
                disabledEvent(e);
            }
            if (e.keyCode == 123 || e.code === "F12") { // F12 (dev tools)
                disabledEvent(e);
            }
            if (e.keyCode == 44 || e.code === "PrintScreen") { // PrintScreen
                disabledEvent(e);
                navigator.clipboard.writeText('');
            }
        }, false);
        document.addEventListener("keyup", function(e) {
            var p = e.code;
            keyStatus[p] = false;

        }, false);
        document.addEventListener("click", function(e) {
            pre_Ed(e);
        }, false);
        function pre_Ed(e) { // prevent external-directs on internal links (tabs, windows) using middle clicks (mousewheel)
            var m = false;
            if (e && (e.which == 2 || e.button == 4 )) { // check for mousewheel (middle) click
                m = true;
            }
            if ((keyStatus.Control || e.ctrlKey) && (keyStatus.Shift || e.shiftKey)) { // if 'ctrl' + 'shift' pressed
                disabledEvent(e); // open link in foreground tab
            }
            if ((keyStatus.Control || e.ctrlKey) || m) { // if 'Ctrl' key pressed - open link in background tab
                disabledEvent(e);
            }
            if (keyStatus.Shift || e.shiftKey) { // if 'shift' key pressed
                disabledEvent(e); // open link in new window
            }
        }
    });
} /*else if (developer && localStorage.getItem("devtools") === null) {
    document.write("<h1 style='width: auto; font-size: 3rem; font-family: sans-serif; margin: 1em; line-height: 1.3em;'>We are under maintenance.</h1>");
    devForm = false;

    window.stop();
}*/

// CODE REFERENCED FROM CARLOS DELGADO @ https://ourcodeworld.com/articles/read/1390/how-to-determine-the-screen-refresh-rate-in-hz-of-the-monitor-with-javascript-in-the-browser#disqus_thread

/**
 * Allows to obtain the estimated Hz of the primary monitor in the system.
 * 
 * @param {Function} callback The function triggered after obtaining the estimated Hz of the monitor.
 * @param {Boolean} runIndefinitely If set to true, the callback will be triggered indefinitely (for live counter).
 */
function getScreenRefreshRate(callback, runIndefinitely){
    let requestId = null;
    let callbackTriggered = false;
    runIndefinitely = runIndefinitely || false;

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame;
    }
    
    let DOMHighResTimeStampCollection = [];

    let triggerAnimation = function(DOMHighResTimeStamp){
        DOMHighResTimeStampCollection.unshift(DOMHighResTimeStamp);
        
        if (DOMHighResTimeStampCollection.length > 10) {
            let t0 = DOMHighResTimeStampCollection.pop();
            let fps = Math.floor(1000 * 10 / (DOMHighResTimeStamp - t0));

            if(!callbackTriggered){
                callback.call(undefined, fps, DOMHighResTimeStampCollection);
            }

            if(runIndefinitely){
                callbackTriggered = false;
            }else{
                callbackTriggered = true;
            }
        }
    
        requestId = window.requestAnimationFrame(triggerAnimation);
    };
    
    window.requestAnimationFrame(triggerAnimation);

    // Stop after half second if it shouldn't run indefinitely
    if(!runIndefinitely){
        window.setTimeout(function(){
            window.cancelAnimationFrame(requestId);
            requestId = null;
        }, 500);
    }
}

//////////////////////////////////////

window.addEventListener("load", function() {
    op.getPef = function() { // estimate processor speed

        // JSBenchmark by Aaron Becker: @ https://stackoverflow.com/questions/19754792/measure-cpu-performance-via-js

        var _speedconstant = 1.15600e-8; //if speed=(c*a)/t, then constant=(s*t)/a and time=(a*c)/s
        var d = new Date();
        var amount = 150000000;
        var estprocessor = 1.7; //average processor speed, in GHZ

        // console.log("JSBenchmark by Aaron Becker, running loop " + amount + " times.     Estimated time (for " + estprocessor + "ghz processor) is " + (Math.round(((_speedconstant * amount) / estprocessor) * 100) / 100) + "s");
        
        for (var i = amount; i > 0; i--) {}
        var newd = new Date();
        var accnewd = Number(String(newd.getSeconds()) + "." + String(newd.getMilliseconds()));
        var accd = Number(String(d.getSeconds()) + "." + String(d.getMilliseconds()));
        var di = accnewd - accd;

        if (d.getMinutes() != newd.getMinutes()) {
            di = (60 * (newd.getMinutes() - d.getMinutes())) + di
        }
        spd = ((_speedconstant * amount) / di);

        // console.log("Time: " + Math.round(di * 1000) / 1000 + "s, estimated speed: " + Math.round(spd * 1000) / 1000 + "GHZ");

        if ((Math.round(spd * 1000) / 1000) > 0) {
            op.pSpda[op.pSpda.length] = Math.round(spd * 1000) / 1000; // store instantaneous calculated speed
        }
    };

    op.getPef();
    
    // Warning: the method will be executed forever, ideal for live counters
    // CODE REFERENCED FROM CARLOS DELGADO @https://ourcodeworld.com/articles/read/1390/how-to-determine-the-screen-refresh-rate-in-hz-of-the-monitor-with-javascript-in-the-browser#disqus_thread

    getScreenRefreshRate(function(FPS){ // average screen refresh rate
        // console.log(`${FPS} FPS`);
        if (!op.sfrx) {
            if (FPS > 0) {
                op.sfra[op.sfra.length] = FPS; // array of values
            }
        } else {
            op.sfa = FPS; // live
        }
    }, true);
});


uA_L = setInterval(function() {
    if (navigator.userAgent) {
        op.uA = navigator.userAgent;
        osCheck();
        tDevice = isTouchSupported(); // check if touch device
        clearInterval(uA_L);
    }
}, op.Ls);