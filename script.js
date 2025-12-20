// Global variables
let mouseX = 0;
let mouseY = 0;
let isVideoIntroPlaying = true;
let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;
let pageFlipping = false;
let swRegistration = null;

// API Configuration - PRODUCTION URL
const API_URL = 'https://backendcode-with-destiny.onrender.com';

// EmailJS Configuration
const EMAILJS_SERVICE_ID = 'service_fg2hujo';
const EMAILJS_TEMPLATE_ID = 'template_mbbw2cc';
const EMAILJS_PUBLIC_KEY = 'C-UaBjlMKdLfR-XjR';

// Initialize EmailJS with error handling
try {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    console.log('✅ EmailJS initialized successfully');
} catch (error) {
    console.warn('⚠️ EmailJS initialization warning:', error);
}

// Suppress specific CORS header warnings that don't affect functionality
const originalConsoleError = console.error;
console.error = function(...args) {
    const message = args.join(' ');
    
    // Filter out the specific "unsafe header" errors
    if (message.includes('Refused to get unsafe header') && 
        message.includes('x-rtb-fingerprint-id')) {
        console.warn('⚠️ Filtered CORS header warning (non-critical):', message);
        return;
    }
    
    // Call original console.error for all other errors
    originalConsoleError.apply(console, args);
};

// Initialize GSAP plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// ==================== CRITICAL FIXES FOR PAYMENT ====================

// 1. Load Razorpay Script Dynamically
function loadRazorpayScript() {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (typeof Razorpay !== 'undefined') {
            console.log('✅ Razorpay already loaded');
            resolve(true);
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
            console.log('✅ Razorpay script loaded successfully');
            resolve(true);
        };
        script.onerror = () => {
            console.error('❌ Failed to load Razorpay script');
            reject(new Error('Razorpay script failed to load'));
        };
        document.head.appendChild(script);
    });
}

// Register Service Worker for PWA
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then((registration) => {
                swRegistration = registration;
                console.log('✅ Service Worker registered successfully');
                
                // Check for updates periodically
                setInterval(() => {
                    registration.update().catch(error => {
                        console.log('Service Worker update check failed:', error);
                    });
                }, 60000); // Check every minute
                
                // Listen for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('📦 New version available! Reload to update.');
                            showUpdateNotification();
                        }
                    });
                });
            })
            .catch((error) => {
                console.log('❌ Service Worker registration failed:', error);
            });
    }
}

// Show update notification
function showUpdateNotification() {
    // Create a simple notification banner
    const banner = document.createElement('div');
    banner.style.cssText = `
        position: fixed;
        top: 70px;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #DAA520, #D2691E);
        color: white;
        padding: 12px 20px;
        text-align: center;
        font-weight: bold;
        z-index: 9998;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    banner.innerHTML = `
        <span>📦 New version available!</span>
        <button onclick="location.reload()" style="
            background: white;
            color: #B8462E;
            border: none;
            padding: 6px 16px;
            border-radius: 20px;
            cursor: pointer;
            font-weight: bold;
            font-size: 12px;
        ">Reload</button>
    `;
    document.body.appendChild(banner);
    
    // Auto-dismiss after 10 seconds
    setTimeout(() => {
        banner.remove();
    }, 10000);
}

// Handle Install Prompt
let deferredPrompt;
const installButton = document.createElement('button');
installButton.id = 'pwa-install-button';
installButton.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    background: linear-gradient(135deg, #B8462E, #D2691E);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 50px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    z-index: 9997;
    box-shadow: 0 6px 20px rgba(184, 70, 46, 0.4);
    display: none;
    transition: all 0.3s ease;
`;
installButton.innerHTML = '⬇️ Install App';
installButton.addEventListener('mouseenter', () => {
    installButton.style.transform = 'translateY(-3px) scale(1.05)';
});
installButton.addEventListener('mouseleave', () => {
    installButton.style.transform = 'scale(1)';
});

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installButton.style.display = 'block';
    console.log('📲 Install prompt ready');
});

