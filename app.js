// app.js
// Import Firebase functions (already handled in the <script type="module"> in index.html for global access)
// You might want to move all imports and initialization here if you prefer a single JS file.
// For simplicity and quick setup, we'll assume Firebase is initialized and exposed globally as `auth` and `database`.

const appScreens = document.querySelectorAll('.screen');
const navItems = document.querySelectorAll('.nav-item');

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');

    navItems.forEach(item => item.classList.remove('active'));
    document.querySelector(`.nav-item[data-target="${sectionId}"]`).classList.add('active');

    // Hide video playback screen if user navigates away
    if (sectionId !== 'video-playback-screen') {
        document.getElementById('video-playback-screen').classList.remove('active');
        const player = document.getElementById('main-video-player');
        if (player) {
            player.pause();
            player.currentTime = 0;
        }
        document.getElementById('vast-ad-player').style.display = 'none'; // Hide ad player
    }
}

function showScreen(screenId) {
    appScreens.forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Initial check for auth state and show appropriate screen
auth.onAuthStateChanged(async (user) => {
    if (user) {
        const userRef = ref(database, 'users/' + user.uid);
        const snapshot = await get(child(userRef, 'channelName'));
        if (!snapshot.exists()) {
            showScreen('channel-creation-screen');
        } else {
            showScreen('main-app-screen');
            showSection('home-section'); // Default to home after login
            loadHomePage();
        }
    } else {
        showScreen('login-screen');
    }
});

// --- Channel Creation Logic ---
async function createChannel() {
    const channelNameInput = document.getElementById('channel-name-input');
    const channelNameStatus = document.getElementById('channel-name-status');
    const channelName = channelNameInput.value.trim();
    const currentUser = auth.currentUser;

    if (!channelName) {
        channelNameStatus.textContent = 'Channel name cannot be empty.';
        channelNameStatus.style.color = 'red';
        return;
    }

    if (channelName.length < 3) {
        channelNameStatus.textContent = 'Channel name must be at least 3 characters long.';
        channelNameStatus.style.color = 'red';
        return;
    }

    // Check if channel name is already taken
    const dbRef = ref(database);
    const usersSnapshot = await get(child(dbRef, 'users'));
    let nameTaken = false;
    if (usersSnapshot.exists()) {
        usersSnapshot.forEach(childSnapshot => {
            if (childSnapshot.val().channelName && childSnapshot.val().channelName.toLowerCase() === channelName.toLowerCase()) {
                nameTaken = true;
                return;
            }
        });
    }

    if (nameTaken) {
        channelNameStatus.textContent = 'This channel name is already taken. Please choose another.';
        channelNameStatus.style.color = 'red';
        return;
    }

    // Save channel name and selected emoji to Firebase
    // For profile picture, you'll need an emoji picker library or hardcoded emojis.
    // For now, let's just save the name.
    try {
        await set(ref(database, 'users/' + currentUser.uid + '/channelName'), channelName);
        await set(ref(database, 'users/' + currentUser.uid + '/email'), currentUser.email);
        await set(ref(database, 'users/' + currentUser.uid + '/totalViews'), 0); // Initialize total views for creator
        // You'd also save the chosen emoji here:
        // await set(ref(database, 'users/' + currentUser.uid + '/profileEmoji'), selectedEmoji);

        channelNameStatus.textContent = 'Channel created successfully!';
        channelNameStatus.style.color = 'green';
        showScreen('main-app-screen');
        showSection('home-section');
        loadHomePage();
    } catch (error) {
        console.error("Error creating channel:", error);
        channelNameStatus.textContent = 'Error creating channel. Please try again.';
        channelNameStatus.style.color = 'red';
    }
}

// Function to populate emoji picker (placeholder)
function populateEmojiPicker() {
    const emojiContainer = document.getElementById('profile-emoji-container');
    const emojis = ['😊', '😂', '😍', '🤩', '👍', '🔥', '💖', '🌈', '🍕', '🚀', '🌟']; // Example emojis
    emojis.forEach(emoji => {
        const span = document.createElement('span');
        span.textContent = emoji;
        span.classList.add('emoji-option');
        span.onclick = () => selectEmoji(emoji, span);
        emojiContainer.appendChild(span);
    });
}
let selectedEmoji = '😊'; // Default
function selectEmoji(emoji, element) {
    document.querySelectorAll('.emoji-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    selectedEmoji = emoji;
}
populateEmojiPicker(); // Call this when the channel creation screen is loaded

// --- Video/Shorts Display Logic (Home/Shorts sections) ---
async function loadHomePage() {
    const videoListDiv = document.getElementById('video-list');
    videoListDiv.innerHTML = 'Loading videos...';

    try {
        const videosRef = ref(database, 'videos');
        const snapshot = await get(videosRef);
        if (snapshot.exists()) {
            const videosData = snapshot.val();
            const videosArray = Object.keys(videosData).map(key => ({
                id: key,
                ...videosData[key]
            }));
            // Sort by creation date or popularity if needed
            videosArray.sort((a, b) => b.timestamp - a.timestamp); // Assuming a timestamp field

            videoListDiv.innerHTML = ''; // Clear loading message

            videosArray.forEach(video => {
                const videoItem = document.createElement('div');
                videoItem.classList.add('video-thumbnail-item');
                videoItem.onclick = () => playVideo(video.id);

                const thumbnail = document.createElement('img');
                thumbnail.src = video.thumbnailUrl || 'placeholder.jpg'; // Use a placeholder if no thumbnail
                thumbnail.alt = video.title;

                const videoInfo = document.createElement('div');
                videoInfo.classList.add('video-info');

                const title = document.createElement('h3');
                title.textContent = video.title;

                const channelName = document.createElement('p');
                // Fetch channel name from users table based on video.userId
                get(child(ref(database, 'users'), video.userId + '/channelName')).then(snap => {
                    if (snap.exists()) {
                        channelName.textContent = snap.val() + ' • ' + formatViews(video.views) + ' views • ' + timeAgo(video.timestamp);
                    } else {
                        channelName.textContent = 'Unknown Channel' + ' • ' + formatViews(video.views) + ' views • ' + timeAgo(video.timestamp);
                    }
                });

                videoInfo.appendChild(title);
                videoInfo.appendChild(channelName);
                videoItem.appendChild(thumbnail);
                videoItem.appendChild(videoInfo);
                videoListDiv.appendChild(videoItem);
            });
        } else {
            videoListDiv.innerHTML = '<p>No videos uploaded yet. Be the first!</p>';
        }
    } catch (error) {
        console.error("Error loading home page videos:", error);
        videoListDiv.innerHTML = '<p>Error loading videos. Please try again later.</p>';
    }
}

function formatViews(views) {
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views;
}

function timeAgo(timestamp) {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

// --- Video Playback Logic ---
let currentPlayingVideoId = null;
let currentVideoDuration = 0;
let currentVideoWatchedPercentage = 0;
let viewCounted = false; // Flag to ensure view is counted only once per video session

async function playVideo(videoId) {
    currentPlayingVideoId = videoId;
    showSection('video-playback-screen'); // Switch to video playback screen
    const videoPlayer = document.getElementById('main-video-player');
    const vastAdPlayer = document.getElementById('vast-ad-player');

    // Hide video player and show ad player
    videoPlayer.style.display = 'none';
    vastAdPlayer.style.display = 'block';
    vastAdPlayer.textContent = 'Loading Ad...';

    // Fetch video details
    const videoRef = ref(database, 'videos/' + videoId);
    const snapshot = await get(videoRef);

    if (snapshot.exists()) {
        const videoData = snapshot.val();
        document.getElementById('video-playback-title').textContent = videoData.title;
        document.getElementById('video-playback-description').textContent = videoData.description;
        document.getElementById('video-playback-views').textContent = formatViews(videoData.views || 0) + ' views';

        // Load comments and likes
        await loadComments(videoId);
        await loadLikes(videoId);

        // First, play VAST ad
        const vastAdUrl = 'https://s.magsrv.com/v1/vast.php?idzone=5609878';
        const adContainer = document.getElementById('vast-ad-player');
        // You'll need a VAST player library (like Google IMA SDK or similar) for full VAST support.
        // For a very basic example, we can simulate an ad.
        vastAdPlayer.textContent = 'Playing VAST Ad... (Simulated)';
        setTimeout(() => {
            vastAdPlayer.style.display = 'none'; // Hide ad player
            videoPlayer.style.display = 'block'; // Show video player
            videoPlayer.src = videoData.videoUrl; // Set video source
            videoPlayer.load();
            videoPlayer.play();
            currentVideoDuration = videoPlayer.duration; // Get total duration
            viewCounted = false; // Reset view count flag for new video

            // Ad breaks during video playback
            videoPlayer.ontimeupdate = () => {
                currentVideoWatchedPercentage = (videoPlayer.currentTime / videoPlayer.duration) * 100;

                // View count logic
                if (!viewCounted && currentVideoWatchedPercentage >= 7) {
                    incrementViewCount(videoId, videoData.userId);
                    viewCounted = true;
                }

                // Mid-roll ad logic
                const videoLengthMinutes = videoPlayer.duration / 60;
                if (videoLengthMinutes >= 5 && Math.floor(videoPlayer.currentTime / 60) % 5 === 0 && videoPlayer.currentTime > 0 && !videoPlayer.paused) {
                    // This logic is tricky to prevent multiple ads at same timestamp without proper ad SDK.
                    // You'd typically use ad cue points and an ad SDK.
                    // For now, a very basic example:
                    // pause video, play ad, resume video
                    // This needs more sophisticated ad management.
                    // For now, let's just make a note.
                    // console.log("Time for mid-roll ad!");
                }
                if (videoLengthMinutes >= 60 && Math.floor(videoPlayer.currentTime / 60) % 10 === 0 && videoPlayer.currentTime > 0 && !videoPlayer.paused) {
                    // console.log("Time for extended mid-roll ad!");
                }
            };

            videoPlayer.onended = () => {
                console.log("Video ended.");
                // Potentially load next suggested video or go back to home
            };

        }, 3000); // Simulate 3 seconds of ad playback

    } else {
        alert("Video not found!");
        showSection('home-section');
    }
}

function hideVideoPlayback() {
    const videoPlayer = document.getElementById('main-video-player');
    if (videoPlayer) {
        videoPlayer.pause();
        videoPlayer.currentTime = 0;
    }
    document.getElementById('vast-ad-player').style.display = 'none'; // Hide ad player
    showSection('home-section'); // Go back to home
}

async function incrementViewCount(videoId, creatorId) {
    const videoRef = ref(database, 'videos/' + videoId + '/views');
    const creatorRef = ref(database, 'users/' + creatorId + '/totalViews');

    try {
        // Increment video views
        await set(videoRef, (await get(videoRef)).val() + 1);
        // Increment creator total views
        await set(creatorRef, (await get(creatorRef)).val() + 1);
        console.log(`View counted for video ${videoId} and creator ${creatorId}`);
    } catch (error) {
        console.error("Error incrementing view count:", error);
    }
}

// --- Like, Share, Comment ---
async function likeVideo() {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentPlayingVideoId) return;

    const likeRef = ref(database, `videos/${currentPlayingVideoId}/likes/${currentUser.uid}`);
    const snapshot = await get(likeRef);

    if (snapshot.exists()) {
        // User already liked, so unlike
        await set(likeRef, null);
        console.log("Video unliked!");
    } else {
        // User not liked, so like
        await set(likeRef, true);
        console.log("Video liked!");
    }
    loadLikes(currentPlayingVideoId); // Refresh like count
}

async function loadLikes(videoId) {
    const likeCountSpan = document.getElementById('like-count');
    const likesRef = ref(database, `videos/${videoId}/likes`);
    const snapshot = await get(likesRef);
    if (snapshot.exists()) {
        const likes = snapshot.val();
        const count = Object.keys(likes).length;
        likeCountSpan.textContent = count;
    } else {
        likeCountSpan.textContent = '0';
    }
}

function shareVideo() {
    // This is where you implement the "app download first, then video" logic.
    // In a WebView, you can't directly force an app download before showing content unless you
    // control the native Android code.
    // A common approach is:
    // 1. When user clicks share, show a custom share sheet within the HTML.
    // 2. This sheet provides a link to download your app (e.g., Google Play Store link).
    // 3. The link can also contain a deep link to the video, so *if* the app is installed,
    //    it opens directly to the video. If not, it goes to the app store.
    // Example: window.location.href = `your-app-store-link?video_id=${currentPlayingVideoId}`;
    alert("Share functionality (will prompt app download first)");
}

async function showComments() {
    const commentsSection = document.getElementById('comments-section');
    commentsSection.style.display = commentsSection.style.display === 'block' ? 'none' : 'block';
    if (commentsSection.style.display === 'block') {
        await loadComments(currentPlayingVideoId);
    }
}

async function loadComments(videoId) {
    const commentsList = document.getElementById('comments-list');
    commentsList.innerHTML = '';
    const commentsRef = ref(database, `videos/${videoId}/comments`);
    const snapshot = await get(commentsRef);

    if (snapshot.exists()) {
        const comments = snapshot.val();
        Object.keys(comments).forEach(commentId => {
            const comment = comments[commentId];
            const li = document.createElement('li');
            li.innerHTML = `<strong>${comment.userName}</strong>: ${comment.text}`; // Assuming userName field
            commentsList.appendChild(li);
        });
    } else {
        commentsList.innerHTML = '<li>No comments yet. Be the first!</li>';
    }
}

async function postComment() {
    const newCommentInput = document.getElementById('new-comment-input');
    const commentText = newCommentInput.value.trim();
    const currentUser = auth.currentUser;

    if (!commentText || !currentUser || !currentPlayingVideoId) return;

    const userRef = ref(database, 'users/' + currentUser.uid);
    const userSnapshot = await get(child(userRef, 'channelName'));
    const userName = userSnapshot.exists() ? userSnapshot.val() : currentUser.displayName || 'Anonymous';

    const commentData = {
        userId: currentUser.uid,
        userName: userName,
        text: commentText,
        timestamp: Date.now()
    };

    try {
        const newCommentRef = push(ref(database, `videos/${currentPlayingVideoId}/comments`)); // Generate unique ID
        await set(newCommentRef, commentData);
        newCommentInput.value = ''; // Clear input
        await loadComments(currentPlayingVideoId); // Reload comments
    } catch (error) {
        console.error("Error posting comment:", error);
        alert("Failed to post comment.");
    }
}

// --- Upload Logic ---
let selectedVideoFile = null;
let selectedThumbnailFile = null;

function showUploadForm(type) {
    document.getElementById('upload-type').value = type;
    document.getElementById('upload-form-container').style.display = 'block';
    // You might want to hide the initial "Upload Short/Video" buttons
    document.querySelector('.upload-options').style.display = 'none';
}

function handleVideoFileSelect(event) {
    selectedVideoFile = event.target.files[0];
    console.log("Selected video file:", selectedVideoFile.name);
}

// This function will need to interact with your Telegram bot API
async function uploadVideo(event) {
    event.preventDefault(); // Prevent form submission
    const currentUser = auth.currentUser;
    if (!currentUser) {
        alert("Please sign in to upload videos.");
        return;
    }

    const uploadType = document.getElementById('upload-type').value;
    const videoTitle = document.getElementById('video-title').value.trim();
    const videoDescription = document.getElementById('video-description').value.trim();
    const videoTags = document.getElementById('video-tags').value.trim();

    if (!selectedVideoFile) {
        alert("Please select a video file to upload.");
        return;
    }
    if (!videoTitle || videoTitle.split(' ').filter(Boolean).length < 2) {
        alert("Please enter a title with at least 2 words.");
        return;
    }
    if (videoTitle.length > 100) {
        alert("Title cannot exceed 100 characters.");
        return;
    }
    if (videoDescription.length > 4000) {
        alert("Description cannot exceed 4000 characters.");
        return;
    }
    if (videoTags.length > 500) {
        alert("Tags cannot exceed 500 characters.");
        return;
    }

    // --- Core Logic for Telegram Bot Integration ---
    // 1. Upload video file to your server/Telegram bot:
    // This is the most complex part of your request. You'll need a backend server or a Telegram bot
    // that can receive the video file, store it (e.g., on a cloud storage like Google Cloud Storage, AWS S3, or within Telegram itself if that's your strategy),
    // and then provide a direct public URL to that video.
    // The HTML/JS cannot directly upload to Telegram bot's private storage. You'd need a server-side endpoint.

    // Example of how you might send a file to your backend (which then sends to Telegram):
    // const formData = new FormData();
    // formData.append('video', selectedVideoFile);
    // formData.append('title', videoTitle);
    // formData.append('description', videoDescription);
    // formData.append('tags', videoTags);
    // formData.append('userId', currentUser.uid);
    // formData.append('uploadType', uploadType);

    // try {
    //     const response = await fetch('YOUR_TELEGRAM_BOT_API_ENDPOINT/upload', {
    //         method: 'POST',
    //         body: formData
    //     });
    //     const data = await response.json();
    //     if (data.success && data.videoUrl) {
    //         const directVideoUrl = data.videoUrl; // This is the direct link from your Telegram bot
    //         const thumbnailUrl = data.thumbnailUrl || 'default-thumbnail.jpg'; // If your bot generates thumbnail

    //         // 2. Save video metadata to Firebase
    //         const videoData = {
    //             userId: currentUser.uid,
    //             title: videoTitle,
    //             description: videoDescription,
    //             tags: videoTags.split(',').map(tag => tag.trim()), // Store as array
    //             videoUrl: directVideoUrl,
    //             thumbnailUrl: thumbnailUrl,
    //             uploadType: uploadType, // 'short' or 'video'
    //             views: 0,
    //             likes: {},
    //             comments: {},
    //             timestamp: Date.now()
    //         };

    //         await push(ref(database, 'videos'), videoData); // Add with a unique ID
    //         alert("Video uploaded and data saved to Firebase!");
    //         document.getElementById('video-upload-form').reset(); // Clear form
    //         selectedVideoFile = null;
    //         selectedThumbnailFile = null;
    //         showSection('home-section'); // Go back to home
    //         loadHomePage(); // Refresh home page
    //     } else {
    //         alert("Error uploading video via bot: " + (data.message || "Unknown error"));
    //     }
    // } catch (error) {
    //     console.error("Upload error:", error);
    //     alert("Failed to upload video. Please check your bot's API endpoint.");
    // }

    alert("Video upload process initiated. **NOTE:** Direct video upload to Telegram bot from client-side requires a server-side intermediary. This is a placeholder. Your backend will handle the file upload and return the direct video URL.");

    // For demonstration, let's simulate a direct video URL for saving to Firebase
    const simulatedVideoUrl = "https://www.w3schools.com/html/mov_bbb.mp4"; // Example direct video link
    const simulatedThumbnailUrl = "https://via.placeholder.com/300x200?text=VideoThumbnail";

    const videoData = {
        userId: currentUser.uid,
        title: videoTitle,
        description: videoDescription,
        tags: videoTags.split(',').map(tag => tag.trim()), // Store as array
        videoUrl: simulatedVideoUrl, // Replace with actual URL from your bot
        thumbnailUrl: simulatedThumbnailUrl, // Replace with actual URL or generate
        uploadType: uploadType, // 'short' or 'video'
        views: 0,
        likes: {},
        comments: {},
        timestamp: Date.now()
    };

    try {
        await push(ref(database, 'videos'), videoData); // Add with a unique ID
        alert("Video uploaded and data saved to Firebase (simulated URL)!");
        document.getElementById('video-upload-form').reset(); // Clear form
        selectedVideoFile = null;
        selectedThumbnailFile = null;
        showSection('home-section'); // Go back to home
        loadHomePage(); // Refresh home page
    } catch (error) {
        console.error("Error saving video data to Firebase:", error);
        alert("Failed to save video data to Firebase.");
    }
}

// --- Search Logic ---
async function performSearch() {
    const searchInput = document.getElementById('search-input');
    const searchQuery = searchInput.value.toLowerCase().trim();
    const searchResultsDiv = document.getElementById('search-results');
    searchResultsDiv.innerHTML = '';

    if (searchQuery.length < 2) {
        searchResultsDiv.innerHTML = '<p>Enter at least 2 characters to search.</p>';
        return;
    }

    try {
        const videosRef = ref(database, 'videos');
        const videosSnapshot = await get(videosRef);
        const usersRef = ref(database, 'users');
        const usersSnapshot = await get(usersRef);

        const matchingVideos = [];
        if (videosSnapshot.exists()) {
            const videosData = videosSnapshot.val();
            Object.keys(videosData).forEach(videoId => {
                const video = videosData[videoId];
                if (video.title.toLowerCase().includes(searchQuery) ||
                    video.description.toLowerCase().includes(searchQuery) ||
                    (video.tags && video.tags.some(tag => tag.toLowerCase().includes(searchQuery)))) {
                    matchingVideos.push({ id: videoId, ...video });
                }
            });
        }

        const matchingChannels = [];
        if (usersSnapshot.exists()) {
            const usersData = usersSnapshot.val();
            Object.keys(usersData).forEach(userId => {
                const user = usersData[userId];
                if (user.channelName && user.channelName.toLowerCase().includes(searchQuery)) {
                    matchingChannels.push({ id: userId, ...user });
                }
            });
        }

        if (matchingVideos.length === 0 && matchingChannels.length === 0) {
            searchResultsDiv.innerHTML = '<p>No matching videos or channels found.</p>';
            return;
        }

        if (matchingVideos.length > 0) {
            const videoResultsHeading = document.createElement('h3');
            videoResultsHeading.textContent = 'Videos';
            searchResultsDiv.appendChild(videoResultsHeading);
            matchingVideos.forEach(video => {
                const videoItem = document.createElement('div');
                videoItem.classList.add('video-thumbnail-item'); // Reuse existing style
                videoItem.onclick = () => playVideo(video.id);
                videoItem.innerHTML = `
                    <img src="${video.thumbnailUrl || 'placeholder.jpg'}" alt="${video.title}">
                    <div class="video-info">
                        <h3>${video.title}</h3>
                        <p>${formatViews(video.views || 0)} views</p>
                    </div>
                `;
                searchResultsDiv.appendChild(videoItem);
            });
        }

        if (matchingChannels.length > 0) {
            const channelResultsHeading = document.createElement('h3');
            channelResultsHeading.textContent = 'Channels';
            searchResultsDiv.appendChild(channelResultsHeading);
            matchingChannels.forEach(channel => {
                const channelItem = document.createElement('div');
                channelItem.classList.add('channel-item'); // Add specific channel styling
                channelItem.innerHTML = `
                    <span class="channel-emoji">${channel.profileEmoji || '👤'}</span>
                    <span>${channel.channelName}</span>
                `;
                // Add click handler to go to channel profile
                searchResultsDiv.appendChild(channelItem);
            });
        }

    } catch (error) {
        console.error("Search error:", error);
        searchResultsDiv.innerHTML = '<p>Error performing search. Please try again.</p>';
    }
}

function showSearch() {
    showSection('search-screen');
}

// --- Adsterea Ad Integration (Placeholder) ---
// You will need to embed these codes directly into your HTML
// where you want the ads to appear. Since this is a WebView,
// the JavaScript for these ads should execute directly.

// Example for a Direct Link Ad after every 9-10 shorts:
// You'll need to control the shorts scrolling in the shorts section,
// and after every 9-10 shorts, you'd show a dedicated ad screen/popup.
// For banner ads, you'd insert the provided script tags into the HTML.

function displayAdstereaDirectLinkAd() {
    // This function would be called when it's time to show a direct link ad.
    // It would likely open a new full-screen "ad" section in your HTML,
    // embed the direct link, and provide a way for the user to close it.
    console.log("Displaying Adsterea Direct Link Ad...");
    // You would typically open a new window/tab for a direct link or navigate
    // the WebView if allowed and return.
    // For a seamless in-app experience, consider using a custom div overlay.
    const adOverlay = document.createElement('div');
    adOverlay.classList.add('ad-overlay');
    adOverlay.innerHTML = `
        <div class="ad-content">
            <span class="ad-label">Advertisement</span>
            <p>Click below to open sponsored content:</p>
            <a href="https://www.profitableratecpm.com/ekqigjxxf?key=7cc9b0386975c414c8ab9629f405b0dc" target="_blank" class="ad-button">Open Ad</a>
            <button class="close-ad-button" onclick="this.parentNode.parentNode.remove()">Close Ad</button>
        </div>
    `;
    document.body.appendChild(adOverlay);
}

// Add this CSS for ad overlay
/*
.ad-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.ad-content {
    background-color: #fff;
    padding: 30px;
    border-radius: 10px;
    text-align: center;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.ad-button {
    display: inline-block;
    background-color: #007bff;
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    text-decoration: none;
    margin-top: 15px;
}

.close-ad-button {
    background: none;
    border: none;
    color: #888;
    margin-top: 10px;
    cursor: pointer;
    font-size: 14px;
}
*/

// Initial load for home section
document.addEventListener('DOMContentLoaded', () => {
    // This will be handled by onAuthStateChanged, which triggers showScreen/showSection
});
