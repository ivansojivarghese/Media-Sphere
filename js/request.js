
    var videoURL = "";

    var inp = document.getElementById('urlBar');

    const searchOptions = document.querySelector(".searchOptions");

    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)(\/.*)?$/;

    var queryType = document.querySelector("#searchType"),
        queryDate = document.querySelector("#searchUpload"),
        querySort = document.querySelector("#searchSort");

    var searchResults = null;
    var hashtagResults = null;

    var maxQuery = 20;
    var API_KEY = "AIzaSyAtcIpyHJI05qb0cIo4wdMVYfuC-Z9bQQI";

/*
    inp.addEventListener('select', function() {
      this.selectionStart = this.selectionEnd;
    }, false);*/

    function getDeviceType() {
      const userAgent = navigator.userAgent.toLowerCase();
      const isFinePointer = window.matchMedia("(pointer: fine)").matches;
      const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    
      if (/iphone/.test(userAgent)) {
        return "iphone";
      } else if (/android/.test(userAgent)) {
        return "android";
      } else if (isFinePointer) {
        // Fine pointer (e.g., mouse or trackpad)
        return "desktop";
      } else if (isCoarsePointer) {
        // Coarse pointer (e.g., touch or pen/stylus input)
        if (/tablet|ipad/.test(userAgent) || (/android/.test(userAgent) && !/mobile/.test(userAgent))) {
          return "tablet";
        } else {
          return "mobile-or-pen";
        }
      } else {
        // No detectable pointer
        return "unknown";
      }
    }
    
    const deviceType = getDeviceType();
    console.log(`Detected device type: ${deviceType}`);
    
    const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*$/i;
    
    function testForUrl(url) {
        return urlRegex.test(url);
    }

    var inputError = document.querySelector(".inputError");

    function showInputErrorFeedback(str) {
      // inp.placeholder = str;
      // inp.classList.add("placeholder-error");
      inputError.style.display = "block";
      inputError.innerHTML = str;
    }

    function hideInputErrorFeedback() {
      inputError.style.display = "none";
      inputError.innerHTML = "";
    }

    function ch() {
          var thumbnails = document.querySelectorAll(".wrapper.info .result_wrapper .thumbnail");
          for (let j = 0; j < Math.min(thumbnails.length, 20); j++) {
            thumbnailLoadLoops[j] = setInterval(() => scrollLoadThumbnail(thumbnails[j], j), 1000);
          }
          videoInfoElm.info.removeEventListener("scroll", ch);
    }
    
    function getURL(u, m) { // 

      videoInfoElm.suggestions.innerHTML = "";
      searchSuggestions = [];

      thumbnailImages = [];
      thumbnailLoadLoops = [];

      // videoInfoElm.info.addEventListener("scroll", ch);

      videoInfoElm.suggestions.style.display = "";

      inpBlock = false;

      if (searchPath === "url" || m || u) {

        clearBtn.style.display = inp.value ? "" : "none";

        if ((inp.value !== "" && (pattern.test(inp.value) && searchPath === "url")) || u || m) {

          var wrapURL = document.querySelector("#urlInput");
          var wrap = document.querySelector("#settingsOptions");
          var contents = u || inp.value;

          if (u) {
            // closeVideoInfo();

            const prevScrollTop = videoInfoElm.info.scrollTop;

            loadingSpace.style.display = "block";
            videoInfoElm.info.style.overflow = "hidden";

            // Animate scroll up smoothly
            videoInfoElm.info.scrollTo({
              top: prevScrollTop,
              behavior: "smooth",
            });
          }

          if (contents !== "") {
            videoURL = contents;
          }

          var error = false;
          
          // NO ACCESS TO SHORTS, LIVE, ATTRIBUTED OR EMBEDDED VIDEOS
          if (!contents.includes("embed") && !contents.includes("attribution_link") && !contents.includes("shorts") && !contents.includes("live")) {
            
          if (contents.includes("youtube.com") && !contents.includes("m.youtube.com")) {
            
            //video.classList.remove("error");
            // video.style.border = "0.15rem solid #A10000";
            
            var sIndex = contents.indexOf("v=");
            var eIndex = contents.indexOf("&");
            var sTrue;
            
            if (sIndex !== -1) {
              sTrue = true;
              if (eIndex === -1 && eIndex > sIndex) {
                var eIndex = contents.indexOf("#");
                  if (eIndex === -1) {
                    eIndex = contents.length;
                  }
              } else if (eIndex < sIndex) {
                eIndex = contents.length;
              }
            } else {
              sTrue = false;
              sIndex = contents.lastIndexOf("/");
              eIndex = contents.indexOf("?");
              if (eIndex === -1) {
                eIndex = contents.length;
              }
            }
            
            var id = contents.substring(sIndex, eIndex);
            if (sTrue) {
              var videoID = id.substring(2, id.length);
            } else {
              var videoID = id.substring(1, id.length);
            }
            
          } else if (contents.includes("m.youtube.com")) {
            
              // video.classList.remove("error");
            // video.style.border = "0.15rem solid #A10000";
              
              var sIndex = contents.indexOf("v=");
              var eIndex = contents.indexOf("&");
              var sTrue;
            
              if (sIndex !== -1) {
                sTrue = true;
                if (eIndex === -1 && eIndex > sIndex) {
                  var eIndex = contents.indexOf("#");
                  if (eIndex === -1) {
                    eIndex = contents.length;
                  }
                } else if (eIndex < sIndex) {
                  eIndex = contents.length;
                }
              } else {
                sTrue = false;
                sIndex = contents.lastIndexOf("/");
                eIndex = contents.indexOf("?");
                if (eIndex === -1) {
                  eIndex = contents.length;
                }
              }
            
              var id = contents.substring(sIndex, eIndex);
              if (sTrue) {
                var videoID = id.substring(2, id.length);
              } else {
                var videoID = id.substring(1, id.length);
              }
                
          } else if (contents.includes("youtu.be")) {
            
            // video.classList.remove("error");
            // video.style.border = "0.15rem solid #A10000";
            
            var sIndex = contents.indexOf("e/");
              var eIndex = contents.indexOf("?");
            var sTrue;
            
            if (sIndex === -1) {
              sTrue = false;
              sIndex = contents.lastIndexOf("/");
              eIndex = contents.indexOf("?");
              if (eIndex === -1) {
                eIndex = contents.indexOf("&");
                if (eIndex === -1) {
                  eIndex = contents.length;
                }
              }
            } else {
              sTrue = true;
              if (eIndex === -1) {
                eIndex = contents.indexOf("&");
                if (eIndex === -1) {
                  eIndex = contents.length;
                }
              }
            }
            
            var id = contents.substring(sIndex, eIndex);
            if (sTrue) {
              var videoID = id.substring(2, id.length);
            } else {
              var videoID = id.substring(1, id.length);
            }
          } else {

            error = true;
            
            statusIndicator.classList.remove("buffer");
            statusIndicator.classList.remove("smooth");
            statusIndicator.classList.add("error");

            endLoad();
                      
            setTimeout(function() {
              loadingRing.style.display = "none";
              playPauseButton.style.display = "block";
              playPauseButton.classList.remove('playing');
              playPauseButton.title = "Play";

              if (!seekingLoad && !longTap && !seeking) {
                hideVideoControls();
              }

              // reset the loader
              setTimeout(function() {
                resetLoad();
              }, 10);

            }, 1000);

            loading = false;

          }

          /*
          let VID_REGEX =
          /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
          videoID = contents.match(VID_REGEX)[1];*/

          if (!error) {

            var timestamp = Number(contents.slice(contents.indexOf("&t=") + 3)); // START FROM (in sec.)
            if (!timestamp && (videoURL === localStorage.getItem("mediaURL"))) {
              timestamp = Number(localStorage.getItem("timestamp"));
            }
          
            console.log("Video ID: " + videoID);
              
            videoSubmit = true;
            
            // if (videoID) {
            if (videoLoadLoop === null) {
              
              videoLoadLoop = setInterval(() => {

                if (countryAPIres.online) {
                  clearInterval(videoLoadLoop);
                  videoLoadLoop = null;

                  // if (failTimes < maxFailTimes) {
                    getParams(videoID, timestamp, u, searchPath);
                  // }
                }

              }, 100);
            }
            
            // }

          }
            
          wrapURL.style.display = "";
          wrap.style.display = "";
          // inp.value = "";
          clearInput(false);

          if (searchPath === "url") {
            // closeVideoInfo();

            hideInputErrorFeedback();

            loadingSpace.style.display = "block";
            videoInfoElm.info.style.overflow = "hidden";
          }
            
        } else {
          
          statusIndicator.classList.remove("buffer");
          statusIndicator.classList.remove("smooth");
          statusIndicator.classList.add("error");

          endLoad();
                    
          setTimeout(function() {
            loadingRing.style.display = "none";
            playPauseButton.style.display = "block";
            playPauseButton.classList.remove('playing');
            playPauseButton.title = "Play";

            if (!seekingLoad && !longTap && !seeking) {
              hideVideoControls();
            }

            // reset the loader
            setTimeout(function() {
              resetLoad();
            }, 10);

          }, 1000);

          loading = false;
        }
        
        // document.getElementById("urlSubmit").click();
        } else {

          // INPUT ERROR

          showInputErrorFeedback("Invalid URL. Try again.");
        }
      } else if (!testForUrl(inp.value)) {

        loadingSpace.style.display = "block";
        videoInfoElm.info.style.overflow = "hidden";
        searchQuery(inp.value);
      } else {

        // inp.value = "";
        clearInput(false);
      }
    }
    
    document.addEventListener("keypress", function(event) {
      if (event.key === "Enter" && inp.value && videoInfoOpen) {
        if (pattern.test(inp.value) || searchPath === "query") {
          document.getElementById("urlSubmit").click();
          // closeWrap(event, 'webupload');
          // closeWrap(event, 'settings');
          event.preventDefault();
        } else {

          // INPUT ERROR

          showInputErrorFeedback("Invalid URL. Try again.");
        }
      }
    });

    const clearBtn = document.querySelector(".clear-btn");

    function clearInput(m) {

      inp.value = "";
      clearBtn.style.display = "none";
      if (m) {
        inp.focus();
      }

      videoInfoElm.suggestions.innerHTML = "";
      searchSuggestions = [];

      videoInfoElm.suggestions.style.display = "";

      inpBlock = false;
    }

    async function fetchYouTubeVideosAndPlaylists(v, p, headers, data) {
        const videoMap = {};
            if (v.length) {
              var videoRes;
              if (headers) {
                videoRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${v.join(',')}`, { headers });
              } else {
                videoRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${v.join(',')}&key=${API_KEY}`);
              }
              const videoData = await videoRes.json();
              videoData.items.forEach(video => {
                const thumbs = video.snippet.thumbnails;
                const bestThumb = thumbs.maxres || thumbs.standard || thumbs.high || thumbs.medium || thumbs.default;

                const badges = [];
                // 1. New: uploaded within 7 days
                const now = new Date();
                const publishedAt = new Date(video.snippet.publishedAt);
                const ageInDays = (now - publishedAt) / (1000 * 60 * 60 * 24);
                if (ageInDays <= 7) badges.push("New");

                // 2. 4K: Has 'maxres' thumbnail and HD flag
                /*
                const hasMaxRes = !!thumbs.maxres;
                const isHD = video.contentDetails.definition === "hd";
                if (isHD && hasMaxRes) {
                  badges.push("4K");
                } else if (isHD) {
                  badges.push("HD");
                }*/

                videoMap[video.id] = {
                  snippet: video.snippet,
                  title: video.snippet.title,
                  videoId: video.id,
                  channelTitle: video.snippet.channelTitle,
                  duration: parseDuration(video.contentDetails.duration),
                  uploadText: timeAgo(new Date(video.snippet.publishedAt)),
                  thumbnail: bestThumb.url,
                  badges,
                  type: 'video'
                };
              });
            }

            const playlistMap = {};
            if (p.length) {
              var playlistRes;
              if (headers) {
                playlistRes = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${p.join(',')}`, { headers });
              } else {
                playlistRes = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${p.join(',')}&key=${API_KEY}`);
              }
              const playlistData = await playlistRes.json();
              playlistData.items.forEach(playlist => {
                const thumbs = playlist.snippet.thumbnails;
                const bestThumb = thumbs.maxres || thumbs.standard || thumbs.high || thumbs.medium || thumbs.default;
                playlistMap[playlist.id] = {
                  snippet: playlist.snippet,
                  title: playlist.snippet.title,
                  playlistId: playlist.id,
                  channelTitle: playlist.snippet.channelTitle,
                  uploadText: timeAgo(new Date(playlist.snippet.publishedAt)),
                  thumbnail: bestThumb.url,
                  videoCount: playlist.contentDetails.itemCount,
                  type: 'playlist'
                };
              });
            }

            const finalResults = data.items.map(item => {
                if (item.id.kind === 'youtube#video') {
                  return videoMap[item.id.videoId];
                } else if (item.id.kind === 'youtube#playlist') {
                  return playlistMap[item.id.playlistId];
                }
              }).filter(Boolean); // Remove any undefined entries (just in case)

              return finalResults;
    }
 
    function parseDuration(iso) {
      const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return '';
      const [ , h = 0, m = 0, s = 0 ] = match.map(v => parseInt(v || 0, 10));
      const parts = h ? [h, String(m).padStart(2, '0'), String(s).padStart(2, '0')] :
                        [m, String(s).padStart(2, '0')];
      return parts.join(':');
    }