installButton.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response: ${outcome}`);
        deferredPrompt = null;
        installButton.style.display = 'none';
    }
});

window.addEventListener('appinstalled', () => {
    console.log('✅ PWA installed successfully!');
    deferredPrompt = null;
    installButton.style.display = 'none';
    
    // Track installation
    if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/pwa-installed', JSON.stringify({ timestamp: new Date() }));
    }
});

// Document ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing payment system...');
    
    // Pre-load Razorpay script
    loadRazorpayScript().catch(err => {
        console.warn('⚠️ Razorpay pre-load failed:', err);
    });
    
    registerServiceWorker();
    document.body.appendChild(installButton);
    initializeWebsite();
});
// If script is loaded after DOMContentLoaded, ensure initialization still runs
if (document.readyState !== 'loading') {
    console.log('🚀 Late initialization - loading payment system...');
    
    // Pre-load Razorpay script
    loadRazorpayScript().catch(err => {
        console.warn('⚠️ Razorpay pre-load failed:', err);
    });
    
    registerServiceWorker();
    if (document.body) document.body.appendChild(installButton);
    initializeWebsite();
}

function initializeWebsite() {
    console.log('🍂 Initializing "Code with Destiny" website...');
    
    // Initialize video intro
    initializeVideoIntro();
    
    // Initialize mouse tracking
    initializeMouseTracking();
    
    // Initialize scroll effects
    initializeScrollEffects();
    
    // Initialize navigation
    initializeNavigation();
    
    // Initialize interactive elements
    initializeInteractiveElements();
    
    // Initialize autumn effects
    initializeAutumnEffects();
    
    // Initialize the image preview (4 pages)
    initializeImagePreview();
    
    // Initialize emergency payment controls
    addEmergencyPaymentControls();
    
    console.log('✨ Website initialized successfully!');
}

// Video Intro Functions
function initializeVideoIntro() {
    const videoIntro = document.getElementById('video-intro');
    const introVideo = document.getElementById('intro-video');
    const skipBtn = document.getElementById('skip-intro');
    
    // Handle video intro
    if (introVideo && introVideo.videoWidth === 0) {
        // No video file, show static intro for 3 seconds
        console.log('📹 No video file found, showing static intro');
        setTimeout(() => {
            skipVideoIntro();
        }, 3000);
    } else if (introVideo) {
        // Video file exists
        introVideo.addEventListener('ended', skipVideoIntro);
        introVideo.addEventListener('error', () => {
            console.log('📹 Video error, showing static intro');
            setTimeout(skipVideoIntro, 3000);
        });
    }
    
    // Skip button
    if (skipBtn) {
        skipBtn.addEventListener('click', skipVideoIntro);
    }
    
    // Auto skip after 10 seconds max
    setTimeout(skipVideoIntro, 10000);
}

function skipVideoIntro() {
    const videoIntro = document.getElementById('video-intro');
    if (videoIntro && isVideoIntroPlaying) {
        isVideoIntroPlaying = false;
        videoIntro.classList.add('hidden');
        
        // Enable scrolling
        document.body.style.overflow = 'auto';
        
        // Start main animations
        setTimeout(() => {
            startMainAnimations();
        }, 500);
    }
}

// Mouse Tracking for Interactive Elements
function initializeMouseTracking() {
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Update custom cursor position
        updateCustomCursor();
        
        // Apply parallax effects
        applyMouseParallax();
        
        // Float elements based on mouse position
        floatElementsWithMouse();
    });
}

function updateCustomCursor() {
    const cursor = document.querySelector('body::before');
    if (cursor) {
        document.documentElement.style.setProperty('--mouse-x', mouseX + 'px');
        document.documentElement.style.setProperty('--mouse-y', mouseY + 'px');
    }
}

function applyMouseParallax() {
    const parallaxElements = document.querySelectorAll('.parallax-element, .floating-leaf, .tree-leaves .leaf');
    
    parallaxElements.forEach((element, index) => {
        const speed = (index + 1) * 0.02;
        const x = (mouseX * speed);
        const y = (mouseY * speed);
        
        element.style.transform = `translate(${x}px, ${y}px)`;
    });
}

function floatElementsWithMouse() {
    const floatingElements = document.querySelectorAll('.floating-particles, .floating-leaf');
    
    floatingElements.forEach((element, index) => {
        const intensity = (index + 1) * 0.01;
        const x = (mouseX - window.innerWidth / 2) * intensity;
        const y = (mouseY - window.innerHeight / 2) * intensity;
        
        gsap.to(element, {
            duration: 0.3,
            x: x,
            y: y,
            ease: "power2.out"
        });
    });
}

// Amazing Scroll Effects
function initializeScrollEffects() {
    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Scroll reveal animations
    const revealElements = document.querySelectorAll('.highlight-item, .toc-card, .about-text, .book-promotion');
    
    revealElements.forEach((element, index) => {
        gsap.fromTo(element, 
            {
                opacity: 0,
                y: 50,
                scale: 0.9
            },
            {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.8,
                delay: index * 0.1,
                scrollTrigger: {
                    trigger: element,
                    start: "top 80%",
                    end: "bottom 20%",
                    toggleActions: "play none none reverse"
                }
            }
        );
    });
    
    // Section-based scroll effects
    initializeSectionScrollEffects();
    
    // Infinite scroll rearrangement
    initializeScrollRearrangement();
    
    // Smooth scrolling for links
    initializeSmoothScrolling();
}

function initializeSectionScrollEffects() {
    // Hero section parallax
    gsap.to('.floating-particles', {
        yPercent: -50,
        ease: "none",
        scrollTrigger: {
            trigger: ".hero-section",
            start: "top bottom",
            end: "bottom top",
            scrub: true
        }
    });
    
    // Book cover tilt effect
    gsap.to('.book-cover-tilt', {
        rotationY: -20,
        rotationX: 10,
        scale: 1.1,
        scrollTrigger: {
            trigger: ".about-section",
            start: "top center",
            end: "bottom center",
            scrub: true
        }
    });
    
    // Floating leaves movement
    gsap.to('.floating-leaf', {
        rotation: 360,
        y: -100,
        duration: 20,
        repeat: -1,
        ease: "none"
    });
}

function initializeScrollRearrangement() {
    // Elements rearrange to their positions on scroll
    const rearrangeElements = document.querySelectorAll('.highlight-item, .toc-card');
    
    rearrangeElements.forEach((element, index) => {
        // Store original position
        const originalTransform = window.getComputedStyle(element).transform;
        
        // Scatter elements initially
        gsap.set(element, {
            x: Math.random() * 200 - 100,
            y: Math.random() * 200 - 100,
            rotation: Math.random() * 20 - 10,
            opacity: 0.5
        });
        
        // Animate to correct position on scroll
        gsap.to(element, {
            x: 0,
            y: 0,
            rotation: 0,
            opacity: 1,
            duration: 1,
            delay: index * 0.1,
            ease: "back.out(1.7)",
            scrollTrigger: {
                trigger: element,
                start: "top 90%",
                toggleActions: "play none none reverse"
            }
        });
    });
}

function initializeSmoothScrolling() {
    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                gsap.to(window, {
                    duration: 1.5,
                    scrollTo: target,
                    ease: "power2.inOut"
                });
            }
        });
    });
}

// PDF Viewer Functions
function initializePDFViewer() {
    console.log('📖 Initializing PDF viewer...');
    
    // Check if PDF.js is available
    if (typeof pdfjsLib === 'undefined') {
        console.error('❌ PDF.js library not loaded!');
        showPDFPlaceholder();
        return;
    }
    
    console.log('✅ PDF.js library loaded successfully');
    
    // Set PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    // Load the PDF
    loadPDF();
    
    // Initialize controls
    initializePDFControls();
    
    // Initialize realistic page flipping
    initializePageFlipping();
}

async function loadPDF() {
    try {
        console.log('📄 Loading book.pdf...');
        console.log('🔍 Checking if PDF.js is available:', typeof pdfjsLib);
        
        // Try to load book.pdf from the root directory
        const pdfUrl = './book.pdf';
        console.log('📂 PDF URL:', pdfUrl);
        
        // Check if file exists first
        const response = await fetch(pdfUrl);
        console.log('🌐 Fetch response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        pdfDoc = await pdfjsLib.getDocument(pdfUrl).promise;
        totalPages = pdfDoc.numPages;
        
        console.log(`📚 PDF loaded successfully! Total pages: ${totalPages}`);
        
        // Update UI
        const totalPagesElement = document.getElementById('total-pages');
        if (totalPagesElement) {
            totalPagesElement.textContent = totalPages;
        }
        
        // Render first page
        renderPage(1);
        
    } catch (error) {
        console.warn('📄 Could not load book.pdf:', error);
        console.log('🔧 Showing PDF placeholder instead');
        showPDFPlaceholder();
    }
}

async function renderPage(pageNum) {
    if (!pdfDoc || pageFlipping) return;
    
    try {
        console.log(`🎨 Rendering page ${pageNum}...`);
        
        const page = await pdfDoc.getPage(pageNum);
        const canvas = document.getElementById('pdf-canvas');
        
        if (!canvas) {
            console.error('❌ PDF canvas element not found!');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        console.log('✅ Canvas context acquired');
        
        // Calculate scale to fit the canvas
        const viewport = page.getViewport({ scale: 1 });
        const scale = Math.min(
            500 / viewport.width,  // Fixed canvas width
            650 / viewport.height  // Fixed canvas height
        ) * 0.9;
        
        const scaledViewport = page.getViewport({ scale });
        console.log(`📐 Viewport: ${scaledViewport.width}x${scaledViewport.height}, Scale: ${scale}`);
        
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;
        
        // Render page
        const renderContext = {
            canvasContext: ctx,
            viewport: scaledViewport
        };
        
        await page.render(renderContext).promise;
        console.log(`✅ Page ${pageNum} rendered successfully`);
        
        // Update current page
        currentPage = pageNum;
        const currentPageElement = document.getElementById('current-page');
        if (currentPageElement) {
            currentPageElement.textContent = currentPage;
        }
        
        // Update button states
        updatePageButtons();
        
    } catch (error) {
        console.error('❌ Error rendering page:', error);
    }
}

function showPDFPlaceholder() {
    console.log('📄 Showing PDF placeholder...');
    
    const canvas = document.getElementById('pdf-canvas');
    if (!canvas) {
        console.warn('⚠️ PDF canvas element not found, skipping placeholder');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw placeholder
    ctx.fillStyle = '#FDF5E6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw book cover simulation
    ctx.fillStyle = '#B8462E';
    ctx.font = 'bold 24px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('Code with Destiny', canvas.width / 2, canvas.height / 2 - 40);
    
    ctx.fillStyle = '#8B4513';
    ctx.font = '16px Georgia';
    ctx.fillText('Tales from the Engineering Trenches', canvas.width / 2, canvas.height / 2);
    
    ctx.fillStyle = '#654321';
    ctx.font = '14px Georgia';
    ctx.fillText('by Piyush Joshi', canvas.width / 2, canvas.height / 2 + 40);
    
    // Draw autumn tree
    drawAutumnTree(ctx, canvas.width / 2, canvas.height / 2 + 100);
    
    // Update placeholders
    document.getElementById('current-page').textContent = '1';
    document.getElementById('total-pages').textContent = '1';
}

function drawAutumnTree(ctx, x, y) {
    // Tree trunk
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x - 4, y, 8, 40);
    
    // Tree leaves (simple circles)
    const colors = ['#D2691E', '#B8462E', '#DAA520'];
    for (let i = 0; i < 15; i++) {
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        const leafX = x + (Math.random() - 0.5) * 60;
        const leafY = y - 10 + (Math.random() - 0.5) * 40;
        ctx.beginPath();
        ctx.arc(leafX, leafY, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initializePDFControls() {
    // Previous page button
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            animatePageFlip('prev');
        }
    });
    
    // Next page button
    document.getElementById('next-page').addEventListener('click', () => {
        if (currentPage < totalPages) {
            animatePageFlip('next');
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' && currentPage > 1) {
            animatePageFlip('prev');
        } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
            animatePageFlip('next');
        }
    });
}

function initializePageFlipping() {
    const flipbook = document.getElementById('pdf-flipbook');
    
    // Mouse down for page flipping
    flipbook.addEventListener('mousedown', (e) => {
        const rect = flipbook.getBoundingClientRect();
        const x = e.clientX - rect.left;
        
        // Check if clicking on the right side (next page) or left side (previous page)
        if (x > rect.width / 2 && currentPage < totalPages) {
            animatePageFlip('next');
        } else if (x <= rect.width / 2 && currentPage > 1) {
            animatePageFlip('prev');
        }
    });
    
    // Touch events for mobile
    let touchStartX = 0;
    
    flipbook.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    });
    
    flipbook.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > 50) { // Minimum swipe distance
            if (diff > 0 && currentPage < totalPages) {
                animatePageFlip('next');
            } else if (diff < 0 && currentPage > 1) {
                animatePageFlip('prev');
            }
        }
    });
}

function animatePageFlip(direction) {
    if (pageFlipping || !pdfDoc) return;
    
    pageFlipping = true;
    const canvas = document.getElementById('pdf-canvas');
    const nextCanvas = document.getElementById('pdf-canvas-next');
    
    // Determine target page
    const targetPage = direction === 'next' ? currentPage + 1 : currentPage - 1;
    
    // Realistic page flip animation
    gsap.timeline()
        .to(canvas, {
            duration: 0.3,
            rotationY: direction === 'next' ? -90 : 90,
            transformOrigin: direction === 'next' ? 'right center' : 'left center',
            ease: "power2.inOut"
        })
        .call(() => {
            // Render target page
            renderPage(targetPage);
        })
        .to(canvas, {
            duration: 0.3,
            rotationY: 0,
            ease: "power2.inOut",
            onComplete: () => {
                pageFlipping = false;
            }
        });
    
    // Add paper rustling sound effect (if you have audio files)
    playPageFlipSound();
}

/* --- Simplified image-based 4-page preview --- */
function initializeImagePreview() {
    console.log('📚 Initializing book preview with page flip effect...');
    
    const pages = [
        { left: 'public/images/1.png', right: 'public/images/2.png' }, // Spread 1: pages 1-2
        { left: 'public/images/3.png', right: 'public/images/4.png' }  // Spread 2: pages 3-4
    ];
    
    let currentSpread = 0;
    let isFlipping = false;
    
    // DOM Elements
    const openBtn = document.getElementById('open-book-preview');
    const closeBtn = document.getElementById('close-modal');
    const modal = document.getElementById('book-modal');
    const leftImg = document.getElementById('left-image');
    const rightImg = document.getElementById('right-image');
    const leftPageEl = document.getElementById('left-page');
    const rightPageEl = document.getElementById('right-page');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const currentPageSpan = document.getElementById('current-page');
    const endMessage = document.getElementById('end-message');
    
    console.log('🔍 Element check:');
    console.log('  openBtn:', openBtn ? '✅ Found' : '❌ NOT FOUND');
    console.log('  closeBtn:', closeBtn ? '✅ Found' : '❌ NOT FOUND');
    console.log('  modal:', modal ? '✅ Found' : '❌ NOT FOUND');
    console.log('  leftImg:', leftImg ? '✅ Found' : '❌ NOT FOUND');
    console.log('  rightImg:', rightImg ? '✅ Found' : '❌ NOT FOUND');
    
    if (!modal) {
        console.warn('⚠️ Book modal not found');
        return;
    }
    
    // Open book
    openBtn?.addEventListener('click', () => {
        console.log('📖 "Read Preview" button clicked');
        try {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            currentSpread = 0;
            isFlipping = false;
            updateBookDisplay();
            console.log('✅ Book preview opened from "Read Preview" button');
        } catch (error) {
            console.error('❌ Error opening book:', error);
        }
    });
    
    // Close book
    closeBtn?.addEventListener('click', closeBook);
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeBook();
    });
    
    function closeBook() {
        console.log('📖 Closing book preview');
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    
    // Previous page
    prevBtn?.addEventListener('click', () => {
        if (currentSpread > 0 && !isFlipping) {
            isFlipping = true;
            flipBackward();
            currentSpread--;
            setTimeout(() => {
                updateBookDisplay();
                isFlipping = false;
            }, 800);
        }
    });
    
    // Next page
    nextBtn?.addEventListener('click', () => {
        if (currentSpread < pages.length - 1 && !isFlipping) {
            isFlipping = true;
            flipForward();
            currentSpread++;
            setTimeout(() => {
                updateBookDisplay();
                isFlipping = false;
            }, 800);
        } else if (currentSpread === pages.length - 1 && !isFlipping) {
            // At end of preview
            endMessage.classList.remove('hidden');
            console.log('💳 End of preview reached');
        }
    });
    
    function updateBookDisplay() {
        const spread = pages[currentSpread];
        leftImg.src = spread.left;
        rightImg.src = spread.right;
        
        // Update page counter (showing left page number)
        currentPageSpan.textContent = (currentSpread * 2) + 1;
        
        // Update button states
        prevBtn.disabled = currentSpread === 0;
        nextBtn.disabled = currentSpread === pages.length - 1;
        
        // Hide end message for non-last spreads
        if (currentSpread < pages.length - 1) {
            endMessage.classList.add('hidden');
        }
        
        // Reset animations
        leftPageEl.className = 'page left-page';
        rightPageEl.className = 'page right-page';
    }
    
    function flipForward() {
        // Left page flips out to the left
        leftPageEl.classList.add('flip-out');
        // Right page comes in from behind
        rightPageEl.classList.add('flip-in');
    }
    
    function flipBackward() {
        // Left page comes back in from behind
        leftPageEl.classList.add('flip-in');
        // Right page flips back out
        rightPageEl.classList.add('flip-out');
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (modal.classList.contains('active')) {
            if (e.key === 'ArrowLeft') prevBtn?.click();
            if (e.key === 'ArrowRight') nextBtn?.click();
            if (e.key === 'Escape') closeBook();
        }
    });
    
    // Make preview page thumbnails clickable - open the book preview
    function openBookFromThumbnail() {
        console.log('📖 Opening book from thumbnail...');
        try {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            currentSpread = 0;
            isFlipping = false;
            updateBookDisplay();
            console.log('✅ Book preview opened successfully');
        } catch (error) {
            console.error('❌ Error opening book:', error);
        }
    }
    
    function attachPreviewClickHandlers() {
        const previewPages = document.querySelectorAll('.preview-page');
        console.log('📸 Found ' + previewPages.length + ' preview pages');
        
        if (previewPages.length === 0) {
            console.warn('⚠️ No preview pages found, retrying in 500ms...');
            setTimeout(attachPreviewClickHandlers, 500);
            return;
        }
        
        previewPages.forEach((page, index) => {
            page.style.cursor = 'pointer';
            page.style.transition = 'all 0.2s ease';
            
            page.addEventListener('click', function(e) {
                console.log('👆 Clicked preview page ' + (index + 1));
                openBookFromThumbnail();
            });
            
            // Add hover effect
            page.addEventListener('mouseenter', () => {
                page.style.opacity = '0.8';
                page.style.transform = 'scale(0.98)';
            });
            page.addEventListener('mouseleave', () => {
                page.style.opacity = '1';
                page.style.transform = 'scale(1)';
            });
        });
        
        console.log('✅ Preview click handlers attached to ' + previewPages.length + ' pages');
    }
    
    // Attach handlers with retries
    attachPreviewClickHandlers();
    setTimeout(attachPreviewClickHandlers, 500);
    setTimeout(attachPreviewClickHandlers, 1000);
    
    console.log('✨ Book preview initialized with ' + pages.length + ' spreads');
}



function playPageFlipSound() {
    // You can add audio files for page flipping sound
    try {
        const audio = new Audio('./page-flip.mp3'); // Add this audio file
        audio.volume = 0.3;
        audio.play().catch(() => {
            // Ignore audio errors
        });
    } catch (error) {
        // Audio not available
    }
}

function updatePageButtons() {
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
}

// Navigation Functions
function initializeNavigation() {
    // Smooth scrolling for all anchor links - using GSAP with fallback
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            // Check if it's a valid anchor with ID
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                e.preventDefault();
                // Try GSAP scrollTo, fallback to native scrollIntoView
                try {
                    if (gsap && gsap.to) {
                        gsap.to(window, {
                            duration: 0.8,
                            scrollTo: {
                                y: targetElement,
                                autoKill: true
                            },
                            ease: 'power2.inOut'
                        });
                    } else {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                } catch (err) {
                    // Fallback to native scroll
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });
}

// Interactive Elements
function initializeInteractiveElements() {
    // Form handling
    initializeForm();
    
    // Amount buttons
    initializeAmountButtons();
    
    // Enhanced hover effects
    initializeHoverEffects();
}

function initializeForm() {
    const form = document.getElementById('purchase-form');
    const successMessage = document.getElementById('success-message');
    
    // Add real-time phone number formatting
    const whatsappInput = document.getElementById('whatsapp');
    if (whatsappInput) {
        whatsappInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/[^0-9+]/g, '');
            
            // Auto-format Indian numbers
            if (value.length === 10 && !value.startsWith('+')) {
                value = '+91' + value;
            } else if (value.startsWith('91') && !value.startsWith('+91')) {
                value = '+91' + value.substring(2);
            } else if (value.startsWith('0')) {
                value = '+91' + value.substring(1);
            }
            
            e.target.value = value;
        });
        
        // Add placeholder and pattern for better UX
        whatsappInput.placeholder = '+91xxxxxxxxxx or 10 digits';
        whatsappInput.setAttribute('maxlength', '13');
    }
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            let whatsapp = document.getElementById('whatsapp').value.trim();
            const amount = parseInt(document.getElementById('amount').value) || 0;
            
            // Clean and format WhatsApp number for better Razorpay compatibility
            whatsapp = whatsapp.replace(/[^0-9+]/g, ''); // Remove non-numeric except +
            if (whatsapp.startsWith('91') && !whatsapp.startsWith('+91')) {
                whatsapp = '+91' + whatsapp.substring(2);
            } else if (!whatsapp.startsWith('+') && whatsapp.length === 10) {
                whatsapp = '+91' + whatsapp;
            } else if (whatsapp.startsWith('0')) {
                whatsapp = '+91' + whatsapp.substring(1);
            }
            
            // Validation
            if (!name || !email || !whatsapp) {
                alert('❌ Please fill all required fields');
                return;
            }
            
            if (email.indexOf('@') === -1) {
                alert('❌ Invalid email address');
                return;
            }
            
            // Validate WhatsApp number format
            if (!/^\+91[6-9]\d{9}$/.test(whatsapp) && !/^[6-9]\d{9}$/.test(whatsapp.replace('+91', ''))) {
                alert('❌ Please enter a valid 10-digit mobile number');
                return;
            }
            
            console.log('📋 Form submitted:', { name, email, whatsapp, amount });
            
            // Disable submit button to prevent double submission
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Processing...';
            
            // Add payment status indicator
            showPaymentStatus('Creating order...', 'info');
            
            // Create order via backend
            createOrderViaBackend(name, email, whatsapp, amount, form, successMessage, submitBtn);
        });
    }
}

// Payment status indicator
function showPaymentStatus(message, type = 'info') {
    // Remove existing status
    const existingStatus = document.getElementById('payment-status');
    if (existingStatus) {
        existingStatus.remove();
    }
    
    // Create new status indicator
    const statusDiv = document.createElement('div');
    statusDiv.id = 'payment-status';
    statusDiv.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        padding: 15px 25px;
        border-radius: 25px;
        color: white;
        font-weight: bold;
        z-index: 999998;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
        max-width: 90%;
        text-align: center;
    `;
    
    // Set colors based on type
    switch(type) {
        case 'success':
            statusDiv.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
            break;
        case 'error':
            statusDiv.style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
            break;
        case 'warning':
            statusDiv.style.background = 'linear-gradient(135deg, #ff9800, #f57c00)';
            break;
        default:
            statusDiv.style.background = 'linear-gradient(135deg, #2196F3, #1976D2)';
    }
    
    statusDiv.innerHTML = message;
    document.body.appendChild(statusDiv);
    
    // Auto remove success/error messages after 5 seconds
    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            if (statusDiv && statusDiv.parentNode) {
                statusDiv.remove();
            }
        }, 5000);
    }
}

