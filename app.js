<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Video Fire</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Google IMA SDK for VAST Ads -->
    <script src="https://imasdk.googleapis.com/js/sdkloader/ima3.js"></script>
    <style>
        body {
            font-family: 'Inter', sans-serif; /* Using Inter font */
            background-color: #0d0d0d; /* Darkest background */
            margin: 0;
            padding: 0;
            overflow: hidden; /* Prevent body scroll, main content will scroll */
        }
        .hide-scrollbar::-webkit-scrollbar {
            display: none; /* For Chrome, Safari, Opera */
        }
        .hide-scrollbar {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
        }
        .snap-mandatory {
            scroll-snap-type: y mandatory;
        }
        .snap-center {
            scroll-snap-align: center;
        }
        /* Custom animation for ad message */
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(-20px); }
            10% { opacity: 1; transform: translateY(0); }
            90% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-20px); }
        }
        .animate-fade-in-out {
            animation: fadeInOut 3s ease-in-out forwards;
        }
        /* Full screen ad container */
        #ima-ad-container {
            width: 100vw;
            height: 100vh;
            position: absolute;
            top: 0;
            left: 0;
            background-color: black;
            z-index: 100; /* Ensure it's above everything else */
            display: none; /* Hidden by default */
            align-items: center;
            justify-content: center;
        }
    </style>
