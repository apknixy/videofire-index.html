 import React, { useEffect, useState, useContext, createContext, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, orderBy, where, getDocs } from 'firebase/firestore';

// Tailwind CSS is assumed to be available
// Lucide-react for icons (loaded via CDN for simplicity in this single file)
// Make sure to load this in the HTML head if using a separate index.html
// <script src="https://cdn.tailwindcss.com"></script>
// <script src="https://unpkg.com/lucide-react@latest/dist/umd/lucide-react.min.js"></script>

// Global variables provided by the Canvas environment (MUST BE USED)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyDes3ioeygnWBqJB6NnHb7xj732JJhOqm8",
  authDomain: "videofire-268ff.firebaseapp.com",
  databaseURL: "https://videofire-268ff-default-rtdb.firebaseio.com",
  projectId: "videofire-268ff",
  storageBucket: "videofire-268ff.firebasestorage.app",
  messagingSenderId: "910374058927",
  appId: "1:910374058927:web:6add3afdea07cfa2914d5a"
};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Firebase Context to share auth and db instances
const FirebaseContext = createContext(null);

// Custom Modal Component for alerts/confirmations
const CustomModal = ({ title, message, isOpen, onClose, onConfirm, showConfirmButton = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700 max-w-sm w-full text-white text-center">
        <h3 className="text-xl font-bold mb-4 text-orange-400">{title}</h3>
        <p className="mb-6 text-gray-300">{message}</p>
        <div className="flex justify-center space-x-4">
          {showConfirmButton && (
            <button
              onClick={onConfirm}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-md font-semibold transition duration-200"
            >
              Confirm
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-md font-semibold transition duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


// Utility function to parse YouTube URLs and get embed/thumbnail links
const getYouTubeInfo = (url) => {
  const regExp = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|shorts\/|v\/|)([\w-]{11})(?:\S+)?/g;
  const match = regExp.exec(url);

  if (match && match[1]) {
    const videoId = match[1];
    return {
      videoId: videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&modestbranding=1&rel=0&loop=1&playlist=${videoId}`, // Autoplay, no controls, loop
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    };
  }
  return null;
};

// VideoPlayer component with VAST Ad integration
const VideoPlayer = ({ videoUrl, thumbnailUrl, onVideoEnd, onAdStart, onAdEnd }) => {
  const adContainerRef = useRef(null);
  const videoRef = useRef(null);
  const [adManager, setAdManager] = useState(null);
  const [showVideo, setShowVideo] = useState(false); // State to control video visibility after ad

  // VAST Ad Tag URL from user's input
  const vastAdTagUrl = "https://assured-sandwich.com/dsm/Fzz.daGsN/vNZUGoUR/oeRmF9OufZFUylok/PkTDYe0zM/jfQp0zOlTvYDt/NIjTQyyGNQDsQr5tNoycZQseaKWo1lpFdWDU0ix-";

  const requestAds = useCallback(() => {
    if (!adContainerRef.current) return;

    // Ensure google.ima is loaded
    if (typeof google === 'undefined' || !google.ima) {
      console.error("Google IMA SDK not loaded.");
      setShowVideo(true); // Fallback to showing video
      return;
    }

    const adDisplayContainer = new google.ima.AdDisplayContainer(adContainerRef.current);
    const adsLoader = new google.ima.AdsLoader(adDisplayContainer);

    // Load ads data
    adsLoader.addEventListener(
      google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
      (adsManagerLoadedEvent) => {
        const adsManager = adsManagerLoadedEvent.getAdsManager();
        setAdManager(adsManager);

        // Initialize and start ad playback
        adsManager.init(adContainerRef.current.offsetWidth, adContainerRef.current.offsetHeight, google.ima.ViewMode.NORMAL);
        adsManager.start();
        onAdStart && onAdStart(); // Notify parent ad has started
        console.log("VAST ad started.");

        // Event listener for ad completion
        adsManager.addEventListener(
          google.ima.AdEvent.Type.ALL_ADS_COMPLETED,
          () => {
            console.log("VAST ad completed.");
            adsManager.destroy(); // Clean up ad manager
            setShowVideo(true); // Show video after ad
            onAdEnd && onAdEnd(); // Notify parent ad has ended
          }
        );

        // Basic error handling for ads
        adsManager.addEventListener(
          google.ima.AdErrorEvent.Type.AD_ERROR,
          (adErrorEvent) => {
            console.error("Ad error:", adErrorEvent.getError().getMessage());
            adsManager.destroy();
            setShowVideo(true); // Fallback to showing video on ad error
            onAdEnd && onAdEnd();
          }
        );
      },
      false
    );

    // Request ads
    const adsRequest = new google.ima.AdsRequest();
    adsRequest.adTagUrl = vastAdTagUrl;
    adsRequest.linearAdSlotWidth = adContainerRef.current.offsetWidth;
    adsRequest.linearAdSlotHeight = adContainerRef.current.offsetHeight;
    adsRequest.nonLinearAdSlotWidth = adContainerRef.current.offsetWidth;
    adsRequest.nonLinearAdSlotHeight = adContainerRef.current.offsetHeight;
    adsRequest.setAdWillAutoPlay(true); // Indicate that ads will autoplay

    adDisplayContainer.initialize(); // Initialize ad container before requesting ads
    adsLoader.requestAds(adsRequest);
  }, [onAdStart, onAdEnd, vastAdTagUrl]);


  useEffect(() => {
    setShowVideo(false); // Hide video initially
    requestAds(); // Request ad whenever videoUrl changes (i.e., new video loads)

    return () => {
      if (adManager) {
        adManager.destroy();
        setAdManager(null);
      }
    };
  }, [videoUrl, requestAds, adManager]);

  const youTubeInfo = getYouTubeInfo(videoUrl);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      {/* Ad Container */}
      <div
        ref={adContainerRef}
        className={`absolute inset-0 z-20 ${showVideo ? 'hidden' : 'block'}`}
      ></div>

      {/* YouTube Video Player (hidden until ad finishes) */}
      {showVideo && youTubeInfo && (
        <iframe
          ref={videoRef}
          className="w-full h-full object-cover"
          src={youTubeInfo.embedUrl}
          frameBorder="0"
          allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube video player"
        ></iframe>
      )}

      {!showVideo && (
        <img
          src={thumbnailUrl || youTubeInfo?.thumbnailUrl || 'https://placehold.co/1280x720/000000/FFFFFF?text=Loading+Ad'}
          alt="Video Thumbnail"
          className="absolute inset-0 w-full h-full object-cover z-10"
        />
      )}

      {/* Loading indicator for ad or video */}
      {!showVideo && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 text-white flex flex-col items-center">
          <svg className="animate-spin h-8 w-8 text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="mt-2 text-sm text-gray-300">Loading Ad...</span>
        </div>
      )}
    </div>
  );
};


// VideoCard Component
const VideoCard = ({ video, userId, onLike, onCommentClick }) => {
  const { db, auth } = useContext(FirebaseContext);
  const [likesCount, setLikesCount] = useState(video.likesCount || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [showAdLoadedMessage, setShowAdLoadedMessage] = useState(false); // State for ad load message
  const [isAdPlaying, setIsAdPlaying] = useState(true); // Initially true as ad plays first

  useEffect(() => {
    // Check if current user has liked this video
    if (auth.currentUser && db) {
      const likeRef = doc(db, `artifacts/${appId}/public/data/likes/${video.id}_${auth.currentUser.uid}`);
      getDoc(likeRef).then((docSnap) => {
        setIsLiked(docSnap.exists());
      }).catch(error => console.error("Error checking like status:", error));
    }

    // Listener for real-time likes count (optional, can be heavy)
    const videoRef = doc(db, `artifacts/${appId}/public/data/videos/${video.id}`);
    const unsubscribe = onSnapshot(videoRef, (docSnap) => {
      if (docSnap.exists()) {
        setLikesCount(docSnap.data().likesCount || 0);
      }
    });

    return () => unsubscribe();
  }, [video.id, auth.currentUser, db]);

  const handleLike = async () => {
    if (!auth.currentUser || !db) return;

    const likeRef = doc(db, `artifacts/${appId}/public/data/likes/${video.id}_${auth.currentUser.uid}`);
    const videoRef = doc(db, `artifacts/${appId}/public/data/videos/${video.id}`);

    try {
      if (isLiked) {
        // Unlike
        await deleteDoc(likeRef);
        await updateDoc(videoRef, {
          likesCount: Math.max(0, likesCount - 1)
        });
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        // Like
        await setDoc(likeRef, { videoId: video.id, userId: auth.currentUser.uid, timestamp: new Date() });
        await updateDoc(videoRef, {
          likesCount: (likesCount || 0) + 1
        });
        setIsLiked(true);
        setLikesCount(prev => (prev || 0) + 1);
      }
      onLike && onLike(video.id, !isLiked);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleAdStart = () => {
    setIsAdPlaying(true);
    setShowAdLoadedMessage(false); // Hide message when ad starts
  };

  const handleAdEnd = () => {
    setIsAdPlaying(false);
    setShowAdLoadedMessage(true); // Show message when ad ends
    setTimeout(() => setShowAdLoadedMessage(false), 3000); // Hide after 3 seconds
  };


  return (
    <div className="relative flex-shrink-0 w-full h-full snap-center bg-gray-900 rounded-lg overflow-hidden border border-gray-800 shadow-xl">
      {/* Video Player */}
      <VideoPlayer
        videoUrl={video.youtubeUrl}
        thumbnailUrl={video.thumbnailUrl}
        onAdStart={handleAdStart}
        onAdEnd={handleAdEnd}
      />

      {/* Overlay for Ad Playing */}
      {isAdPlaying && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40 text-white text-lg font-bold">
          <svg className="animate-pulse h-6 w-6 mr-2 text-orange-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>
          <span className="text-gray-300">Ad playing...</span>
        </div>
      )}

      {/* Message after ad finishes */}
      {showAdLoadedMessage && !isAdPlaying && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold animate-fade-in-out z-40">
          Video playing soon!
        </div>
      )}


      {/* Video Info and Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent flex flex-col justify-end text-white z-10">
        {/* Adstreaa Banner 468x60 (example) */}
        <div className="mb-4 w-full flex justify-center">
          {/* In a real app, this script injection should be managed more robustly */}
          <div
            dangerouslySetInnerHTML={{
              __html: `
                <script type="text/javascript">  
                  atOptions = {  
                    'key' : '7281653bd62d5d460d6daa8793f19c5e',  
                    'format' : 'iframe',  
                    'height' : 60,  
                    'width' : 468,  
                    'params' : {}  
                  };  
                </script>  
                <script type="text/javascript" src="//www.highperformanceformat.com/7281653bd62d5d460d6daa8793f19c5e/invoke.js"></script>
              `
            }}
            className="w-[468px] h-[60px] bg-gray-800 rounded-md flex items-center justify-center text-xs text-gray-400 border border-gray-700"
          >
            {/* This div might be replaced by the ad iframe/content */}
            Banner 468x60 Ad (Adstreaa)
          </div>
        </div>

        <h2 className="text-xl font-bold mb-2 text-orange-300 drop-shadow">{video.title}</h2>
        <p className="text-sm text-gray-300 mb-4 drop-shadow">By {video.userName || 'Anonymous User'} | {video.viewsCount || 0} views</p>

        {/* Social Buttons */}
        <div className="flex items-center space-x-6 text-xl">
          <button onClick={handleLike} className="flex items-center space-x-1 p-2 rounded-full hover:bg-gray-700 transition duration-200">
            {isLiked ? (
              <svg className="h-6 w-6 text-red-500 fill-current" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.64a5.5 5.5 0 000-7.78z" fill="currentColor"></path>
              </svg>
            ) : (
              <svg className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
            )}
            <span className="text-sm">{likesCount}</span>
          </button>
          <button onClick={() => onCommentClick(video.id)} className="flex items-center space-x-1 p-2 rounded-full hover:bg-gray-700 transition duration-200">
            <svg className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
            <span className="text-sm">Comments</span>
          </button>
          <button className="flex items-center space-x-1 p-2 rounded-full hover:bg-gray-700 transition duration-200">
            <svg className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.516 3.832a3 3 0 00.512-1.632V12c0-.36-.062-.716-.184-1.049m0 2.098L8.684 10.658m10.158-1.342a3 3 0 110-2.684m0 2.684l-6.516-3.832a3 3 0 00-.512 1.632V12c0 .36.062.716.184 1.049m0-2.098L18.842 8.658"></path>
            </svg>
            <span className="text-sm">Share</span>
          </button>
        </div>

         {/* Hilltops MultiTag: Banner 300x250 */}
         <div className="mt-4 w-full flex justify-center">
            <div
            dangerouslySetInnerHTML={{
                __html: `
                <script>     
                (function(zrot){     
                var d = document,     
                s = d.createElement('script'),     
                l = d.scripts[d.scripts.length - 1];     
                s.settings = zrot || {};     
                s.src = "//definitive-priority.com/bOX/VYsBd.Golu0eYpWdco/reFmA9WujZeU/lTkBPQTiYH0IMrj_Q_1BNsjJI-tTNujcQ/yrNSDxU/2SMowA";     
                s.async = true;     
                s.referrerPolicy = 'no-referrer-when-downgrade';     
                l.parentNode.insertBefore(s, l);     
                })({})     
                </script>
                `
            }}
            className="w-[300px] h-[250px] bg-gray-800 rounded-md flex items-center justify-center text-xs text-gray-400 border border-gray-700"
            >
                Banner 300x250 Ad (Hilltops)
            </div>
        </div>
      </div>
    </div>
  );
};

// Main Home Page with Video Feed
const HomePage = () => {
  const { db, auth } = useContext(FirebaseContext);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [currentVideoIdForComments, setCurrentVideoIdForComments] = useState(null);
  const scrollContainerRef = useRef(null);

  // Popunder Ad Script (Hilltops) - Triggered after a delay
  useEffect(() => {
    const popunderScript = `
        <script>
            // Only trigger if not already loaded or if specific conditions met
            if (!window._popunderLoaded) {
                setTimeout(function() {
                    window.open('https://assured-sandwich.com/bV3fV.0WPv3/pSvrb/m/VsJQZ/DR0/2XN/D/In0JNVTzMU3MLVThYo0-MvjeQB1/Mgz/gT', '_blank');
                    window._popunderLoaded = true; // Prevent multiple triggers
                }, 15000); // Trigger popunder after 15 seconds
            }
        </script>
    `;

    const div = document.createElement('div');
    div.innerHTML = popunderScript;
    document.body.appendChild(div);

    // Adstreaa Popunder Script (Another example)
    const adstreaaPopunderScript = `
        <script type='text/javascript' src='//pl26835142.profitableratecpm.com/db/27/6d/db276d3b5f1289379bbe5d365485ac52.js'></script>
    `;
    const div2 = document.createElement('div');
    div2.innerHTML = adstreaaPopunderScript;
    document.body.appendChild(div2);

    // Native Ads (Adstreaa)
    const nativeAdScript = `
        <script async="async" data-cfasync="false" src="//pl26835150.profitableratecpm.com/39628927897b21d6c45567203000ccc6/invoke.js"></script>
        <div id="container-39628927897b21d6c45567203000ccc6"></div>
    `;
    const div3 = document.createElement('div');
    div3.innerHTML = nativeAdScript;
    document.body.appendChild(div3);

     // Social Bar (Adstreaa)
     const socialBarScript = `
        <script type='text/javascript' src='//pl26835180.profitableratecpm.com/51/87/c3/5187c39d0d72d45de29e9c62b51aaba2.js'></script>
    `;
    const div4 = document.createElement('div');
    div4.innerHTML = socialBarScript;
    document.body.appendChild(div4);

  }, []);

  useEffect(() => {
    if (!db) return;

    setLoading(true);
    // Path for public videos: /artifacts/{appId}/public/data/videos
    const videosColRef = collection(db, `artifacts/${appId}/public/data/videos`);
    // orderBy('timestamp', 'desc') is removed to avoid index issues if not set up,
    // data can be sorted client-side if needed.
    const q = query(videosColRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const videoList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a,b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0)); // Client-side sorting by timestamp
      setVideos(videoList);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching videos:", err);
      setError("Failed to load videos.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  const handleCommentClick = (videoId) => {
    setCurrentVideoIdForComments(videoId);
    setCommentModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <svg className="animate-spin h-10 w-10 text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="ml-3">Loading videos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      className="relative w-full h-screen overflow-y-scroll snap-y snap-mandatory bg-gray-950 hide-scrollbar"
    >
      {videos.length === 0 ? (
        <div className="flex items-center justify-center h-full text-white text-lg">
          No videos available. Upload some!
        </div>
      ) : (
        videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            userId={auth?.currentUser?.uid}
            onCommentClick={handleCommentClick}
          />
        ))
      )}
      <CommentModal
        isOpen={commentModalOpen}
        onClose={() => setCommentModalOpen(false)}
        videoId={currentVideoIdForComments}
      />
    </div>
  );
};

// Profile Page
const ProfilePage = ({ userId }) => {
  const { db } = useContext(FirebaseContext);
  const [userVideos, setUserVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState("Loading...");

  useEffect(() => {
    if (!db || !userId) {
      setLoading(false);
      return;
    }

    // Fetch user details (e.g., username)
    const userRef = doc(db, `artifacts/${appId}/users/${userId}/profile/${userId}`);
    const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setUsername(docSnap.data().username || `User: ${userId.substring(0, 8)}...`);
      } else {
        setUsername(`User: ${userId.substring(0, 8)}...`);
      }
    }, (err) => console.error("Error fetching user profile:", err));


    // Fetch videos uploaded by this user
    const videosColRef = collection(db, `artifacts/${appId}/public/data/videos`);
    const q = query(videosColRef, where('userId', '==', userId));

    const unsubscribeVideos = onSnapshot(q, (snapshot) => {
      const videos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a,b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0));
      setUserVideos(videos);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching user videos:", err);
      setError("Failed to load user videos.");
      setLoading(false);
    });

    return () => {
      unsubscribeUser();
      unsubscribeVideos();
    };
  }, [db, userId]);

  if (loading) {
    return <div className="flex justify-center items-center h-full text-white">Loading profile...</div>;
  }
  if (error) {
    return <div className="text-red-500 text-center mt-8">Error: {error}</div>;
  }

  return (
    <div className="p-6 bg-gray-950 min-h-screen text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-6 mb-8 bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800">
          <img
            src={`https://placehold.co/100x100/374151/E5E7EB?text=${username.charAt(0)}`}
            alt="Profile Avatar"
            className="w-24 h-24 rounded-full border-4 border-orange-500 shadow-md"
          />
          <div>
            <h1 className="text-3xl font-extrabold text-orange-400 mb-1">{username}</h1>
            <p className="text-gray-400">User ID: {userId}</p>
            <p className="text-gray-300 mt-2">Total Uploads: {userVideos.length}</p>
            {/* Add more profile details like followers, following etc. */}
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6 text-orange-300">My Uploads</h2>
        {userVideos.length === 0 ? (
          <p className="text-gray-400 text-center py-8 bg-gray-900 rounded-lg border border-gray-800">
            You haven't uploaded any videos yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {userVideos.map(video => (
              <div key={video.id} className="bg-gray-900 rounded-lg overflow-hidden shadow-md border border-gray-800 transform hover:scale-105 transition-transform duration-200 cursor-pointer">
                <img
                  src={getYouTubeInfo(video.youtubeUrl)?.thumbnailUrl || 'https://placehold.co/480x360/000/FFF?text=Video+Thumbnail'}
                  alt={video.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-orange-300 truncate">{video.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{video.viewsCount || 0} views</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


// Comment Modal Component
const CommentModal = ({ isOpen, onClose, videoId }) => {
  const { db, auth } = useContext(FirebaseContext);
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !videoId || !db) {
      setComments([]);
      return;
    }

    setLoading(true);
    const commentsColRef = collection(db, `artifacts/${appId}/public/data/comments`);
    const q = query(commentsColRef, where('videoId', '==', videoId));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch usernames for comments
      const commentsWithUsernames = await Promise.all(fetchedComments.map(async (comment) => {
        const userProfileRef = doc(db, `artifacts/${appId}/users/${comment.userId}/profile/${comment.userId}`);
        const userDoc = await getDoc(userProfileRef);
        const username = userDoc.exists() ? userDoc.data().username : 'Anonymous';
        return { ...comment, username };
      }));

      // Sort by timestamp descending
      setComments(commentsWithUsernames.sort((a, b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0)));
      setLoading(false);
    }, (err) => {
      console.error("Error fetching comments:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, videoId, db]);

  const handleAddComment = async () => {
    if (!newCommentText.trim() || !auth.currentUser || !db) return;

    try {
      const commentsColRef = collection(db, `artifacts/${appId}/public/data/comments`);
      await addDoc(commentsColRef, {
        videoId: videoId,
        userId: auth.currentUser.uid,
        text: newCommentText.trim(),
        timestamp: new Date()
      });
      setNewCommentText('');
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-end justify-center z-50">
      <div className="bg-gray-800 w-full max-w-lg h-3/4 rounded-t-2xl shadow-lg flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900">
          <h2 className="text-xl font-bold text-orange-400">Comments</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 text-gray-300">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
          {loading ? (
            <div className="flex justify-center items-center h-full text-white">
              <svg className="animate-spin h-6 w-6 text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-2 text-gray-300">Loading comments...</span>
            </div>
          ) : comments.length === 0 ? (
            <p className="text-gray-400 text-center mt-4">No comments yet. Be the first!</p>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="bg-gray-700 rounded-lg p-3 mb-3 shadow-sm border border-gray-600">
                <p className="text-gray-200 text-sm mb-1">{comment.text}</p>
                <p className="text-xs text-gray-400">
                  <span className="font-semibold text-orange-300">{comment.username}</span> • {new Date(comment.timestamp?.toDate()).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-700 bg-gray-900">
          <div className="flex space-x-2">
            <input
              type="text"
              className="flex-1 p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
              placeholder="Add a comment..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
            />
            <button
              onClick={handleAddComment}
              className="px-5 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold text-white transition duration-200"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// Upload Video Modal
const UploadVideoModal = ({ isOpen, onClose, userId }) => {
  const { db } = useContext(FirebaseContext);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadError(null);
    if (!videoUrl.trim() || !videoTitle.trim()) {
      setUploadError("Please enter both video URL and title.");
      return;
    }
    if (!userId) {
      setUploadError("User not logged in.");
      return;
    }

    const youTubeInfo = getYouTubeInfo(videoUrl);
    if (!youTubeInfo) {
      setUploadError("Please enter a valid YouTube video URL.");
      return;
    }

    setIsUploading(true);
    try {
      // Fetch current user's username
      const userProfileRef = doc(db, `artifacts/${appId}/users/${userId}/profile/${userId}`);
      const userDoc = await getDoc(userProfileRef);
      const username = userDoc.exists() ? userDoc.data().username : 'Anonymous';


      // Path for public videos: /artifacts/{appId}/public/data/videos
      const videosColRef = collection(db, `artifacts/${appId}/public/data/videos`);
      await addDoc(videosColRef, {
        userId: userId,
        userName: username, // Store username with video for display
        youtubeUrl: videoUrl,
        title: videoTitle.trim(),
        thumbnailUrl: youTubeInfo.thumbnailUrl,
        viewsCount: 0,
        likesCount: 0,
        timestamp: new Date()
      });
      setShowSuccessModal(true);
      setVideoUrl('');
      setVideoTitle('');
    } catch (error) {
      console.error("Error uploading video:", error);
      setUploadError("Failed to upload video. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-orange-400">Upload New Video</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 text-gray-300">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="videoUrl" className="block text-gray-300 text-sm font-semibold mb-2">
              YouTube Video URL:
            </label>
            <input
              type="text"
              id="videoUrl"
              className="w-full p-3 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="e.g., https://youtu.be/WC2FUEmKEu8"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="videoTitle" className="block text-gray-300 text-sm font-semibold mb-2">
              Video Title:
            </label>
            <input
              type="text"
              id="videoTitle"
              className="w-full p-3 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Enter video title"
              required
            />
          </div>

          {uploadError && <p className="text-red-500 text-sm mb-4">{uploadError}</p>}

          <button
            type="submit"
            className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-md transition duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isUploading}
          >
            {isUploading && (
              <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isUploading ? 'Uploading...' : 'Upload Video'}
          </button>
        </form>

        <CustomModal
          isOpen={showSuccessModal}
          onClose={() => { setShowSuccessModal(false); onClose(); }}
          title="Success!"
          message="Video uploaded successfully. It will appear in the feed shortly."
        />
      </div>
    </div>
  );
};

// Withdraw Modal (Placeholder)
const WithdrawModal = ({ isOpen, onClose, userId }) => {
    const [amount, setAmount] = useState('');
    const [upiId, setUpiId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionMessage, setSubmissionMessage] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmissionMessage('');
        if (!amount || !upiId) {
            setSubmissionMessage('Please fill all fields.');
            setShowErrorModal(true);
            return;
        }
        if (parseFloat(amount) < 100) {
            setSubmissionMessage('Minimum withdrawal amount is ₹100.');
            setShowErrorModal(true);
            return;
        }

        setIsSubmitting(true);
        try {
            // This is where you'd typically send data to a backend function
            // to process the withdrawal. For this frontend-only app, we'll
            // simulate a successful submission.
            console.log(`Withdrawal Request: User ${userId}, Amount: ₹${amount}, UPI ID: ${upiId}`);
            // In a real app, this would involve Firebase Cloud Functions or your own server
            // to securely record the request and handle the payment process.
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

            setSubmissionMessage('Withdrawal request submitted successfully! Payment will be sent manually via UPI.');
            setShowSuccessModal(true);
            setAmount('');
            setUpiId('');
        } catch (error) {
            console.error("Withdrawal error:", error);
            setSubmissionMessage('Failed to submit withdrawal request. Please try again.');
            setShowErrorModal(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-orange-400">Withdraw Earnings</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 text-gray-300">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <p className="text-gray-300 text-sm mb-4">
                    Minimum withdrawal amount: ₹100. Payments are sent manually via UPI.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="amount" className="block text-gray-300 text-sm font-semibold mb-2">
                            Amount (₹):
                        </label>
                        <input
                            type="number"
                            id="amount"
                            className="w-full p-3 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="e.g., 150"
                            min="100"
                            step="any"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="upiId" className="block text-gray-300 text-sm font-semibold mb-2">
                            Your UPI ID:
                        </label>
                        <input
                            type="text"
                            id="upiId"
                            className="w-full p-3 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            placeholder="e.g., yourname@upi"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-md transition duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isSubmitting}
                    >
                        {isSubmitting && (
                            <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {isSubmitting ? 'Submitting...' : 'Request Withdrawal'}
                    </button>
                </form>

                <CustomModal
                    isOpen={showSuccessModal}
                    onClose={() => { setShowSuccessModal(false); onClose(); }}
                    title="Request Sent!"
                    message={submissionMessage}
                />
                 <CustomModal
                    isOpen={showErrorModal}
                    onClose={() => { setShowErrorModal(false); }}
                    title="Error!"
                    message={submissionMessage}
                />
            </div>
        </div>
    );
};


// Header Component
const Header = ({ onSearchClick, onProfileClick, onUploadClick, onWithdrawClick, currentUserId }) => {
  const { auth } = useContext(FirebaseContext);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log("Signed out successfully.");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-gray-900 bg-opacity-90 backdrop-blur-sm p-4 flex items-center justify-between shadow-lg z-50 rounded-b-xl border-b border-gray-800">
      <div className="flex items-center space-x-3">
        <img src="https://placehold.co/40x40/FF7F50/FFFFFF?text=VF" alt="Video Fire Logo" className="rounded-full" />
        <span className="text-2xl font-extrabold text-orange-500 drop-shadow-md">Video Fire</span>
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={onSearchClick}
          className="p-2 rounded-full hover:bg-gray-700 text-gray-300 transition duration-200"
          title="Search"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </button>
        <button
          onClick={onUploadClick}
          className="p-2 rounded-full bg-orange-600 hover:bg-orange-700 text-white transition duration-200 shadow-md"
          title="Upload Video"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
          </svg>
        </button>
        <button
          onClick={onWithdrawClick}
          className="p-2 rounded-full bg-green-600 hover:bg-green-700 text-white transition duration-200 shadow-md"
          title="Withdraw"
        >
           <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        </button>
        <button
          onClick={onProfileClick}
          className="p-2 rounded-full hover:bg-gray-700 text-gray-300 transition duration-200"
          title="Profile"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
        </button>
        {currentUserId && (
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <span>{currentUserId.substring(0, 4)}...</span>
            <button onClick={handleSignOut} className="p-1 rounded-md text-xs bg-red-600 hover:bg-red-700 text-white">
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};


// Main App Component
const App = () => {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [currentUser, setCurrentUser] = useState(null); // Firebase User object
  const [currentUserId, setCurrentUserId] = useState(null); // Our derived userId (Firebase UID or anonymous ID)
  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'profile'
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false); // To ensure Firestore operations only happen after auth is ready

  // Initialize Firebase and Auth Listener
  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    const firestore = getFirestore(app);
    const authentication = getAuth(app);

    setDb(firestore);
    setAuth(authentication);

    const unsubscribe = onAuthStateChanged(authentication, async (user) => {
      if (user) {
        setCurrentUser(user);
        setCurrentUserId(user.uid);

        // Ensure user profile exists (or create a dummy one)
        const userProfileRef = doc(firestore, `artifacts/${appId}/users/${user.uid}/profile/${user.uid}`);
        const userDoc = await getDoc(userProfileRef);
        if (!userDoc.exists()) {
            await setDoc(userProfileRef, {
                username: `User_${user.uid.substring(0, 6)}`,
                joinedAt: new Date(),
            });
            console.log("New user profile created.");
        }
      } else {
        // Sign in anonymously if no user and no initial token for custom auth
        if (!initialAuthToken) {
            console.log("Signing in anonymously...");
            try {
                const anonUserCredential = await signInAnonymously(authentication);
                setCurrentUser(anonUserCredential.user);
                setCurrentUserId(anonUserCredential.user.uid);
                console.log("Signed in anonymously. User ID:", anonUserCredential.user.uid);

                 // Create profile for anonymous user too
                const userProfileRef = doc(firestore, `artifacts/${appId}/users/${anonUserCredential.user.uid}/profile/${anonUserCredential.user.uid}`);
                const userDoc = await getDoc(userProfileRef);
                if (!userDoc.exists()) {
                    await setDoc(userProfileRef, {
                        username: `AnonUser_${anonUserCredential.user.uid.substring(0, 6)}`,
                        joinedAt: new Date(),
                    });
                }

            } catch (error) {
                console.error("Error signing in anonymously:", error);
            }
        } else {
            console.log("Attempting custom token sign-in...");
            try {
                await signInWithCustomToken(authentication, initialAuthToken);
                // The onAuthStateChanged listener will handle setting currentUser/currentUserId
            } catch (error) {
                console.error("Error signing in with custom token:", error);
                // Fallback to anonymous if custom token fails
                try {
                    const anonUserCredential = await signInAnonymously(authentication);
                    setCurrentUser(anonUserCredential.user);
                    setCurrentUserId(anonUserCredential.user.uid);
                    console.log("Fallback to anonymous sign-in successful.");
                } catch (anonError) {
                    console.error("Error with anonymous fallback:", anonError);
                }
            }
        }
      }
      setAuthReady(true); // Auth state is determined
    });

    // Load Google IMA SDK (for VAST ads)
    const imaScript = document.createElement('script');
    imaScript.src = "https://imasdk.googleapis.com/js/sdkloader/ima3.js";
    imaScript.async = true;
    document.head.appendChild(imaScript);


    return () => {
      unsubscribe();
      document.head.removeChild(imaScript);
    };
  }, []); // Empty dependency array means this runs once on mount

  const renderPage = () => {
    if (!authReady || !db || !auth) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
          <svg className="animate-spin h-10 w-10 text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-3">Initializing App...</span>
        </div>
      );
    }

    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'profile':
        return <ProfilePage userId={currentUserId} />;
      // case 'search':
      //   return <SearchPage />; // Placeholder
      // case 'people':
      //   return <PeoplePage />; // Placeholder
      // case 'list':
      //   return <ListPage />; // Placeholder
      default:
        return <HomePage />;
    }
  };

  return (
    <FirebaseContext.Provider value={{ db, auth, currentUser, currentUserId }}>
      <div className="min-h-screen bg-gray-950 font-inter text-white flex flex-col">
        <Header
          onSearchClick={() => console.log('Search clicked')} // Implement actual search later
          onProfileClick={() => setCurrentPage('profile')}
          onUploadClick={() => setUploadModalOpen(true)}
          onWithdrawClick={() => setWithdrawModalOpen(true)}
          currentUserId={currentUserId}
        />

        <main className="flex-1 mt-[70px] mb-[60px] flex justify-center items-center"> {/* Adjusted margin for header/footer */}
          {renderPage()}
        </main>

        <footer className="fixed bottom-0 left-0 right-0 bg-gray-900 bg-opacity-90 backdrop-blur-sm p-3 flex items-center justify-around shadow-lg z-50 rounded-t-xl border-t border-gray-800">
          <button
            onClick={() => setCurrentPage('home')}
            className={`flex flex-col items-center p-2 rounded-lg transition duration-200 ${currentPage === 'home' ? 'text-orange-500 bg-gray-800' : 'text-gray-400 hover:bg-gray-700'}`}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m0 0l-7 7-7-7M19 10v10a1 1 0 01-1 1h-3"></path>
            </svg>
            <span className="text-xs mt-1">Home</span>
          </button>
          <button
            onClick={() => console.log('People clicked')}
            className={`flex flex-col items-center p-2 rounded-lg transition duration-200 text-gray-400 hover:bg-gray-700`}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h2a2 2 0 002-2V4a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h2m0 0a2 2 0 100 4 2 2 0 000-4zm0 0H9m4 0h4m-4 0a2 2 0 100 4 2 2 0 000-4zm0 0H9"></path>
            </svg>
            <span className="text-xs mt-1">People</span>
          </button>
          <button
            onClick={() => setUploadModalOpen(true)}
            className={`flex flex-col items-center p-2 rounded-lg transition duration-200 ${uploadModalOpen ? 'text-orange-500 bg-gray-800' : 'text-gray-400 hover:bg-gray-700'}`}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
            </svg>
            <span className="text-xs mt-1">Upload</span>
          </button>
          <button
            onClick={() => setCurrentPage('profile')}
            className={`flex flex-col items-center p-2 rounded-lg transition duration-200 ${currentPage === 'profile' ? 'text-orange-500 bg-gray-800' : 'text-gray-400 hover:bg-gray-700'}`}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            <span className="text-xs mt-1">Profile</span>
          </button>
        </footer>

        <UploadVideoModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          userId={currentUserId}
        />
        <WithdrawModal
            isOpen={withdrawModalOpen}
            onClose={() => setWithdrawModalOpen(false)}
            userId={currentUserId}
        />
      </div>
    </FirebaseContext.Provider>
  );
};

export default App;