// 2. FIXED: Create order function with proper error handling
async function createOrderViaBackend(name, email, whatsapp, amount, form, successMessage, submitBtn) {
    try {
        // Ensure Razorpay is loaded for paid orders
        if (amount > 0) {
            showPaymentStatus('Loading payment system...', 'info');
            await loadRazorpayScript();
        }
        
        console.log('📝 Creating order...');
        showPaymentStatus('Creating order...', 'info');
        
        // ✅ FIXED: Remove client-side CORS headers (they don't work)
        const orderResponse = await fetch(`${API_URL}/api/orders/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                // ❌ REMOVED: Access-Control headers (only backend should set these)
            },
            body: JSON.stringify({
                name: name,
                email: email,
                whatsapp: whatsapp,
                amount: amount
            })
        });
        
        console.log('📡 Order response status:', orderResponse.status);
        
        if (!orderResponse.ok) {
            const errorText = await orderResponse.text();
            console.error('❌ Server error:', errorText);
            throw new Error(`Server error: ${orderResponse.status}`);
        }
        
        const orderData = await orderResponse.json();
        
        if (orderData.status !== 'success') {
            throw new Error(orderData.message || 'Failed to create order');
        }
        
        console.log('✅ Order created:', orderData.order_id);
        
        // Handle free orders
        if (orderData.is_free) {
            console.log('🎁 Free book - sending via EmailJS');
            showPaymentStatus('Sending your free book...', 'info');
            await sendBookViaEmailJS(email, name, orderData.order_id, 0);
            showPaymentStatus('✅ Free book sent successfully!', 'success');
            showSuccessMessage(form, successMessage, email, whatsapp, submitBtn);
            return;
        }
        
        // Handle paid orders
        console.log('💳 Initializing Razorpay payment...');
        showPaymentStatus('Opening payment gateway...', 'info');
        
        // ✅ FIXED: Simplified and corrected Razorpay options
        const options = {
            key: orderData.razorpay_key_id,
            amount: amount * 100,
            currency: "INR",
            name: "Code with Destiny",
            description: "Digital Book Purchase",
            order_id: orderData.razorpay_order_id,
            prefill: {
                name: name,
                email: email,
                contact: whatsapp.replace('+91', '') // ✅ FIXED: Remove + prefix
            },
            image: "/public/images/image copy.png",
            theme: {
                color: "#B8462E"
            },
            handler: async function(response) {
                try {
                    console.log('✅ Payment successful:', response);
                    
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Verifying Payment...';
                    showPaymentStatus('Verifying payment...', 'info');
                    
                    // Verify payment
                    await verifyPaymentViaBackend(
                        response.razorpay_order_id,
                        response.razorpay_payment_id,
                        response.razorpay_signature,
                        orderData.order_id,
                        email,
                        name,
                        amount
                    );
                    
                    // Show success - email is already sent by backend
                    showPaymentStatus('✅ Payment verified and email sent!', 'success');
                    showSuccessMessage(form, successMessage, email, whatsapp, submitBtn);
                    
                } catch (error) {
                    console.error('❌ Payment handler error:', error);
                  
                   
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Get the Book';
                }
            },
            modal: {
                ondismiss: function() {
                    console.log('❌ Payment cancelled');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Get the Book';
                    showPaymentStatus('Payment cancelled', 'warning');
                },
                escape: true,
                backdrop_close: false
            }
        };
        
        // Open Razorpay
        const rzp = new Razorpay(options);
        
        // Add error handler
        rzp.on('payment.failed', function(response) {
            console.error('❌ Payment failed:', response.error);
            showPaymentStatus('❌ Payment failed', 'error');
            alert('Payment failed: ' + response.error.description);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Get the Book';
        });
        
        rzp.open();
        
    } catch (error) {
        console.error('❌ Error:', error);
        showPaymentStatus('❌ Error occurred', 'error');
        alert('Error: ' + error.message);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Get the Book';
    }
}

// 3. FIXED: Verify payment function
async function verifyPaymentViaBackend(razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId, email, userName, amount) {
    try {
        console.log('🔐 Verifying payment...');
        
        // ✅ FIXED: Removed client-side CORS headers
        const verifyResponse = await fetch(`${API_URL}/api/payments/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                razorpay_order_id: razorpayOrderId,
                razorpay_payment_id: razorpayPaymentId,
                razorpay_signature: razorpaySignature,
                order_id: orderId
            })
        });
        
        console.log('📡 Verify response status:', verifyResponse.status);
        
        if (!verifyResponse.ok) {
            const errorText = await verifyResponse.text();
            throw new Error(`Verification failed: ${verifyResponse.status}`);
        }
        
        const verifyData = await verifyResponse.json();
        
        if (verifyData.status !== 'success') {
            throw new Error(verifyData.message || 'Verification failed');
        }
        
        console.log('✅ Payment verified!');
        // ✅ FIXED: Removed redundant sendBookViaEmailJS() - backend already sends email after payment verification
        // This was causing the window to hang when EmailJS had issues
        
        return verifyData;
        
    } catch (error) {
        console.error('❌ Verification error:', error);
        throw error;
    }
}