</head>
<body class="bg-gray-950 text-white min-h-screen flex flex-col">

    <!-- Global Ad Container for IMA SDK (hidden by default) -->
    <div id="ima-ad-container" class="bg-black flex flex-col items-center justify-center">
        <div class="text-white text-lg font-bold mb-4 flex items-center">
            <svg class="animate-pulse h-6 w-6 mr-2 text-orange-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>
            <span>Ad playing...</span>
        </div>
        <svg class="animate-spin h-8 w-8 text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>

    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 bg-gray-900 bg-opacity-90 backdrop-blur-sm p-4 flex items-center justify-between shadow-lg z-50 rounded-b-xl border-b border-gray-800">
        <div class="flex items-center space-x-3">
            <img src="https://placehold.co/40x40/FF7F50/FFFFFF?text=VF" alt="Video Fire Logo" class="rounded-full" />
            <span class="text-2xl font-extrabold text-orange-500 drop-shadow-md">Video Fire</span>
        </div>
        <div class="flex items-center space-x-4">
            <button id="search-button" class="p-2 rounded-full hover:bg-gray-700 text-gray-300 transition duration-200" title="Search">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </button>
            <button id="upload-header-button" class="p-2 rounded-full bg-orange-600 hover:bg-orange-700 text-white transition duration-200 shadow-md" title="Upload Video">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            </button>
            <button id="withdraw-header-button" class="p-2 rounded-full bg-green-600 hover:bg-green-700 text-white transition duration-200 shadow-md" title="Withdraw">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </button>
            <button id="profile-header-button" class="p-2 rounded-full hover:bg-gray-700 text-gray-300 transition duration-200" title="Profile">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            </button>
            <div id="user-info" class="flex items-center space-x-2 text-sm text-gray-400 hidden">
                <span id="display-user-id"></span>
                <button id="sign-out-button" class="p-1 rounded-md text-xs bg-red-600 hover:bg-red-700 text-white">Sign Out</button>
            </div>
        </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 mt-[70px] mb-[60px] flex justify-center items-center">
        <!-- Home Page (Video Feed) -->
        <div id="home-page" class="w-full h-full overflow-y-scroll snap-y snap-mandatory bg-gray-950 hide-scrollbar">
            <div id="video-feed-container" class="w-full h-full">
                <!-- Videos will be injected here -->
            </div>
            <div id="home-loading" class="flex items-center justify-center h-full text-white hidden">
                <svg class="animate-spin h-10 w-10 text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="ml-3">Loading videos...</span>
            </div>
            <div id="home-error" class="flex items-center justify-center h-full text-red-500 hidden"></div>
            <div id="no-videos-message" class="flex items-center justify-center h-full text-white text-lg hidden">
                No videos available. Upload some!
            </div>
        </div>

        <!-- Profile Page -->
        <div id="profile-page" class="hidden p-6 bg-gray-950 min-h-full w-full overflow-y-auto hide-scrollbar">
            <div class="max-w-4xl mx-auto">
                <div class="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8 bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800">
                    <img id="profile-avatar" src="https://placehold.co/100x100/374151/E5E7EB?text=U" alt="Profile Avatar" class="w-24 h-24 rounded-full border-4 border-orange-500 shadow-md" />
                    <div>
                        <h1 id="profile-username" class="text-3xl font-extrabold text-orange-400 mb-1"></h1>
                        <p class="text-gray-400">User ID: <span id="profile-user-id"></span></p>
                        <p class="text-gray-300 mt-2">Total Uploads: <span id="profile-uploads-count">0</span></p>
                    </div>
                </div>

                <h2 class="text-2xl font-bold mb-6 text-orange-300">My Uploads</h2>
                <div id="user-videos-container" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- User videos will be injected here -->
                </div>
                <p id="no-user-videos-message" class="text-gray-400 text-center py-8 bg-gray-900 rounded-lg border border-gray-800 hidden">
                    You haven't uploaded any videos yet.
                </p>
                <div id="profile-loading" class="flex justify-center items-center h-48 text-white hidden">Loading profile...</div>
                <div id="profile-error" class="text-red-500 text-center mt-8 hidden"></div>
            </div>
        </div>

        <!-- Search Page (Placeholder) -->
        <div id="search-page" class="hidden flex items-center justify-center h-full w-full bg-gray-950 text-white text-3xl font-bold">
            Search Functionality Coming Soon!
        </div>
        <!-- People Page (Placeholder) -->
        <div id="people-page" class="hidden flex items-center justify-center h-full w-full bg-gray-950 text-white text-3xl font-bold">
            People/Follow Functionality Coming Soon!
        </div>

    </main>

    <!-- Footer -->
    <footer class="fixed bottom-0 left-0 right-0 bg-gray-900 bg-opacity-90 backdrop-blur-sm p-3 flex items-center justify-around shadow-lg z-50 rounded-t-xl border-t border-gray-800">
        <button id="home-footer-button" class="flex flex-col items-center p-2 rounded-lg transition duration-200 text-orange-500 bg-gray-800">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m0 0l-7 7-7-7M19 10v10a1 1 0 01-1 1h-3"></path></svg>
            <span class="text-xs mt-1">Home</span>
        </button>
        <button id="people-footer-button" class="flex flex-col items-center p-2 rounded-lg transition duration-200 text-gray-400 hover:bg-gray-700">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h2a2 2 0 002-2V4a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h2m0 0a2 2 0 100 4 2 2 0 000-4zm0 0H9m4 0h4m-4 0a2 2 0 100 4 2 2 0 000-4zm0 0H9"></path></svg>
            <span class="text-xs mt-1">People</span>
        </button>
        <button id="upload-footer-button" class="flex flex-col items-center p-2 rounded-lg transition duration-200 text-gray-400 hover:bg-gray-700">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            <span class="text-xs mt-1">Upload</span>
        </button>
        <button id="profile-footer-button" class="flex flex-col items-center p-2 rounded-lg transition duration-200 text-gray-400 hover:bg-gray-700">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            <span class="text-xs mt-1">Profile</span>
        </button>
    </footer>

    <!-- Custom Modal Structure -->
    <div id="custom-modal" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1000] p-4 hidden">
        <div class="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700 max-w-sm w-full text-white text-center">
            <h3 id="custom-modal-title" class="text-xl font-bold mb-4 text-orange-400"></h3>
            <p id="custom-modal-message" class="mb-6 text-gray-300"></p>
            <div class="flex justify-center space-x-4">
                <button id="custom-modal-confirm-button" class="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-md font-semibold transition duration-200 hidden">Confirm</button>
                <button id="custom-modal-close-button" class="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-md font-semibold transition duration-200">Close</button>
            </div>
        </div>
    </div>

    <!-- Comment Modal Structure -->
    <div id="comment-modal" class="fixed inset-0 bg-black bg-opacity-80 flex items-end justify-center z-[900] p-0 hidden">
        <div class="bg-gray-800 w-full max-w-lg h-3/4 rounded-t-2xl shadow-lg flex flex-col overflow-hidden">
            <div class="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900">
                <h2 class="text-xl font-bold text-orange-400">Comments</h2>
                <button id="comment-modal-close-button" class="p-2 rounded-full hover:bg-gray-700 text-gray-300">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <div id="comment-list" class="flex-1 overflow-y-auto p-4 hide-scrollbar">
                <div id="comment-loading" class="flex justify-center items-center h-full text-white hidden">
                    <svg class="animate-spin h-6 w-6 text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span class="ml-2 text-gray-300">Loading comments...</span>
                </div>
                <p id="no-comments-message" class="text-gray-400 text-center mt-4 hidden">No comments yet. Be the first!</p>
                <!-- Comments will be injected here -->
            </div>
            <div class="p-4 border-t border-gray-700 bg-gray-900">
                <div class="flex space-x-2">
                    <input type="text" id="new-comment-input" class="flex-1 p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600" placeholder="Add a comment..." />
                    <button id="add-comment-button" class="px-5 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold text-white transition duration-200">Post</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Upload Video Modal Structure -->
    <div id="upload-video-modal" class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[900] p-4 hidden">
        <div class="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-orange-400">Upload New Video</h2>
                <button id="upload-modal-close-button" class="p-2 rounded-full hover:bg-gray-700 text-gray-300">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <form id="upload-video-form">
                <div class="mb-4">
                    <label for="video-url-input" class="block text-gray-300 text-sm font-semibold mb-2">YouTube Video URL:</label>
                    <input type="text" id="video-url-input" class="w-full p-3 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600" placeholder="e.g., https://youtu.be/WC2FUEmKEu8" required />
                </div>
                <div class="mb-6">
                    <label for="video-title-input" class="block text-gray-300 text-sm font-semibold mb-2">Video Title:</label>
                    <input type="text" id="video-title-input" class="w-full p-3 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600" placeholder="Enter video title" required />
                </div>
                <p id="upload-error-message" class="text-red-500 text-sm mb-4 hidden"></p>
                <button type="submit" id="upload-submit-button" class="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-md transition duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                    <span id="upload-button-text">Upload Video</span>
                    <svg id="upload-loading-spinner" class="animate-spin h-5 w-5 ml-3 text-white hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </button>
            </form>
        </div>
    </div>

    <!-- Withdraw Modal Structure -->
    <div id="withdraw-modal" class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[900] p-4 hidden">
        <div class="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-orange-400">Withdraw Earnings</h2>
                <button id="withdraw-modal-close-button" class="p-2 rounded-full hover:bg-gray-700 text-gray-300">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <p class="text-gray-300 text-sm mb-4">
                Minimum withdrawal amount: ₹100. Payments are sent manually via UPI.
            </p>
            <form id="withdraw-form">
                <div class="mb-4">
                    <label for="withdraw-amount-input" class="block text-gray-300 text-sm font-semibold mb-2">Amount (₹):</label>
                    <input type="number" id="withdraw-amount-input" class="w-full p-3 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600" placeholder="e.g., 150" min="100" step="any" required />
                </div>
                <div class="mb-6">
                    <label for="upi-id-input" class="block text-gray-300 text-sm font-semibold mb-2">Your UPI ID:</label>
                    <input type="text" id="upi-id-input" class="w-full p-3 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600" placeholder="e.g., yourname@upi" required />
                </div>
                <p id="withdraw-error-message" class="text-red-500 text-sm mb-4 hidden"></p>
                <button type="submit" id="withdraw-submit-button" class="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-md transition duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                    <span id="withdraw-button-text">Request Withdrawal</span>
                    <svg id="withdraw-loading-spinner" class="animate-spin h-5 w-5 ml-3 text-white hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </button>
            </form>
        </div>
    </div>


    <!-- Firebase SDKs -->
    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import { getFirestore, doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

        // --- Global Variables ---
        let app;
        let db;
        let auth;
        let currentUserId = null;
        let authReady = false; // Flag to indicate if Firebase auth is initialized
        let currentPage = 'home'; // 'home', 'profile', 'search', 'people'
        let currentVideoIdForComments = null;

        // Firebase Configuration (from provided data)
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
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

        // VAST Ad Tag URL
        const vastAdTagUrl = "https://assured-sandwich.com/dsm/Fzz.daGsN/vNZUGoUR/oeRmF9OufZFUylok/PkTDYe0zM/jfQp0zOlTvYDt/NIjTQyyGNQDsQr5tNoycZQseaKWo1lpFdWDU0ix-";

        // --- DOM Elements ---
        const homePage = document.getElementById('home-page');
        const profilePage = document.getElementById('profile-page');
        const searchPage = document.getElementById('search-page');
        const peoplePage = document.getElementById('people-page');
        const videoFeedContainer = document.getElementById('video-feed-container');

        const homeLoading = document.getElementById('home-loading');
        const homeError = document.getElementById('home-error');
        const noVideosMessage = document.getElementById('no-videos-message');

        const profileUsername = document.getElementById('profile-username');
        const profileUserId = document.getElementById('profile-user-id');
        const profileUploadsCount = document.getElementById('profile-uploads-count');
        const userVideosContainer = document.getElementById('user-videos-container');
        const noUserVideosMessage = document.getElementById('no-user-videos-message');
        const profileLoading = document.getElementById('profile-loading');
        const profileError = document.getElementById('profile-error');

        const customModal = document.getElementById('custom-modal');
        const customModalTitle = document.getElementById('custom-modal-title');
        const customModalMessage = document.getElementById('custom-modal-message');
        const customModalConfirmButton = document.getElementById('custom-modal-confirm-button');
        const customModalCloseButton = document.getElementById('custom-modal-close-button');

        const commentModal = document.getElementById('comment-modal');
        const commentModalCloseButton = document.getElementById('comment-modal-close-button');
        const commentList = document.getElementById('comment-list');
        const commentLoading = document.getElementById('comment-loading');
        const noCommentsMessage = document.getElementById('no-comments-message');
        const newCommentInput = document.getElementById('new-comment-input');
        const addCommentButton = document.getElementById('add-comment-button');

        const uploadVideoModal = document.getElementById('upload-video-modal');
        const uploadModalCloseButton = document.getElementById('upload-modal-close-button');
        const uploadVideoForm = document.getElementById('upload-video-form');
        const videoUrlInput = document.getElementById('video-url-input');
        const videoTitleInput = document.getElementById('video-title-input');
        const uploadErrorMessage = document.getElementById('upload-error-message');
        const uploadSubmitButton = document.getElementById('upload-submit-button');
        const uploadButtonText = document.getElementById('upload-button-text');
        const uploadLoadingSpinner = document.getElementById('upload-loading-spinner');

        const withdrawModal = document.getElementById('withdraw-modal');
        const withdrawModalCloseButton = document.getElementById('withdraw-modal-close-button');
        const withdrawForm = document.getElementById('withdraw-form');
        const withdrawAmountInput = document.getElementById('withdraw-amount-input');
        const upiIdInput = document.getElementById('upi-id-input');
        const withdrawErrorMessage = document.getElementById('withdraw-error-message');
        const withdrawSubmitButton = document.getElementById('withdraw-submit-button');
        const withdrawButtonText = document.getElementById('withdraw-button-text');
        const withdrawLoadingSpinner = document.getElementById('withdraw-loading-spinner');

        const imaAdContainer = document.getElementById('ima-ad-container'); // Global IMA ad container

        const displayUserId = document.getElementById('display-user-id');
        const userInfo = document.getElementById('user-info');
        const signOutButton = document.getElementById('sign-out-button');


        // --- Utility Functions ---

        /**
         * Parses a YouTube URL to extract video ID, embed URL, and thumbnail URL.
         * @param {string} url - The YouTube video URL.
         * @returns {object|null} An object with videoId, embedUrl, thumbnailUrl, or null if invalid.
         */
        function getYouTubeInfo(url) {
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
        }

        /**
         * Shows a custom modal dialog.
         * @param {string} title - The title of the modal.
         * @param {string} message - The message content.
         * @param {boolean} showConfirmButton - Whether to show a confirm button.
         * @param {function} onConfirm - Callback for confirm button.
         * @param {function} onClose - Callback for close button.
         */
        function showCustomModal(title, message, showConfirmButton = false, onConfirm = () => {}, onClose = () => {}) {
            customModalTitle.textContent = title;
            customModalMessage.textContent = message;
            customModalConfirmButton.onclick = () => { onConfirm(); closeModal('custom'); };
            customModalCloseButton.onclick = () => { onClose(); closeModal('custom'); };

            if (showConfirmButton) {
                customModalConfirmButton.classList.remove('hidden');
            } else {
                customModalConfirmButton.classList.add('hidden');
            }
            customModal.classList.remove('hidden');
        }

        /**
         * Closes a specific modal.
         * @param {string} modalName - The name of the modal ('custom', 'comment', 'upload', 'withdraw').
         */
        function closeModal(modalName) {
            switch (modalName) {
                case 'custom':
                    customModal.classList.add('hidden');
                    break;
                case 'comment':
                    commentModal.classList.add('hidden');
                    currentVideoIdForComments = null;
                    break;
                case 'upload':
                    uploadVideoModal.classList.add('hidden');
                    uploadVideoForm.reset(); // Clear form
                    uploadErrorMessage.classList.add('hidden');
                    break;
                case 'withdraw':
                    withdrawModal.classList.add('hidden');
                    withdrawForm.reset();
                    withdrawErrorMessage.classList.add('hidden');
                    break;
            }
        }


        // --- Firebase Initialization ---

        /**
         * Initializes Firebase and sets up authentication listener.
         */
        async function initializeFirebase() {
            try {
                app = initializeApp(firebaseConfig);
                db = getFirestore(app);
                auth = getAuth(app);

                // Auth state listener
                onAuthStateChanged(auth, async (user) => {
                    if (user) {
                        currentUserId = user.uid;
                        console.log("Firebase user changed:", user.uid);
                        displayUserId.textContent = currentUserId;
                        userInfo.classList.remove('hidden'); // Show user info

                        // Ensure user profile exists (or create a dummy one)
                        const userProfileRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile/${user.uid}`);
                        const userDoc = await getDoc(userProfileRef);
                        if (!userDoc.exists()) {
                            await setDoc(userProfileRef, {
                                username: `User_${user.uid.substring(0, 6)}`,
                                joinedAt: serverTimestamp(),
                            });
                            console.log("New user profile created for UID:", user.uid);
                        }
                    } else {
                        currentUserId = null;
                        displayUserId.textContent = '';
                        userInfo.classList.add('hidden'); // Hide user info
                        // Attempt anonymous sign-in if no user and no initial custom token
                        if (!initialAuthToken) {
                            try {
                                console.log("Attempting anonymous sign-in...");
                                const anonUserCredential = await signInAnonymously(auth);
                                currentUserId = anonUserCredential.user.uid;
                                console.log("Signed in anonymously. User ID:", currentUserId);
                                displayUserId.textContent = currentUserId;
                                userInfo.classList.remove('hidden');

                                // Create profile for anonymous user too
                                const userProfileRef = doc(db, `artifacts/${appId}/users/${currentUserId}/profile/${currentUserId}`);
                                const userDoc = await getDoc(userProfileRef);
                                if (!userDoc.exists()) {
                                    await setDoc(userProfileRef, {
                                        username: `AnonUser_${currentUserId.substring(0, 6)}`,
                                        joinedAt: serverTimestamp(),
                                    });
                                }

                            } catch (error) {
                                console.error("Error signing in anonymously:", error);
                                showCustomModal('Authentication Error', 'Failed to sign in anonymously. Please try refreshing the page.', false);
                            }
                        } else {
                            // If initialAuthToken is present, it means a custom token login is expected.
                            // The onAuthStateChanged listener will eventually pick up the user if successful.
                            console.log("Waiting for custom token sign-in or a user session...");
                        }
                    }
                    authReady = true; // Firebase auth has completed its initial check
                    // After auth is ready, load the current page content
                    showPage(currentPage);
                });

                // Use the initialAuthToken if available
                if (initialAuthToken) {
                    try {
                        await signInWithCustomToken(auth, initialAuthToken);
                        console.log("Signed in with custom token.");
                    } catch (error) {
                        console.error("Error signing in with custom token:", error);
                        showCustomModal('Authentication Error', 'Failed to sign in with provided token. Trying anonymous login.', false);
                        // onAuthStateChanged will handle fallback to anonymous if token sign-in fails
                    }
                }

                console.log("Firebase initialized.");

            } catch (error) {
                console.error("Failed to initialize Firebase:", error);
                showCustomModal('Initialization Error', 'Failed to initialize the application. Please check console for details.', false);
                authReady = false;
                // Display a full-screen error message
                homePage.innerHTML = `
                    <div class="flex items-center justify-center h-full text-red-500 text-center">
                        <p class="text-xl">Error initializing app: ${error.message}<br>Please try again.</p>
                    </div>
                `;
                homePage.classList.remove('hidden');
                profilePage.classList.add('hidden');
                searchPage.classList.add('hidden');
                peoplePage.classList.add('hidden');
            }
        }


        // --- UI Navigation and Rendering ---

        /**
         * Shows the specified page and hides others.
         * @param {string} pageName - The name of the page to show ('home', 'profile', 'search', 'people').
         */
        function showPage(pageName) {
            currentPage = pageName;
            const pages = [homePage, profilePage, searchPage, peoplePage];
            const footerButtons = {
                'home': document.getElementById('home-footer-button'),
                'people': document.getElementById('people-footer-button'),
                'upload': document.getElementById('upload-footer-button'), // Note: Upload is a modal, but button is here
                'profile': document.getElementById('profile-footer-button')
            };

            pages.forEach(page => page.classList.add('hidden'));

            Object.values(footerButtons).forEach(btn => {
                if(btn) btn.classList.remove('text-orange-500', 'bg-gray-800');
                if(btn) btn.classList.add('text-gray-400', 'hover:bg-gray-700');
            });

            switch (pageName) {
                case 'home':
                    homePage.classList.remove('hidden');
                    footerButtons['home'].classList.add('text-orange-500', 'bg-gray-800');
                    footerButtons['home'].classList.remove('text-gray-400', 'hover:bg-gray-700');
                    updateVideoFeed(); // Load videos when home is shown
                    break;
                case 'profile':
                    profilePage.classList.remove('hidden');
                    footerButtons['profile'].classList.add('text-orange-500', 'bg-gray-800');
                    footerButtons['profile'].classList.remove('text-gray-400', 'hover:bg-gray-700');
                    updateProfilePage(); // Load profile data when profile is shown
                    break;
                case 'search':
                    searchPage.classList.remove('hidden');
                    // No footer button for search currently, just header
                    break;
                case 'people':
                    peoplePage.classList.remove('hidden');
                    footerButtons['people'].classList.add('text-orange-500', 'bg-gray-800');
                    footerButtons['people'].classList.remove('text-gray-400', 'hover:bg-gray-700');
                    break;
            }
        }

        /**
         * Updates the video feed on the home page.
         */
        async function updateVideoFeed() {
            if (!authReady || !db) {
                console.log("Firebase not ready for video feed.");
                return;
            }

            homeLoading.classList.remove('hidden');
            homeError.classList.add('hidden');
            noVideosMessage.classList.add('hidden');
            videoFeedContainer.innerHTML = ''; // Clear previous videos

            try {
                // Path for public videos: /artifacts/{appId}/public/data/videos
                const videosColRef = collection(db, `artifacts/${appId}/public/data/videos`);
                const q = query(videosColRef);

                onSnapshot(q, async (snapshot) => {
                    let videoList = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                    // Client-side sort by timestamp (descending)
                    videoList.sort((a, b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0));

                    if (videoList.length === 0) {
                        noVideosMessage.classList.remove('hidden');
                        homeLoading.classList.add('hidden');
                        return;
                    }

                    videoFeedContainer.innerHTML = ''; // Clear existing videos before re-rendering
                    for (const video of videoList) {
                        const videoCard = createVideoCardElement(video);
                        videoFeedContainer.appendChild(videoCard);
                    }
                    homeLoading.classList.add('hidden');
                    noVideosMessage.classList.add('hidden');

                }, (err) => {
                    console.error("Error fetching videos:", err);
                    homeError.textContent = `Failed to load videos: ${err.message}`;
                    homeError.classList.remove('hidden');
                    homeLoading.classList.add('hidden');
                });

            } catch (error) {
                console.error("Error setting up video feed listener:", error);
                homeError.textContent = `Error: ${error.message}`;
                homeError.classList.remove('hidden');
                homeLoading.classList.add('hidden');
            }
        }

        /**
         * Creates an HTML element for a single video card.
         * @param {object} video - The video data.
         * @returns {HTMLElement} The video card element.
         */
        function createVideoCardElement(video) {
            const videoCard = document.createElement('div');
            videoCard.id = `video-card-${video.id}`;
            videoCard.className = 'relative flex-shrink-0 w-full h-full snap-center bg-gray-900 rounded-lg overflow-hidden border border-gray-800 shadow-xl';

            const youTubeInfo = getYouTubeInfo(video.youtubeUrl);
            const thumbnailUrl = youTubeInfo ? youTubeInfo.thumbnailUrl : 'https://placehold.co/1280x720/000000/FFFFFF?text=Invalid+Video+URL';

            videoCard.innerHTML = `
                <!-- Video Player Container -->
                <div id="player-container-${video.id}" class="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
                    <!-- Thumbnail placeholder for ad loading -->
                    <img id="thumbnail-${video.id}" src="${thumbnailUrl}" alt="Video Thumbnail" class="absolute inset-0 w-full h-full object-cover z-10" />
                    <!-- Ad Overlay -->
                    <div id="ad-overlay-${video.id}" class="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40 text-white text-lg font-bold hidden">
                        <svg class="animate-pulse h-6 w-6 mr-2 text-orange-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>
                        <span class="text-gray-300">Ad playing...</span>
                    </div>
                    <!-- Ad message after ad finishes -->
                    <div id="ad-message-${video.id}" class="absolute top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold animate-fade-in-out z-40 hidden">
                        Video playing soon!
                    </div>
                    <!-- Actual YouTube iframe will be dynamically added here -->
                    <div id="youtube-iframe-wrapper-${video.id}" class="w-full h-full hidden"></div>
                </div>

                <!-- Video Info and Controls -->
                <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent flex flex-col justify-end text-white z-10">
                    <!-- Adstreaa Banner 468x60 -->
                    <div class="mb-4 w-full flex justify-center">
                        <div class="w-[468px] h-[60px] bg-gray-800 rounded-md flex items-center justify-center text-xs text-gray-400 border border-gray-700">
                            Banner 468x60 Ad (Adstreaa)
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
                        </div>
                    </div>

                    <h2 class="text-xl font-bold mb-2 text-orange-300 drop-shadow">${video.title}</h2>
                    <p class="text-sm text-gray-300 mb-4 drop-shadow">By ${video.userName || 'Anonymous User'} | ${video.viewsCount || 0} views</p>

                    <!-- Social Buttons -->
                    <div class="flex items-center space-x-6 text-xl">
                        <button id="like-button-${video.id}" class="flex items-center space-x-1 p-2 rounded-full hover:bg-gray-700 transition duration-200">
                            <svg class="h-6 w-6 text-gray-300 like-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                            </svg>
                            <span class="text-sm like-count">${video.likesCount || 0}</span>
                        </button>
                        <button id="comment-button-${video.id}" class="flex items-center space-x-1 p-2 rounded-full hover:bg-gray-700 transition duration-200">
                            <svg class="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                            </svg>
                            <span class="text-sm">Comments</span>
                        </button>
                        <button class="flex items-center space-x-1 p-2 rounded-full hover:bg-gray-700 transition duration-200">
                            <svg class="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.516 3.832a3 3 0 00.512-1.632V12c0-.36-.062-.716-.184-1.049m0 2.098L8.684 10.658m10.158-1.342a3 3 0 110-2.684m0 2.684l-6.516-3.832a3 3 0 00-.512 1.632V12c0 .36.062.716.184 1.049m0-2.098L18.842 8.658"></path>
                            </svg>
                            <span class="text-sm">Share</span>
                        </button>
                    </div>

                    <!-- Hilltops MultiTag: Banner 300x250 -->
                    <div class="mt-4 w-full flex justify-center">
                        <div class="w-[300px] h-[250px] bg-gray-800 rounded-md flex items-center justify-center text-xs text-gray-400 border border-gray-700">
                            Banner 300x250 Ad (Hilltops)
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
                            })({});     
                            </script>
                        </div>
                    </div>
                </div>
            `;

            // Attach event listeners after element is in DOM
            videoCard.querySelector(`#like-button-${video.id}`).addEventListener('click', () => handleLike(video.id));
            videoCard.querySelector(`#comment-button-${video.id}`).addEventListener('click', () => openCommentModal(video.id));

            // Set up real-time like count listener
            const likeCountSpan = videoCard.querySelector(`#like-button-${video.id} .like-count`);
            const likeIcon = videoCard.querySelector(`#like-button-${video.id} .like-icon`);
            const likeRef = doc(db, `artifacts/${appId}/public/data/videos/${video.id}`);
            onSnapshot(likeRef, (docSnap) => {
                if (docSnap.exists()) {
                    const currentLikes = docSnap.data().likesCount || 0;
                    likeCountSpan.textContent = currentLikes;
                }
            });

            // Check initial like status
            if (currentUserId) {
                const userLikeRef = doc(db, `artifacts/${appId}/public/data/likes/${video.id}_${currentUserId}`);
                getDoc(userLikeRef).then(docSnap => {
                    if (docSnap.exists()) {
                        likeIcon.classList.remove('text-gray-300');
                        likeIcon.classList.add('text-red-500', 'fill-current');
                        // Replace SVG path for filled heart
                        likeIcon.innerHTML = '<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.64a5.5 5.5 0 000-7.78z" fill="currentColor"></path>';
                    }
                }).catch(error => console.error("Error checking initial like status:", error));
            }


            // Play ad then video
            const playerContainer = videoCard.querySelector(`#player-container-${video.id}`);
            const adOverlay = videoCard.querySelector(`#ad-overlay-${video.id}`);
            const thumbnail = videoCard.querySelector(`#thumbnail-${video.id}`);
            const youtubeIframeWrapper = videoCard.querySelector(`#youtube-iframe-wrapper-${video.id}`);
            const adMessage = videoCard.querySelector(`#ad-message-${video.id}`);


            playVideoWithAd(video, playerContainer, adOverlay, thumbnail, youtubeIframeWrapper, adMessage);

            return videoCard;
        }

        /**
         * Updates the profile page with user-specific data.
         */
        async function updateProfilePage() {
            if (!authReady || !db || !currentUserId) {
                console.log("Firebase or user not ready for profile page.");
                profileLoading.classList.remove('hidden');
                profileError.classList.add('hidden');
                noUserVideosMessage.classList.add('hidden');
                userVideosContainer.innerHTML = '';
                return;
            }

            profileLoading.classList.remove('hidden');
            profileError.classList.add('hidden');
            noUserVideosMessage.classList.add('hidden');
            userVideosContainer.innerHTML = ''; // Clear previous videos

            try {
                // Fetch user details
                const userProfileRef = doc(db, `artifacts/${appId}/users/${currentUserId}/profile/${currentUserId}`);
                const userDoc = await getDoc(userProfileRef);
                const username = userDoc.exists() ? userDoc.data().username : `User: ${currentUserId.substring(0, 8)}...`;
                profileUsername.textContent = username;
                profileUserId.textContent = currentUserId;
                document.getElementById('profile-avatar').src = `https://placehold.co/100x100/374151/E5E7EB?text=${username.charAt(0)}`;


                // Fetch videos uploaded by this user
                const videosColRef = collection(db, `artifacts/${appId}/public/data/videos`);
                const q = query(videosColRef, where('userId', '==', currentUserId));

                onSnapshot(q, (snapshot) => {
                    let userVideos = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                    // Client-side sort by timestamp (descending)
                    userVideos.sort((a, b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0));

                    profileUploadsCount.textContent = userVideos.length;
                    userVideosContainer.innerHTML = ''; // Clear previous

                    if (userVideos.length === 0) {
                        noUserVideosMessage.classList.remove('hidden');
                    } else {
                        noUserVideosMessage.classList.add('hidden');
                        userVideos.forEach(video => {
                            const youTubeInfo = getYouTubeInfo(video.youtubeUrl);
                            const thumbnailUrl = youTubeInfo ? youTubeInfo.thumbnailUrl : 'https://placehold.co/480x360/000/FFF?text=Video+Thumbnail';
                            const videoElement = `
                                <div class="bg-gray-900 rounded-lg overflow-hidden shadow-md border border-gray-800 transform hover:scale-105 transition-transform duration-200 cursor-pointer">
                                    <img src="${thumbnailUrl}" alt="${video.title}" class="w-full h-48 object-cover" />
                                    <div class="p-4">
                                        <h3 class="text-lg font-semibold text-orange-300 truncate">${video.title}</h3>
                                        <p class="text-sm text-gray-400 mt-1">${video.viewsCount || 0} views</p>
                                    </div>
                                </div>
                            `;
                            userVideosContainer.insertAdjacentHTML('beforeend', videoElement);
                        });
                    }
                    profileLoading.classList.add('hidden');
                }, (err) => {
                    console.error("Error fetching user videos:", err);
                    profileError.textContent = `Failed to load user videos: ${err.message}`;
                    profileError.classList.remove('hidden');
                    profileLoading.classList.add('hidden');
                });

            } catch (error) {
                console.error("Error updating profile page:", error);
                profileError.textContent = `Error: ${error.message}`;
                profileError.classList.remove('hidden');
                profileLoading.classList.add('hidden');
            }
        }


        // --- VAST Ad Integration Logic (Google IMA SDK) ---

        let currentAdManager = null;
        let isAdPlaying = false; // Global flag to indicate if an ad is currently playing

        /**
         * Plays a VAST ad using Google IMA SDK before showing the video.
         * @param {object} video - The video data.
         * @param {HTMLElement} playerContainer - The main container for video/ad.
         * @param {HTMLElement} adOverlay - The element to show during ad playback.
         * @param {HTMLElement} thumbnail - The thumbnail element.
         * @param {HTMLElement} youtubeIframeWrapper - The wrapper for the YouTube iframe.
         * @param {HTMLElement} adMessageElement - The element to show message after ad.
         */
        function playVideoWithAd(video, playerContainer, adOverlay, thumbnail, youtubeIframeWrapper, adMessageElement) {
            // Ensure any previous ad manager is destroyed
            if (currentAdManager) {
                currentAdManager.destroy();
                currentAdManager = null;
            }

            // Show global IMA ad container and hide others initially
            imaAdContainer.style.display = 'flex'; // Show the global ad container
            playerContainer.style.display = 'none'; // Hide current video card's player container during global ad

            isAdPlaying = true;
            adOverlay.classList.remove('hidden'); // Show local ad overlay too, for safety/fallback
            thumbnail.classList.remove('hidden');
            youtubeIframeWrapper.classList.add('hidden');
            adMessageElement.classList.add('hidden');

            const adDisplayContainer = new google.ima.AdDisplayContainer(imaAdContainer);
            const adsLoader = new google.ima.AdsLoader(adDisplayContainer);

            // Listen for ad errors
            adsLoader.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, (adErrorEvent) => {
                console.error("Ad error:", adErrorEvent.getError().getMessage());
                showCustomModal('Ad Playback Error', 'Failed to play ad. Continuing to video.', false);
                cleanupAdAndShowVideo(video, playerContainer, thumbnail, youtubeIframeWrapper, adMessageElement);
            }, false);

            // Listen for ads loaded event
            adsLoader.addEventListener(google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, (adsManagerLoadedEvent) => {
                const adsManager = adsManagerLoadedEvent.getAdsManager();
                currentAdManager = adsManager;

                adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, (adErrorEvent) => {
                    console.error("Ad manager error:", adErrorEvent.getError().getMessage());
                    cleanupAdAndShowVideo(video, playerContainer, thumbnail, youtubeIframeWrapper, adMessageElement);
                }, false);

                adsManager.addEventListener(google.ima.AdEvent.Type.ALL_ADS_COMPLETED, () => {
                    console.log("VAST ad completed.");
                    cleanupAdAndShowVideo(video, playerContainer, thumbnail, youtubeIframeWrapper, adMessageElement);
                }, false);

                adsManager.addEventListener(google.ima.AdEvent.Type.LOADED, () => {
                    console.log("Ad LOADED event (before start)");
                }, false);


                try {
                    adsManager.init(imaAdContainer.offsetWidth, imaAdContainer.offsetHeight, google.ima.ViewMode.NORMAL);
                    adsManager.start();
                    console.log("VAST ad started.");
                } catch (adError) {
                    console.error("AdsManager could not be started:", adError);
                    cleanupAdAndShowVideo(video, playerContainer, thumbnail, youtubeIframeWrapper, adMessageElement);
                }
            }, false);

            // Request ads
            const adsRequest = new google.ima.AdsRequest();
            adsRequest.adTagUrl = vastAdTagUrl;
            adsRequest.linearAdSlotWidth = imaAdContainer.offsetWidth;
            adsRequest.linearAdSlotHeight = imaAdContainer.offsetHeight;
            adsRequest.nonLinearAdSlotWidth = imaAdContainer.offsetWidth;
            adsRequest.nonLinearAdSlotHeight = imaAdContainer.offsetHeight;
            adsRequest.setAdWillAutoPlay(true); // Indicate that ads will autoplay

            adDisplayContainer.initialize(); // Initialize ad container before requesting ads
            adsLoader.requestAds(adsRequest);
        }

        /**
         * Cleans up ad manager and reveals the video player.
         * @param {object} video - The video data.
         * @param {HTMLElement} playerContainer - The main container for video/ad.
         * @param {HTMLElement} thumbnail - The thumbnail element.
         * @param {HTMLElement} youtubeIframeWrapper - The wrapper for the YouTube iframe.
         * @param {HTMLElement} adMessageElement - The element to show message after ad.
         */
        function cleanupAdAndShowVideo(video, playerContainer, thumbnail, youtubeIframeWrapper, adMessageElement) {
            if (currentAdManager) {
                currentAdManager.destroy();
                currentAdManager = null;
            }
            imaAdContainer.style.display = 'none'; // Hide the global ad container
            playerContainer.style.display = 'flex'; // Show the video card's player container

            isAdPlaying = false;
            adOverlay.classList.add('hidden'); // Hide local ad overlay
            thumbnail.classList.add('hidden'); // Hide thumbnail
            youtubeIframeWrapper.classList.remove('hidden'); // Show iframe wrapper

            // Add YouTube iframe if not already present
            if (!youtubeIframeWrapper.querySelector('iframe')) {
                const youTubeInfo = getYouTubeInfo(video.youtubeUrl);
                if (youTubeInfo) {
                    youtubeIframeWrapper.innerHTML = `
                        <iframe
                            class="w-full h-full object-cover"
                            src="${youTubeInfo.embedUrl}"
                            frameborder="0"
                            allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                            allowfullscreen
                            title="YouTube video player"
                        ></iframe>
                    `;
                } else {
                    youtubeIframeWrapper.innerHTML = `<div class="text-red-500 text-center">Invalid YouTube URL</div>`;
                }
            }

            adMessageElement.classList.remove('hidden');
            setTimeout(() => {
                adMessageElement.classList.add('hidden');
            }, 3000); // Hide message after 3 seconds
        }


        // --- Social Interactions (Like, Comment) ---

        /**
         * Handles the like/unlike action for a video.
         * @param {string} videoId - The ID of the video.
         */
        async function handleLike(videoId) {
            if (!currentUserId || !db) {
                showCustomModal('Action Required', 'Please ensure you are signed in to like videos.', false);
                return;
            }

            const likeRef = doc(db, `artifacts/${appId}/public/data/likes/${videoId}_${currentUserId}`);
            const videoRef = doc(db, `artifacts/${appId}/public/data/videos/${videoId}`);

            try {
                const docSnap = await getDoc(likeRef);
                const isLiked = docSnap.exists();

                const likeIcon = document.querySelector(`#like-button-${videoId} .like-icon`);
                let currentLikes = parseInt(document.querySelector(`#like-button-${videoId} .like-count`).textContent);

                if (isLiked) {
                    // Unlike
                    await deleteDoc(likeRef);
                    await updateDoc(videoRef, {
                        likesCount: Math.max(0, currentLikes - 1)
                    });
                    likeIcon.classList.remove('text-red-500', 'fill-current');
                    likeIcon.classList.add('text-gray-300');
                    likeIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>';
                } else {
                    // Like
                    await setDoc(likeRef, { videoId: videoId, userId: currentUserId, timestamp: serverTimestamp() });
                    await updateDoc(videoRef, {
                        likesCount: (currentLikes || 0) + 1
                    });
                    likeIcon.classList.remove('text-gray-300');
                    likeIcon.classList.add('text-red-500', 'fill-current');
                    likeIcon.innerHTML = '<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.64a5.5 5.5 0 000-7.78z" fill="currentColor"></path>';
                }
            } catch (error) {
                console.error("Error toggling like:", error);
                showCustomModal('Error', `Failed to update like: ${error.message}`, false);
            }
        }

        /**
         * Opens the comment modal for a specific video.
         * @param {string} videoId - The ID of the video to comment on.
         */
        function openCommentModal(videoId) {
            currentVideoIdForComments = videoId;
            commentModal.classList.remove('hidden');
            loadComments(videoId);
        }

        /**
         * Loads and displays comments for a given video.
         * @param {string} videoId - The ID of the video.
         */
        async function loadComments(videoId) {
            commentList.innerHTML = ''; // Clear previous comments
            commentLoading.classList.remove('hidden');
            noCommentsMessage.classList.add('hidden');

            try {
                const commentsColRef = collection(db, `artifacts/${appId}/public/data/comments`);
                const q = query(commentsColRef, where('videoId', '==', videoId));

                onSnapshot(q, async (snapshot) => {
                    let fetchedComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                    // Fetch usernames for comments
                    const commentsWithUsernames = await Promise.all(fetchedComments.map(async (comment) => {
                        const userProfileRef = doc(db, `artifacts/${appId}/users/${comment.userId}/profile/${comment.userId}`);
                        const userDoc = await getDoc(userProfileRef);
                        const username = userDoc.exists() ? userDoc.data().username : 'Anonymous';
                        return { ...comment, username };
                    }));

                    // Sort by timestamp descending
                    commentsWithUsernames.sort((a, b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0));

                    commentList.innerHTML = ''; // Clear again to prevent duplicates from multiple snapshots
                    if (commentsWithUsernames.length === 0) {
                        noCommentsMessage.classList.remove('hidden');
                    } else {
                        noCommentsMessage.classList.add('hidden');
                        commentsWithUsernames.forEach(comment => {
                            const commentElement = `
                                <div class="bg-gray-700 rounded-lg p-3 mb-3 shadow-sm border border-gray-600">
                                    <p class="text-gray-200 text-sm mb-1">${comment.text}</p>
                                    <p class="text-xs text-gray-400">
                                        <span class="font-semibold text-orange-300">${comment.username}</span> • ${new Date(comment.timestamp?.toDate()).toLocaleString()}
                                    </p>
                                </div>
                            `;
                            commentList.insertAdjacentHTML('beforeend', commentElement);
                        });
                    }
                    commentLoading.classList.add('hidden');
                }, (err) => {
                    console.error("Error fetching comments:", err);
                    commentList.innerHTML = `<p class="text-red-500 text-center">Failed to load comments.</p>`;
                    commentLoading.classList.add('hidden');
                });
            } catch (error) {
                console.error("Error setting up comment listener:", error);
                commentList.innerHTML = `<p class="text-red-500 text-center">Error fetching comments.</p>`;
                commentLoading.classList.add('hidden');
            }
        }

        /**
         * Adds a new comment to a video.
         */
        async function addComment() {
            if (!currentUserId || !db) {
                showCustomModal('Action Required', 'Please ensure you are signed in to add comments.', false);
                return;
            }
            const commentText = newCommentInput.value.trim();
            if (!commentText) {
                showCustomModal('Input Required', 'Please enter a comment.', false);
                return;
            }
            if (!currentVideoIdForComments) {
                console.error("No video ID specified for comment.");
                showCustomModal('Error', 'Could not add comment: No video selected.', false);
                return;
            }

            try {
                const commentsColRef = collection(db, `artifacts/${appId}/public/data/comments`);
                await addDoc(commentsColRef, {
                    videoId: currentVideoIdForComments,
                    userId: currentUserId,
                    text: commentText,
                    timestamp: serverTimestamp()
                });
                newCommentInput.value = ''; // Clear input
            } catch (error) {
                console.error("Error adding comment:", error);
                showCustomModal('Error', `Failed to add comment: ${error.message}`, false);
            }
        }


        // --- Upload Video Modal Logic ---

        /**
         * Opens the upload video modal.
         */
        function openUploadModal() {
            if (!currentUserId) {
                showCustomModal('Action Required', 'Please ensure you are signed in to upload videos.', false);
                return;
            }
            uploadVideoModal.classList.remove('hidden');
        }

        /**
         * Handles video upload form submission.
         * @param {Event} e - The form submission event.
         */
        async function handleUploadSubmit(e) {
            e.preventDefault();
            uploadErrorMessage.classList.add('hidden');
            uploadSubmitButton.disabled = true;
            uploadButtonText.textContent = 'Uploading...';
            uploadLoadingSpinner.classList.remove('hidden');

            const videoUrl = videoUrlInput.value.trim();
            const videoTitle = videoTitleInput.value.trim();

            if (!videoUrl || !videoTitle) {
                uploadErrorMessage.textContent = "Please enter both video URL and title.";
                uploadErrorMessage.classList.remove('hidden');
                uploadSubmitButton.disabled = false;
                uploadButtonText.textContent = 'Upload Video';
                uploadLoadingSpinner.classList.add('hidden');
                return;
            }

            const youTubeInfo = getYouTubeInfo(videoUrl);
            if (!youTubeInfo) {
                uploadErrorMessage.textContent = "Please enter a valid YouTube video URL.";
                uploadErrorMessage.classList.remove('hidden');
                uploadSubmitButton.disabled = false;
                uploadButtonText.textContent = 'Upload Video';
                uploadLoadingSpinner.classList.add('hidden');
                return;
            }

            try {
                // Fetch current user's username
                const userProfileRef = doc(db, `artifacts/${appId}/users/${currentUserId}/profile/${currentUserId}`);
                const userDoc = await getDoc(userProfileRef);
                const username = userDoc.exists() ? userDoc.data().username : 'Anonymous';

                const videosColRef = collection(db, `artifacts/${appId}/public/data/videos`);
                await addDoc(videosColRef, {
                    userId: currentUserId,
                    userName: username,
                    youtubeUrl: videoUrl,
                    title: videoTitle,
                    thumbnailUrl: youTubeInfo.thumbnailUrl,
                    viewsCount: 0,
                    likesCount: 0,
                    timestamp: serverTimestamp()
                });

                showCustomModal('Success!', 'Video uploaded successfully. It will appear in the feed shortly.', false, null, () => {
                    closeModal('upload');
                });
                uploadVideoForm.reset(); // Clear form
            } catch (error) {
                console.error("Error uploading video:", error);
                uploadErrorMessage.textContent = `Failed to upload video: ${error.message}`;
                uploadErrorMessage.classList.remove('hidden');
            } finally {
                uploadSubmitButton.disabled = false;
                uploadButtonText.textContent = 'Upload Video';
                uploadLoadingSpinner.classList.add('hidden');
            }
        }


        // --- Withdraw Modal Logic (Simulated) ---

        /**
         * Opens the withdraw modal.
         */
        function openWithdrawModal() {
            if (!currentUserId) {
                showCustomModal('Action Required', 'Please ensure you are signed in to request withdrawal.', false);
                return;
            }
            withdrawModal.classList.remove('hidden');
        }

        /**
         * Handles withdrawal form submission (simulated).
         * @param {Event} e - The form submission event.
         */
        async function handleWithdrawSubmit(e) {
            e.preventDefault();
            withdrawErrorMessage.classList.add('hidden');
            withdrawSubmitButton.disabled = true;
            withdrawButtonText.textContent = 'Submitting...';
            withdrawLoadingSpinner.classList.remove('hidden');

            const amount = parseFloat(withdrawAmountInput.value);
            const upiId = upiIdInput.value.trim();

            if (!amount || !upiId) {
                withdrawErrorMessage.textContent = 'Please fill all fields.';
                withdrawErrorMessage.classList.remove('hidden');
                withdrawSubmitButton.disabled = false;
                withdrawButtonText.textContent = 'Request Withdrawal';
                withdrawLoadingSpinner.classList.add('hidden');
                return;
            }
            if (amount < 100) {
                withdrawErrorMessage.textContent = 'Minimum withdrawal amount is ₹100.';
                withdrawErrorMessage.classList.remove('hidden');
                withdrawSubmitButton.disabled = false;
                withdrawButtonText.textContent = 'Request Withdrawal';
                withdrawLoadingSpinner.classList.add('hidden');
                return;
            }

            try {
                // Simulate API call for withdrawal request
                console.log(`Withdrawal Request: User ${currentUserId}, Amount: ₹${amount}, UPI ID: ${upiId}`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate 2-second delay

                showCustomModal('Request Sent!', 'Withdrawal request submitted successfully! Payment will be sent manually via UPI.', false, null, () => {
                    closeModal('withdraw');
                });
                withdrawForm.reset(); // Clear form
            } catch (error) {
                console.error("Withdrawal error:", error);
                withdrawErrorMessage.textContent = `Failed to submit withdrawal request: ${error.message}`;
                withdrawErrorMessage.classList.remove('hidden');
            } finally {
                withdrawSubmitButton.disabled = false;
                withdrawButtonText.textContent = 'Request Withdrawal';
                withdrawLoadingSpinner.classList.add('hidden');
            }
        }

        /**
         * Handles user sign out.
         */
        async function handleSignOut() {
            try {
                await signOut(auth);
                console.log("Signed out successfully.");
                currentUserId = null; // Clear userId after sign out
                showPage('home'); // Redirect to home page
                showCustomModal('Signed Out', 'You have been signed out successfully.', false);
            } catch (error) {
                console.error("Error signing out:", error);
                showCustomModal('Sign Out Error', `Failed to sign out: ${error.message}`, false);
            }
        }


        // --- Adstreaa / Hilltops Ad Script Injections (Global) ---
        // These are typically placed directly in the HTML body or head,
        // but can be dynamically added. Placing them here ensures they
        // are added once the main app script loads.

        /**
         * Injects external ad scripts into the document body.
         */
        function injectExternalAdScripts() {
            // Hilltops Video Slider (Commented out as it might conflict or behave unexpectedly with IMA SDK)
            // const hilltopsVideoSliderScript = `
            //     <script>     
            //     (function(ikzv){     
            //     var d = document, s = d.createElement('script'), l = d.scripts[d.scripts.length - 1];     
            //     s.settings = ikzv || {};     
            //     s.src = "//definitive-priority.com/b/XnVTs/d.GPlr0AYRWdcy/beLmZ9muKZ/UmlHk/POTPYZ0-MjjCQz0SO/Tigmt/NxjFQ/yaNiDEQP5jOOQ-";     
            //     s.async = true;     
            //     s.referrerPolicy = 'no-referrer-when-downgrade';     
            //     l.parentNode.insertBefore(s, l);     
            //     })({});     
            //     </script>
            // `;
            // document.body.insertAdjacentHTML('beforeend', hilltopsVideoSliderScript);

            // Hilltops Popunder (Triggered after a delay)
            const hilltopsPopunderScript = `
                <script>
                    if (!window._hilltopsPopunderLoaded) {
                        setTimeout(function() {
                            window.open('https://assured-sandwich.com/bV3fV.0WPv3/pSvrb/m/VsJQZ/DR0/2XN/D/In0JNVTzMU3MLVThYo0-MvjeQB1/Mgz/gT', '_blank');
                            window._hilltopsPopunderLoaded = true; // Prevent multiple triggers
                        }, 15000); // Trigger popunder after 15 seconds
                    }
                </script>
            `;
            document.body.insertAdjacentHTML('beforeend', hilltopsPopunderScript);

            // Adstreaa Popunder Ad
            const adstreaaPopunderScript = `<script type='text/javascript' src='//pl26835142.profitableratecpm.com/db/27/6d/db276d3b5f1289379bbe5d365485ac52.js'></script>`;
            document.body.insertAdjacentHTML('beforeend', adstreaaPopunderScript);

            // Adstreaa Native Ads
            const adstreaaNativeAdScript = `<script async="async" data-cfasync="false" src="//pl26835150.profitableratecpm.com/39628927897b21d6c45567203000ccc6/invoke.js"></script><div id="container-39628927897b21d6c45567203000ccc6"></div>`;
            document.body.insertAdjacentHTML('beforeend', adstreaaNativeAdScript);

            // Adstreaa Social Bar
            const adstreaaSocialBarScript = `<script type='text/javascript' src='//pl26835180.profitableratecpm.com/51/87/c3/5187c39d0d72d45de29e9c62b51aaba2.js'></script>`;
            document.body.insertAdjacentHTML('beforeend', adstreaaSocialBarScript);

            // Adstreaa Banner 320x50 (for mobile)
            const adstreaaBanner320x50 = `
                <script type="text/javascript">  
                    atOptions = {  
                        'key' : 'f4fd46187fcf3a252df23d7277e02fd7',  
                        'format' : 'iframe',  
                        'height' : 50,  
                        'width' : 320,  
                        'params' : {}  
                    };  
                </script>  
                <script type="text/javascript" src="//www.highperformanceformat.com/f4fd46187fcf3a252df23d7277e02fd7/invoke.js"></script>
            `;
            // You might want to inject this into a specific mobile-only slot or based on screen width
            // For simplicity, it's just added to body, but consider its placement.
            document.body.insertAdjacentHTML('beforeend', adstreaaBanner320x50);

            // Adstreaa Banner 160x300
            const adstreaaBanner160x300 = `
                <script type="text/javascript">  
                    atOptions = {  
                        'key' : 'bc56d12282cadec7b8753ae823c22319',  
                        'format' : 'iframe',  
                        'height' : 300,  
                        'width' : 160,  
                        'params' : {}  
                    };  
                </script>  
                <script type="text/javascript" src="//www.highperformanceformat.com/bc56d12282cadec7b8753ae823c22319/invoke.js"></script>
            `;
            // Similarly, for specific placement
            document.body.insertAdjacentHTML('beforeend', adstreaaBanner160x300);

            // Hilltops Banner 300x100
            const hilltopsBanner300x100 = `
                <script>     
                (function(ahzkl){     
                var d = document,     
                s = d.createElement('script'),     
                l = d.scripts[d.scripts.length - 1];     
                s.settings = ahzkl || {};     
                s.src = "//definitive-priority.com/brX/VEs/d.GRlA0BY_Wicn/behmh9xu/ZeUrlXkDPKTFY/0wMxjKQC1KNtTGM_tpNpjwQGyMN/DdUR1HNjAm";     
                s.async = true;     
                s.referrerPolicy = 'no-referrer-when-downgrade';     
                l.parentNode.insertBefore(s, l);     
                })({});     
                </script>
            `;
            document.body.insertAdjacentHTML('beforeend', hilltopsBanner300x100);

            console.log("External ad scripts injected.");
        }


        // --- Event Listeners ---
        document.addEventListener('DOMContentLoaded', () => {
            // Initialize Firebase when DOM is ready
            initializeFirebase();

            // Inject global ad scripts
            injectExternalAdScripts();

            // Header Button Listeners
            document.getElementById('search-button').addEventListener('click', () => showPage('search'));
            document.getElementById('profile-header-button').addEventListener('click', () => showPage('profile'));
            document.getElementById('upload-header-button').addEventListener('click', openUploadModal);
            document.getElementById('withdraw-header-button').addEventListener('click', openWithdrawModal);
            signOutButton.addEventListener('click', handleSignOut);

            // Footer Button Listeners
            document.getElementById('home-footer-button').addEventListener('click', () => showPage('home'));
            document.getElementById('people-footer-button').addEventListener('click', () => showPage('people'));
            document.getElementById('upload-footer-button').addEventListener('click', openUploadModal);
            document.getElementById('profile-footer-button').addEventListener('click', () => showPage('profile'));

            // Custom Modal Listeners (delegated as modal is shown/hidden)
            customModalCloseButton.addEventListener('click', () => closeModal('custom'));
            customModalConfirmButton.addEventListener('click', () => closeModal('custom')); // This is overridden by the showCustomModal

            // Comment Modal Listeners
            commentModalCloseButton.addEventListener('click', () => closeModal('comment'));
            addCommentButton.addEventListener('click', addComment);
            newCommentInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    addComment();
                }
            });

            // Upload Modal Listeners
            uploadModalCloseButton.addEventListener('click', () => closeModal('upload'));
            uploadVideoForm.addEventListener('submit', handleUploadSubmit);

            // Withdraw Modal Listeners
            withdrawModalCloseButton.addEventListener('click', () => closeModal('withdraw'));
            withdrawForm.addEventListener('submit', handleWithdrawSubmit);
        });

        // Ensure window resize updates IMA ad container size if needed,
        // though the global container should handle it fairly well with CSS.
        window.addEventListener('resize', () => {
            if (currentAdManager && imaAdContainer.style.display !== 'none') {
                 // Important: Re-init or resize ad manager if container dimensions change while ad is active
                currentAdManager.resize(imaAdContainer.offsetWidth, imaAdContainer.offsetHeight, google.ima.ViewMode.NORMAL);
            }
        });

    </script>
</body>
</html>