/*
    function timeAgo(date) {
      const seconds = Math.floor((new Date() - date) / 1000);
      const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 }
      ];
      for (const { label, seconds: s } of intervals) {
        const count = Math.floor(seconds / s);
        if (count >= 1) return `${count} ${label}${count > 1 ? 's' : ''} ago`;
      }
      return 'just now';
    }*/


    var searchQueried = false;

    async function searchQuery(q) {

      searchQueried = true;

      const hashtagRegex = /(?<!https?:\/\/[^\s]*)(#[\p{L}\p{N}_.&\-]+)/gu;

      if (hashtagRegex.test(q)) {

        // Remove the '#' character from the q variable
        q = q.replace('#', '');

        /*
        const url = 'https://yt-api.p.rapidapi.com/hashtag?tag=' + q + '&geo=' + countryAPIres.country + '&lang=en&type=' + queryType.value + '&upload_date=' + queryDate.value + '&sort_by=' + querySort.value;
        const options = {
          method: 'GET',
          headers: {
            'x-rapidapi-key': '89ce58ef37msh8e59da617907bbcp1455bajsn66709ef67e50',
            'x-rapidapi-host': 'yt-api.p.rapidapi.com'
          }
        };*/

        var url, headers, type, sort;
        const accessToken = localStorage.getItem("access_token");
        if (queryType.value) {
          type = '&type=' + queryType.value;
        } else {
          type = '&type=video,playlist';
        }
        if (querySort.value) {
          sort = '&order=' + querySort.value;
        } else {
          sort = '';
        }

        const videoIds = [];
        const playlistIds = [];

        url =  `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&regionCode=${countryAPIres.country}&relevanceLanguage=en${type}${sort}&key=${API_KEY}&maxResults=${maxQuery}`;
          fetch(url)
          .then(response => response.json())
          .then(async data => {

          /*
          data.items.forEach(item => {
            console.log({
              title: item.snippet.title,
              videoId: item.id.videoId,
              thumbnail: item.snippet.thumbnails.default.url
            });
          });*/

          data.items.forEach(item => {
            if (item.id.kind === 'youtube#video') {
              videoIds.push(item.id.videoId);
            } else if (item.id.kind === 'youtube#playlist') {
              playlistIds.push(item.id.playlistId);
            }
          });

          // console.log(fetchYouTubeVideosAndPlaylists(videoIds, playlistIds, headers, data));

          searchResults = await fetchYouTubeVideosAndPlaylists(videoIds, playlistIds, headers, data);
          console.log(searchResults);

          searchResults = searchResults.filter(item => {
            const tags = item.snippet?.tags || [];
            return tags.some(tag => tag.toLowerCase() === q.toLowerCase());
          });

          console.log(searchResults);

          hideInputErrorFeedback();

          if (!searchResults.length) {
          
            // INPUT ERROR

            showInputErrorFeedback("No results found. Try again.");
          } else {
            
            displaySearchResults(true, null, "div.wrapper.search ");
          }

          loadingSpace.style.display = "none";
          videoInfoElm.info.style.overflow = "";

        })
        .catch((error) => {
          console.error('Error:', error);

          loadingSpace.style.display = "none";
          videoInfoElm.info.style.overflow = "";

          // INPUT ERROR

          showInputErrorFeedback("Something went wrong. Try again.");

          searchQueried = false;
        });

        /*
        try {
          const response = await fetch(url, options);
          hashtagResults = await response.json();
          console.log(hashtagResults);

          hideInputErrorFeedback();

          if (!hashtagResults.data.length) {

            // INPUT ERROR

            showInputErrorFeedback("No results found. Try again.");
          } else {

            displaySearchResults(false, null, "div.wrapper.search ");
          }

          loadingSpace.style.display = "none";
          videoInfoElm.info.style.overflow = "";

        } catch (error) {
          console.error(error);

          loadingSpace.style.display = "none";
          videoInfoElm.info.style.overflow = "";

          // INPUT ERROR

          showInputErrorFeedback("Something went wrong. Try again.");

          searchQueried = false;
        }
          */

      } else {
        /*
        const url = 'https://yt-api.p.rapidapi.com/search?query=' + q + '&geo=' + countryAPIres.country + '&lang=en&type=' + queryType.value + '&upload_date=' + queryDate.value + '&sort_by=' + querySort.value;
        const options = {
          method: 'GET',
          headers: {
            'x-rapidapi-key': '89ce58ef37msh8e59da617907bbcp1455bajsn66709ef67e50',
            'x-rapidapi-host': 'yt-api.p.rapidapi.com'
          }
        };*/

        var url, headers, type, sort;
        const accessToken = localStorage.getItem("access_token");
        if (queryType.value) {
          type = '&type=' + queryType.value;
        } else {
          type = '&type=video,playlist';
        }
        if (querySort.value) {
          sort = '&order=' + querySort.value;
        } else {
          sort = '';
        }

        const videoIds = [];
        const playlistIds = [];
      
        if (accessToken) { // with user personalization

          headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          };

          url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&regionCode=${countryAPIres.country}&relevanceLanguage=en${type}${sort}&maxResults=${maxQuery}`;          
          fetch(url, { headers })
          .then(response => response.json())
          .then(async data => {
            // console.log(data.items);

            data.items.forEach(item => {
              if (item.id.kind === 'youtube#video') {
                videoIds.push(item.id.videoId);
              } else if (item.id.kind === 'youtube#playlist') {
                playlistIds.push(item.id.playlistId);
              }
            });

            // console.log(fetchYouTubeVideosAndPlaylists(videoIds, playlistIds, headers, data));

            searchResults = await fetchYouTubeVideosAndPlaylists(videoIds, playlistIds, headers, data);
            console.log(searchResults);

            hideInputErrorFeedback();

            if (!searchResults.length) {
            
              // INPUT ERROR

              showInputErrorFeedback("No results found. Try again.");
            } else {
              
              displaySearchResults(true, null, "div.wrapper.search ");
            }

            loadingSpace.style.display = "none";
            videoInfoElm.info.style.overflow = "";

          })
          .catch((error) => {
            console.error('Error:', error);

            loadingSpace.style.display = "none";
            videoInfoElm.info.style.overflow = "";

            // INPUT ERROR

            showInputErrorFeedback("Something went wrong. Try again.");

            searchQueried = false;
          });

        } else { // without user personalization
          url =  `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&regionCode=${countryAPIres.country}&relevanceLanguage=en${type}${sort}&key=${API_KEY}&maxResults=${maxQuery}`;
          fetch(url)
          .then(response => response.json())
          .then(async data => {

            /*
            data.items.forEach(item => {
              console.log({
                title: item.snippet.title,
                videoId: item.id.videoId,
                thumbnail: item.snippet.thumbnails.default.url
              });
            });*/

            data.items.forEach(item => {
              if (item.id.kind === 'youtube#video') {
                videoIds.push(item.id.videoId);
              } else if (item.id.kind === 'youtube#playlist') {
                playlistIds.push(item.id.playlistId);
              }
            });

            // console.log(fetchYouTubeVideosAndPlaylists(videoIds, playlistIds, headers, data));

            searchResults = await fetchYouTubeVideosAndPlaylists(videoIds, playlistIds, headers, data);
            console.log(searchResults);

            hideInputErrorFeedback();

            if (!searchResults.length) {
            
              // INPUT ERROR

              showInputErrorFeedback("No results found. Try again.");
            } else {
              
              displaySearchResults(true, null, "div.wrapper.search ");
            }

            loadingSpace.style.display = "none";
            videoInfoElm.info.style.overflow = "";

          })
          .catch((error) => {
            console.error('Error:', error);

            loadingSpace.style.display = "none";
            videoInfoElm.info.style.overflow = "";

            // INPUT ERROR

            showInputErrorFeedback("Something went wrong. Try again.");

            searchQueried = false;
          });
        }

        /*
        try {
          const response = await fetch(url, options);
          // const response = await fetch(url, headers);
          searchResults = await response.json();
          console.log(searchResults);

          hideInputErrorFeedback();

          if (!searchResults.data.length) {
            
            // INPUT ERROR

            showInputErrorFeedback("No results found. Try again.");
          } else {
            
            displaySearchResults(true, null, "div.wrapper.search ");
          }

          loadingSpace.style.display = "none";
          videoInfoElm.info.style.overflow = "";

        } catch (error) {
          console.error(error);

          loadingSpace.style.display = "none";
          videoInfoElm.info.style.overflow = "";

          // INPUT ERROR

          showInputErrorFeedback("Something went wrong. Try again.");

          searchQueried = false;
        }
        */

      }

      clearBtn.style.display = q ? "" : "none";
    }

    function containsWord(arr, word) {
      const lowerCaseWord = word.toLowerCase();
      return arr.some(element => element.toLowerCase().includes(lowerCaseWord));
    }

    function gradientButtons(cls) {
      const buttons = document.querySelectorAll(cls);
      const numButtons = buttons.length;

      // High-contrast vibrant gradient suitable for white text
      const gradient = "linear-gradient(90deg, #FF4D4D, #FF8C1A, #47D147, #1E90FF, #8A2BE2, #FF1493)";

      buttons.forEach((button, index) => {
        const sliceStart = (100 / numButtons) * index;
        
        button.style.background = `${gradient}`;
        button.style.backgroundSize = `${numButtons * 100}% 100%`;
        button.style.backgroundPosition = `${sliceStart}%`;
      });
    }

    var thumbnailImages = [];

    function loadThumbnail(j, url, s, m) {
      if (s) {
        if (m) {
          var thumbnail = document.querySelectorAll(".wrapper.profile .result_wrapper .thumbnail")[j];
        } else {
          var thumbnail = document.querySelectorAll(".wrapper.info .result_wrapper .thumbnail")[j];
        }
      } else {
        var thumbnail = document.querySelectorAll(".wrapper.search .result_wrapper .thumbnail")[j];
      }
      thumbnail.style.opacity = "0";
      setTimeout(function () {
          thumbnail.style.backgroundImage = "url('" + url + "')";
          setTimeout(function () {
              thumbnail.style.backgroundColor = "transparent";
              thumbnail.style.opacity = "1";
          }, 10);
      }, 250);
      if (!s) {
        thumbnailImages = [];
      } /*else if (!m) {
        for (let k = 0; k < thumbnailImages.length; k++) {
          loadThumbnail(k, thumbnailImages[k], true, true);
          if (k === thumbnailImages.length - 1) {
            thumbnailImages = [];
          }
        }
      }*/
    }

    var thumbnailLoadLoops = [];

    function displaySearchResults(m, s, c) {
      var data = s ? relatedContent.data : m ? searchResults : hashtagResults.data;
      var ref = s ? null : m ? searchResults.refinements : null;
    
      var res = document.querySelectorAll(c + ".result_wrapper");

      // var indexCount;
    
      // Animate out existing results
      
      if (res.length) {
        /*
        res.forEach((element) => {
          element.style.transition = "opacity 0.5s, transform 0.5s";
          element.style.opacity = "0";
          element.style.transform = "translateX(20px)";
        });
    
        setTimeout(() => {
          res.forEach((element) => element.remove());
        }, 500); // Remove after animation completes
        */

        res.forEach((element, index) => {
          // indexCount++;
          setTimeout(() => {
            element.style.transition = "all 0.2s ease-in-out";
            element.style.opacity = "0";
        
            setTimeout(() => {
               element.remove();
            }, 250); // Remove after its animation completes
          }, index * 200); // Delay each element's start time (200ms apart)
        });
      }
    
      videoInfoElm.suggestions.innerHTML = "";
      searchSuggestions = [];
      videoInfoElm.suggestions.style.display = "";
      inpBlock = false;
    
      if (!s) {
        var refStuff = document.querySelectorAll("div.refinements div.keywordsBtn");
        if (refStuff.length) {
          refStuff.forEach((element) => {
            element.style.transition = "all 0.2s ease-in-out";
            element.style.opacity = "0";
          });
    
          setTimeout(() => {
            refStuff.forEach((element) => element.remove());
          }, 250);
        }
      }
    
      // Handle refinements
      if (ref) {
        for (var k = 0; k < ref.length; k++) {
          var refText = document.createElement("p");
          var refBtn = document.createElement("div");
    
          refText.innerHTML = ref[k];
    
          refBtn.addEventListener("click", function(event) {
            openSearch(event.currentTarget.children[0].innerHTML);
          });
    
          refBtn.classList.add("keywordsBtn", "resBtn", "trs");
          refBtn.appendChild(refText);
          videoInfoElm.refinements.appendChild(refBtn);
    
          // Fade in refinements
          setTimeout(() => {
            refBtn.style.transition = "all 0.2s ease-in-out";
            refBtn.style.opacity = "1";
          }, 10);
        }
      }

      var resultsList = [];
    
      // Wait before inserting new results
      // setTimeout(() => {
        for (let i = 0; i < data.length; i++) {
          if ((data[i].type === "video" || (data[i].type === "playlist" && !data[i].title.includes("Mix"))) && 
              (!data[i].badges || (data[i].badges && !containsWord(data[i].badges, 'live')))) {
            
            var main = document.createElement("div");
            main.classList.add("result_wrapper", "trs", "cursor", "trsButtons", "noimg");
            main.title = data[i].title;
            // main.style.opacity = "0"; // Start with 0 opacity
            // main.style.transform = "translateY(20px)"; // Slide up effect
    
            if (data[i].type === "video") {
              main.setAttribute("data-url", "https://www.youtube.com/watch?v=" + data[i].videoId);
            } else {
              main.setAttribute("data-url", "https://www.youtube.com/playlist?list=" + data[i].playlistId);
            }
            main.onclick = function(event) {
              videoNav = true;
              getURL(event.currentTarget.getAttribute("data-url"), true);
            };
    
            if (data[i].badges && data[i].badges.length) {
              var badgesRow = document.createElement("div");
              badgesRow.classList.add("badges_row");
              for (var j = 0; j < data[i].badges.length; j++) {
                var badge = document.createElement("div");
                badge.classList.add("badge", "otherResBtn", "resBtn", "trs");
    
                var badge_text = document.createElement("p");
                badge_text.innerHTML = data[i].badges[j];
    
                badge.appendChild(badge_text);
                badgesRow.appendChild(badge);
              }
            }
    
            var thumbnail = document.createElement("div");
            thumbnail.classList.add("thumbnail", "img", "trs");
            // thumbnail.style.backgroundImage = "url('" + data[i].thumbnail[data[i].thumbnail.length - 1].url + "')";
            thumbnail.style.backgroundColor = "#3f3f3f";

            // const thumbnailUrl = data[i].thumbnail[data[i].thumbnail.length - 1].url;
            const thumbnailUrl = data[i].thumbnail;

            thumbnailImages[thumbnailImages.length] = new Image();
            thumbnailImages[thumbnailImages.length - 1].src = thumbnailUrl;
            thumbnailImages[thumbnailImages.length - 1].style.display = "none"; // hide initially

            const thisIndex = thumbnailImages.length - 1;
            thumbnailImages[thisIndex].onload = function () {
              loadThumbnail(thisIndex, thumbnailUrl, s);
            };
    
            if (data[i].type === "playlist") {
              var thumbnailIconWrap = document.createElement("div");
              thumbnailIconWrap.classList.add("thumbnailIconWrap");
    
              var thumbnailIcon = document.createElement("div");
              thumbnailIcon.classList.add("thumbnailIcon", "img");
              thumbnailIcon.style.backgroundImage = "url('../svg/playlist_play.svg')";
              // thumbnailIcon.style.backgroundColor = "#3f3f3f";
    
              thumbnailIconWrap.appendChild(thumbnailIcon);
              thumbnail.appendChild(thumbnailIconWrap);
            }
    
            var title = document.createElement("h5");
            title.innerHTML = data[i].title;
            title.classList.add("overflow", "resultTitle");
    
            var channelTitle = document.createElement("p");
            if (data[i].channelTitle !== undefined) {
              channelTitle.innerHTML = data[i].channelTitle;
            } else {
              channelTitle.innerHTML = "";
            }
            channelTitle.classList.add("overflow", "resultChannelTitle");
    
            var duration = document.createElement("p");
            // if (data[i].lengthText) {
            if (data[i].duration) {
              duration.innerHTML = data[i].duration;
            }
            duration.classList.add("resultDuration");
    
            var date = document.createElement("p");
            // if (data[i].publishedTimeText) {
            
            
            if (data[i].type === "playlist") {
              date.innerHTML = data[i].videoCount + " videos";
            } else if (data[i].uploadText) {
              date.innerHTML = data[i].uploadText;
            }
            date.classList.add("resultDate");
    
            var textDiv = document.createElement("div");
            textDiv.classList.add("resultText");
    
            if (badgesRow) {
              main.appendChild(badgesRow);
            }
            main.appendChild(thumbnail);
            main.appendChild(title);
            if (channelTitle.innerHTML) {
              main.appendChild(channelTitle);
            }
    
            textDiv.appendChild(duration);
            textDiv.appendChild(date);
            main.appendChild(textDiv);

            resultsList[resultsList.length] = main;

            if (s) {
              main.style.opacity = "1"; // Start with 0 opacity
              videoInfoElm.relatedResults.appendChild(main);
            }

            /*
            if (!s) {
              videoInfoElm.results.appendChild(main);
            } else {
              videoInfoElm.relatedResults.appendChild(main);
            }*/
    
            // Animate in the new results
            // setTimeout(() => {
              //main.style.transition = "all 0.2s ease-in-out";
              //main.style.opacity = "1";
            // }, 100);
          }
        }
       // }, indexCount * 200); // Delay to allow old results to fade out

      // if (searchQueried || s) {
      if (!s) {
        resultsList.reverse().forEach((el, index) => {
          // Measure current scroll position
          const prevScrollTop = videoInfoElm.results.scrollTop;
          /*
          if (videoNav) {
            const prevScrollTop = videoInfoElm.info.scrollTop;
          } else if (s || searchQueried) {
            const prevScrollTop = 0;
          }*/
        
          // Set initial state
          el.style.opacity = "0";
          el.style.transition = "none"; // prevent flicker before insertion
        
          // Insert at the top
          // videoInfoElm.results.insertBefore(el, videoInfoElm.results.firstChild);
          if (!s) {
            videoInfoElm.results.insertBefore(el, videoInfoElm.results.firstChild);
          } else {
            // videoInfoElm.relatedResults.insertBefore(el, videoInfoElm.relatedResults.firstChild);
          }
        
          // Measure new scroll height added by el
          const addedHeight = el.offsetHeight;
        
          // Maintain scroll position after insertion
          videoInfoElm.info.scrollTop = prevScrollTop + addedHeight;
        
          // Animate scroll up smoothly
          videoInfoElm.info.scrollTo({
            top: prevScrollTop,
            behavior: "smooth",
          });
        
          // Animate the element itself in a staggered way
          setTimeout(() => {
            el.style.transition = "all 0.2s ease-in-out";
            el.style.opacity = "1";
          }, index * 10);
        });
      } else {
        

        for (let i = 0; i < thumbnailImages.length; i++) {
                setTimeout(function () {
                  loadThumbnail(i, thumbnailImages[i].src, true);
          }, i * 100); // each image loads 100ms after the previous one
        }

        /*
        var thumbnails = document.querySelectorAll(".wrapper.info .result_wrapper .thumbnail");
        for (let j = 0; j < Math.min(thumbnails.length, 20); j++) {
          thumbnailLoadLoops[j] = setInterval(() => scrollLoadThumbnail(thumbnails[j], j), 1000);
        }
        */

        /*
        setInterval(function() {
          var thumbnails = document.querySelectorAll(".wrapper.info .result_wrapper .thumbnail");
          var noBgThumbnailsWithIndex = Array.from(thumbnails)
              .map((el, idx) => ({ el, idx }))
              .filter(item => !item.el.style.backgroundImage);

          for (let i = 0; i < noBgThumbnailsWithIndex.length; i++) {
                // setTimeout(function () {
               
                  loadThumbnail(noBgThumbnailsWithIndex[i].idx, thumbnailImages[noBgThumbnailsWithIndex[i].idx].src, true);
                
          // }, i * 100); // each image loads 100ms after the previous one
        }
        }, 2500);*/

        // videoInfoElm.info.addEventListener("scroll", redoLoadThumbnail);
      }
    
      searchQueried = false;
    }

    function scrollLoadThumbnail(el, i) {
      var t = el.getBoundingClientRect().top;
      if (t > 0 && t < window.innerHeight) {
        loadThumbnail(i, thumbnailImages[i].src, true);
        clearInterval(thumbnailLoadLoops[i]);
        thumbnailLoadLoops[i] = null;
      }
    }

    /*
    function redoLoadThumbnail() {
      var loadNeeded = false;
      for (let i = 0; i < thumbnailImages.length; i++) {
        var thumbnail = document.querySelectorAll(".wrapper.info .result_wrapper .thumbnail");
        if (!thumbnail[i].style.backgroundImage) {
          loadNeeded = true;
                  setTimeout(function () {
                    loadThumbnail(i, thumbnailImages[i].src, true);
            }, i * 100); // each image loads 100ms after the previous one
          }
        }
        if (!loadNeeded) {
          thumbnailImages = [];
          videoInfoElm.info.removeEventListener("scroll", redoLoadThumbnail);
        }
    }
        */
    
/*
    function displaySearchResults(m, s, c) {

      var data = s ? relatedContent.data : m ? searchResults.data : hashtagResults.data;
      var ref = s ? null : m ? searchResults.refinements : null;

      var res = document.querySelectorAll(c + ".result_wrapper");
      if (res.length) {
        res.forEach((element) => {
          element.remove();
        });
      }

      videoInfoElm.suggestions.innerHTML = "";
      searchSuggestions = [];
      videoInfoElm.suggestions.style.display = "";
      inpBlock = false;

      if (!s) {
        var refStuff = document.querySelectorAll("div.refinements div.keywordsBtn");
        if (refStuff.length) {
          refStuff.forEach((element) => {
            element.remove();
          });
        }
      }

      if (ref) {
        for (var k = 0; k < ref.length; k++) {
          var refText = document.createElement("p");
          var refBtn = document.createElement("div");

          refText.innerHTML = ref[k];

          refBtn.addEventListener("click", function(event) {
            // ADD CODE TO DIRECTLY PERFORM A SEARCH BASED ON KEYWORD(S)
    
            openSearch(event.currentTarget.children[0].innerHTML);
          });

          refBtn.classList.add("keywordsBtn", "resBtn", "trs");

          refBtn.appendChild(refText);

          videoInfoElm.refinements.appendChild(refBtn);
        }

        if (ref.length > 10) {
          // gradientButtons(".refinements .keywordsBtn");
        }
      }

      for (var i = 0; i < data.length; i++) {
        if ((data[i].type === "video" || (data[i].type === "playlist" && !data[i].title.includes("Mix"))) && (!data[i].badges || (data[i].badges && !containsWord(data[i].badges, 'live')))) {

          var main = document.createElement("div");
          main.classList.add("result_wrapper", "trs", "cursor", "trsButtons", "noimg");
          main.title = data[i].title;
          if (data[i].type === "video") {

            // FOR VIDEOS

            main.setAttribute("data-url", "https://www.youtube.com/watch?v=" + data[i].videoId);
          } else {

            // FOR PLAYLISTS

            main.setAttribute("data-url", "https://www.youtube.com/playlist?list=" + data[i].playlistId);
          }
          main.onclick = function(event) {
            getURL(event.currentTarget.getAttribute("data-url"), true);
          };

          if (data[i].badges && data[i].badges.length) {
            var badgesRow = document.createElement("div");
            badgesRow.classList.add("badges_row");
            for (var j = 0; j < data[i].badges.length; j++) {
              var badge = document.createElement("div");
              badge.classList.add("badge", "otherResBtn", "resBtn", "trs");

              var badge_text = document.createElement("p");
              badge_text.innerHTML = data[i].badges[j];

              badge.appendChild(badge_text);
              badgesRow.appendChild(badge);
            }
          }

          var thumbnail = document.createElement("div");
          thumbnail.classList.add("thumbnail", "img");
          thumbnail.style.backgroundImage = "url('" + data[i].thumbnail[data[i].thumbnail.length - 1].url + "')";

          if (data[i].type === "playlist") {
            var thumbnailIconWrap = document.createElement("div");
            thumbnailIconWrap.classList.add("thumbnailIconWrap");

            var thumbnailIcon = document.createElement("div");
            thumbnailIcon.classList.add("thumbnailIcon", "img");
            thumbnailIcon.style.backgroundImage = "url('../svg/playlist_play.svg')";

            thumbnailIconWrap.appendChild(thumbnailIcon);
            thumbnail.appendChild(thumbnailIconWrap);
          }

          var title = document.createElement("h5");
          title.innerHTML = data[i].title;
          title.classList.add("overflow", "resultTitle");

          var channelTitle = document.createElement("p");
          channelTitle.innerHTML = data[i].channelTitle;
          channelTitle.classList.add("overflow", "resultChannelTitle");

          var duration = document.createElement("p");
          if (data[i].lengthText) {
            duration.innerHTML = data[i].lengthText;
          }
          duration.classList.add("resultDuration");

          var date = document.createElement("p");
          if (data[i].publishedTimeText) {
            date.innerHTML = data[i].publishedTimeText;
          } else if (data[i].type === "playlist") {
            date.innerHTML = data[i].videoCount + " videos";
          }
          date.classList.add("resultDate");

          var textDiv = document.createElement("div");
          textDiv.classList.add("resultText");

          if (badgesRow) {
            main.appendChild(badgesRow);
          }
          main.appendChild(thumbnail);
          main.appendChild(title);
          main.appendChild(channelTitle);

          textDiv.appendChild(duration);
          textDiv.appendChild(date);
          main.appendChild(textDiv);

          if (!s) {
            videoInfoElm.results.appendChild(main);
          } else {
            videoInfoElm.relatedResults.appendChild(main);
          }
        }
      }

      searchQueried = false;
    }
      */

    inp.addEventListener("keypress", function(event) {
      if (inp.value.trim() === "") {
        videoInfoElm.suggestions.innerHTML = "";
      } /*else if (searchPath === "query") {
        videoInfoElm.suggestions.style.display = "block";
      }*/
    });
    
    /*
    inp.addEventListener("keypress", function(event) {
      if (event.key === "Enter") {
        document.getElementById("urlSubmit").click();
        // closeWrap(event, 'webupload');
        event.preventDefault();
      }
    });*/

    var searchPath = "url";
    const urlSearchBtn = document.querySelector(".resBtn.url");
    const querySearchBtn = document.querySelector(".resBtn.query");

    function inputPlaceholder() {
      var queryWords = ["funny videos", "music", "tutorials", "movie trailers", "tech reviews"];
      var inputElement = document.querySelector("input");
      var index = 0; // Track the current word
      var charIndex = 0; // Track the character position in the word
      var timeoutId; // Store timeout ID to cancel ongoing effects
  
      function clearPlaceholder() {
          if (!inputElement) return;
          inputElement.placeholder = ""; // Clear the placeholder
          index = 0; // Reset the word index
          charIndex = 0; // Reset the character index
          if (timeoutId) clearTimeout(timeoutId); // Cancel any ongoing timeouts
      }
  
      function typeEffect() {
          if (!inputElement) return;
  
          // Reset the placeholder for the current word being typed
          inputElement.placeholder = queryWords[index].slice(0, charIndex + 1);
          charIndex++;
  
          if (charIndex < queryWords[index].length) {
              timeoutId = setTimeout(typeEffect, 100); // Typing speed
          } else {
              timeoutId = setTimeout(eraseEffect, 1000); // Pause before erasing
          }
      }
  
      function eraseEffect() {
          if (!inputElement) return;
  
          // Remove the last character from the placeholder
          inputElement.placeholder = queryWords[index].slice(0, charIndex - 1);
          charIndex--;
  
          if (charIndex > 0) {
              timeoutId = setTimeout(eraseEffect, 50); // Erasing speed
          } else {
              index = (index + 1) % queryWords.length; // Move to the next word
              timeoutId = setTimeout(typeEffect, 500); // Pause before typing the next word
          }
      }
  
      // Start the typing effect
          typeEffect();
      }
      
      // Initialize the function
      inputPlaceholder();
  

    function setSearchPath(e) {
      if (inp.value.includes("#")) {
        inp.style.color = "#0073e6";
      } else {
        inp.style.color = "#303030";
      }
 
      // inp.value = "";
      clearInput(false);

      if (e === "query" || e.currentTarget.classList.contains("query")) {
        searchPath = "query";

        searchOptions.style.display = "block";

        urlSearchBtn.classList.remove("active");
        querySearchBtn.classList.add("active");

        inp.type = "search";
        inp.inputMode = "search";
        inp.enterkeyhint = "search";
        if (e !== "query") {
          if ((searchResults !== null && getDeviceType === "desktop") || (searchResults === null)) {
            inp.focus();
          }
        }
      } else {
        searchPath = "url";

        searchOptions.style.display = "none";

        querySearchBtn.classList.remove("active");
        urlSearchBtn.classList.add("active");

        inp.type = "url";
        inp.inputMode = "url";
        inp.enterkeyhint = "go";
        if ((searchResults !== null && getDeviceType === "desktop") || (searchResults === null)) {
          inp.focus();
        }
      }
    }
    /*
    async function getYouTubeSuggestions(query) {
        const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`;
    
        try {
            const response = await fetch(url);
            const data = await response.json();
            console.log(data[1]); // Suggestions are in the second index
        } catch (error) {
            console.error("Error fetching suggestions:", error);
            return [];
        }
    }*/

    inp.addEventListener('input', () => {
      clearBtn.style.display = inp.value ? "" : "none";

      if (searchPath === "query") {
        const text = inp.value;

        // Detect hashtags using a regex and wrap them in a span
        const hashtagRegex = /(?<!https?:\/\/[^\s]*)(#[\p{L}\p{N}_]+)/gu;
      
        if (text.match(hashtagRegex)) {
          inp.style.color = "#0073e6";
        } else {
          inp.style.color = "#303030";
        }

        // getYouTubeSuggestions(text);

      } else {
        inp.style.color = "#303030";
      }
    });

    inp.addEventListener('keydown', function (event) {
      if (event.key === "Enter") {
        this.blur(); // Hides the keyboard
      }

      // show search suggestions
      if (searchPath === "query") {
        setTimeout(function () {
          if (inp.value !== "") {
            getSuggestions(inp.value);  
          }
        }, 10);
      }

    });

    inp.addEventListener("input", () => {
      inpBlock = false;

      if (inp.value.trim() === "") {
        videoInfoElm.suggestions.innerHTML = "";
      } else {
        /*if (searchPath === "query") {
          videoInfoElm.suggestions.style.display = "block";
        }*/
        // setTimeout(function() {
        updateSuggestionsList();
        // }, 1000);
      }
     });