// <CHANGE> Add null checks to showSuccessMessage
function showSuccessMessage(form, successMessage, email, whatsapp, submitBtn) {
    try {
        // Hide form
        if (form) {
            form.style.display = 'none';
        }
        
        // Show success message
        if (successMessage) {
            successMessage.style.display = 'block';
        }
        
        // <CHANGE> Update success message content with null checks
        const successEmailEl = document.getElementById('success-email');
        const successWhatsappEl = document.getElementById('success-whatsapp');
        
        if (successEmailEl) {
            try {
                successEmailEl.textContent = email;
            } catch (e) {
                console.warn('⚠️ Could not set email text:', e);
            }
        }
        if (successWhatsappEl) {
            try {
                successWhatsappEl.textContent = '📱 ' + whatsapp;
            } catch (e) {
                console.warn('⚠️ Could not set whatsapp text:', e);
            }
        }
        
        // Add celebration animation
        createCelebrationEffect();
        
        console.log('✨ Purchase complete!');
    } catch (error) {
        console.error('❌ Error in showSuccessMessage:', error);
        // Still show basic success even if elements fail
        alert('✅ Payment successful! Email has been sent to ' + email);
    }
}

function initializeAmountButtons() {
    const amountButtons = document.querySelectorAll('.amount-btn');
    const amountInput = document.getElementById('amount');
    
    console.log(`📊 Found ${amountButtons.length} amount buttons`);
    
    amountButtons.forEach((button, index) => {
        const amount = button.dataset.amount;
        console.log(`Button ${index + 1}: ₹${amount}`);
        
        button.addEventListener('click', () => {
            const selectedAmount = button.dataset.amount;
            amountInput.value = selectedAmount;
            console.log(`💰 Amount selected: ₹${selectedAmount}`);
            
            // Remove active class from all buttons
            amountButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
        });
    });
}

function initializeHoverEffects() {
    // Enhanced button hover effects
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .get-book-btn');
    
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            gsap.to(button, {
                duration: 0.3,
                scale: 1.05,
                boxShadow: "0 15px 35px rgba(184, 70, 46, 0.4)",
                ease: "power2.out"
            });
        });
        
        button.addEventListener('mouseleave', () => {
            gsap.to(button, {
                duration: 0.3,
                scale: 1,
                boxShadow: "0 6px 20px rgba(184, 70, 46, 0.4)",
                ease: "power2.out"
            });
        });
    });
    
    // Card hover effects
    const cards = document.querySelectorAll('.toc-card, .highlight-item');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            gsap.to(card, {
                duration: 0.4,
                y: -10,
                scale: 1.02,
                ease: "power2.out"
            });
        });
        
        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                duration: 0.4,
                y: 0,
                scale: 1,
                ease: "power2.out"
            });
        });
    });
}

// Autumn Effects
function initializeAutumnEffects() {
    // Create additional falling leaves
    createFallingLeaves();
    
    // Seasonal animations
    createSeasonalAnimations();
    
    // Tree animation in intro
    animateAutumnTree();
}

function createFallingLeaves() {
    const numLeaves = 10;
    
    for (let i = 0; i < numLeaves; i++) {
        createLeaf(i);
    }
}

function createLeaf(index) {
    const leaf = document.createElement('div');
    leaf.className = 'falling-leaf';
    leaf.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        background: linear-gradient(45deg, #D2691E, #B8462E);
        border-radius: 0 100% 0 100%;
        pointer-events: none;
        z-index: 100;
        opacity: 0.8;
    `;
    
    // Random starting position
    leaf.style.left = Math.random() * window.innerWidth + 'px';
    leaf.style.top = '-20px';
    
    document.body.appendChild(leaf);
    
    // Animate leaf falling
    gsap.to(leaf, {
        duration: Math.random() * 5 + 5,
        y: window.innerHeight + 50,
        x: Math.random() * 200 - 100,
        rotation: Math.random() * 360,
        ease: "power1.inOut",
        delay: Math.random() * 2,
        onComplete: () => {
            leaf.remove();
            // Create new leaf
            setTimeout(() => createLeaf(index), Math.random() * 3000);
        }
    });
}

function createSeasonalAnimations() {
    // Gentle swaying animation for tree elements
    const treeElements = document.querySelectorAll('.tree-trunk, .autumn-tree-container');
    
    treeElements.forEach((element, index) => {
        gsap.to(element, {
            duration: 3 + index,
            rotation: 2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });
    });
}

function animateAutumnTree() {
    const treeContainer = document.querySelector('.autumn-tree-container');
    
    if (treeContainer) {
        gsap.timeline({ repeat: -1 })
            .to(treeContainer, {
                duration: 2,
                scale: 1.05,
                ease: "sine.inOut"
            })
            .to(treeContainer, {
                duration: 2,
                scale: 1,
                ease: "sine.inOut"
            });
    }
}

// Main Animation Functions
function startMainAnimations() {
    console.log('🎬 Starting main animations...');
    
    // Hero section entrance
    gsap.timeline()
        .from('.title-animate', {
            duration: 1,
            y: -100,
            opacity: 0,
            scale: 0.5,
            ease: "back.out(1.7)"
        })
        .from('.subtitle-animate', {
            duration: 1,
            x: -100,
            opacity: 0,
            ease: "power2.out"
        }, "-=0.5")
        .from('.author-text', {
            duration: 1,
            opacity: 0,
            scale: 0.8,
            ease: "power2.out"
        }, "-=0.5")
        .from('.hero-cta', {
            duration: 1,
            y: 50,
            opacity: 0,
            ease: "power2.out"
        }, "-=0.5");
    
    // Start floating animations
    startFloatingAnimations();
}

function startFloatingAnimations() {
    const floatingElements = document.querySelectorAll('.floating-leaf');
    
    floatingElements.forEach((element, index) => {
        gsap.to(element, {
            duration: 10 + index * 2,
            y: "-=50",
            rotation: 360,
            repeat: -1,
            ease: "sine.inOut",
            delay: index * 0.5
        });
    });
}

// EmailJS Functions
async function sendBookViaEmailJS(email, name, orderId, amount = 0) {
    try {
        console.log('📧 Sending book via EmailJS to:', email);
        
        // Prepare email parameters
        const templateParams = {
            to_email: email,
            to_name: name,
            order_id: orderId,
            amount: amount,
            book_title: 'Code with Destiny - Tales from the Engineering Trenches',
            download_message: amount > 0 ? 
                'Thank you for your purchase! Here is your digital copy of the book.' :
                'Here is your complimentary copy of the book. We hope you enjoy it!'
        };
        
        console.log('📋 Email template params:', templateParams);
        
        // Send email via EmailJS
        const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            templateParams,
            EMAILJS_PUBLIC_KEY
        );
        
        console.log('✅ EmailJS response:', response);
        
        if (response.status === 200) {
            console.log('📧 Book sent successfully via EmailJS!');
            return { success: true, message: 'Book sent successfully!' };
        } else {
            throw new Error(`EmailJS returned status: ${response.status}`);
        }
        
    } catch (error) {
        console.error('❌ EmailJS error:', error);
        
        // Don't throw error for header access issues
        if (error.message && error.message.includes('unsafe header')) {
            console.warn('⚠️ EmailJS header access warning (non-critical):', error.message);
            return { success: true, message: 'Email sent (header warning ignored)' };
        }
        
        throw new Error(`Failed to send email: ${error.message}`);
    }
}

// Celebration Effect
function createCelebrationEffect() {
    const colors = ['#D2691E', '#B8462E', '#DAA520', '#8B4513'];
    
    for (let i = 0; i < 30; i++) {
        createConfetti(colors[Math.floor(Math.random() * colors.length)]);
    }
}

function createConfetti(color) {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
        position: fixed;
        width: 10px;
        height: 10px;
        background: ${color};
        pointer-events: none;
        z-index: 10000;
        border-radius: 50%;
    `;
    
    confetti.style.left = Math.random() * window.innerWidth + 'px';
    confetti.style.top = '-20px';
    
    document.body.appendChild(confetti);
    
    gsap.to(confetti, {
        duration: Math.random() * 3 + 2,
        y: window.innerHeight + 50,
        x: Math.random() * 200 - 100,
        rotation: Math.random() * 360,
        opacity: 0,
        ease: "power2.in",
        onComplete: () => confetti.remove()
    });
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Emergency payment modal management
function addEmergencyPaymentControls() {
    // Add keyboard shortcut to close stuck payment modal
    document.addEventListener('keydown', (e) => {
        // Ctrl + Alt + C to close payment modal
        if (e.ctrlKey && e.altKey && e.key === 'c') {
            if (window.emergencyClosePayment) {
                console.log('🚨 Keyboard shortcut: Closing payment modal');
                window.emergencyClosePayment();
            }
        }
    });
    
    // Add emergency close button (hidden, appears when modal is stuck)
    const emergencyBtn = document.createElement('button');
    emergencyBtn.id = 'emergency-close-payment';
    emergencyBtn.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 5px;
        cursor: pointer;
        z-index: 999999;
        display: none;
        font-size: 12px;
        font-weight: bold;
    `;
    emergencyBtn.innerHTML = '✖️ Close Payment';
    emergencyBtn.onclick = () => {
        if (window.emergencyClosePayment) {
            window.emergencyClosePayment();
            emergencyBtn.style.display = 'none';
        }
    };
    
    document.body.appendChild(emergencyBtn);
    
    // Show emergency button after 30 seconds if payment modal is still open
    setTimeout(() => {
        if (window.currentRazorpayInstance) {
            emergencyBtn.style.display = 'block';
            console.log('🚨 Emergency close button now visible');
        }
    }, 30000);
    
    return emergencyBtn;
}

// CORS-safe fetch wrapper
async function safeFetch(url, options = {}) {
    try {
        // Add CORS headers to help with cross-origin requests
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
        
        const safeOptions = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };
        
        const response = await fetch(url, safeOptions);
        
        // Don't try to access potentially unsafe headers
        console.log(`📡 Request to ${url} completed with status: ${response.status}`);
        
        return response;
        
    } catch (error) {
        // Handle network errors gracefully
        if (error.message.includes('unsafe header') || error.message.includes('CORS')) {
            console.warn('⚠️ CORS-related warning (non-critical):', error.message);
            // Return a mock successful response for header access errors
            throw new Error('Network request failed, but this may be due to browser security restrictions');
        }
        throw error;
    }
}

// Error Handling
window.addEventListener('error', (error) => {
    console.error('🚨 Website error:', error);
    
    // Filter out CORS header access errors that don't affect functionality
    if (error.message && error.message.includes('unsafe header')) {
        console.warn('⚠️ CORS header access warning (non-critical):', error.message);
        return; // Don't show this error to users
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled promise rejection:', event.reason);
    
    // Filter out CORS-related rejections
    if (event.reason && event.reason.message && event.reason.message.includes('unsafe header')) {
        console.warn('⚠️ CORS header promise rejection (non-critical):', event.reason.message);
        event.preventDefault(); // Prevent the error from being logged as uncaught
        return;
    }
});

// Performance Monitoring
if ('performance' in window) {
    window.addEventListener('load', () => {
        const loadTime = performance.now();
        console.log(`⚡ Website loaded in ${loadTime.toFixed(2)}ms`);
    });
}

// Console Art
console.log(`
🍂 Code with Destiny 🍂
═══════════════════════
    Welcome to an
  engineering journey!
═══════════════════════
`);

console.log('🎨 Website designed with autumn magic ✨');
console.log(`
💡 Payment Modal Stuck? Try these:
═══════════════════════════════
1. Press Ctrl + Alt + C
2. Wait for red "Close Payment" button (top-right)
3. Run: emergencyClosePayment() in console
4. Refresh page if needed
═══════════════════════════════
`);

// Test function to manually load PDF
window.testPDFLoad = async function() {
    console.log('🧪 Manual PDF test starting...');
    
    // Check if PDF.js is available
    if (typeof pdfjsLib === 'undefined') {
        console.error('❌ PDF.js not available');
        return false;
    }
    
    try {
        // Try to fetch the PDF first
        const response = await fetch('./book.pdf');
        console.log('📡 Fetch response:', response.status, response.statusText);
        
        if (!response.ok) {
            console.error('❌ Cannot fetch PDF file');
            return false;
        }
        
        // Try to load with PDF.js
        const pdfDoc = await pdfjsLib.getDocument('./book.pdf').promise;
        console.log('✅ PDF loaded! Pages:', pdfDoc.numPages);
        return true;
        
    } catch (error) {
        console.error('❌ PDF test failed:', error);
        return false;
    }
};

console.log('💡 Tip: Run testPDFLoad() in console to test PDF loading manually');

let isScrolling;

window.addEventListener('scroll', () => {
  document.body.classList.add('scrolling');

  clearTimeout(isScrolling);
  isScrolling = setTimeout(() => {
    document.body.classList.remove('scrolling');
  }, 300); // Adjust timeout as needed
});

