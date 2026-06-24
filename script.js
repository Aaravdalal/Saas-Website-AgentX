const html = document.documentElement;
const canvas = document.getElementById("hero-lightpass");
const context = canvas.getContext("2d");

// The frames directory is a subfolder
const frameDir = "Dust_particles_form_question_mark_202606211112_frames";
const frameCount = 192;
const images = [];
let loadedCount = 0;

// Preload images
for (let i = 1; i <= frameCount; i++) {
    const img = new Image();
    const currentFrame = i.toString().padStart(3, '0');
    img.src = `${frameDir}/frame_${currentFrame}.png`;
    
    img.onload = () => {
        images[i] = img;
        loadedCount++;
        if (i === 1) {
            updateCanvas(img);
        }
    };
}

let bgColorSet = false;

function updateCanvas(img) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const hRatio = canvas.width / img.width;
    const vRatio = canvas.height / img.height;
    const ratio = Math.max(hRatio, vRatio);
    
    const centerShift_x = (canvas.width - img.width * ratio) / 2;
    const centerShift_y = (canvas.height - img.height * ratio) / 2;  

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(img, 0, 0, img.width, img.height,
                      centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);  
                      
    if (!bgColorSet) {
        try {
            const pixel = context.getImageData(10, 10, 1, 1).data;
            if (pixel[3] > 0) {
                const bgColor = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
                document.body.style.backgroundColor = bgColor;
                const heroSection = document.getElementById('hero');
                if (heroSection) {
                    heroSection.style.backgroundColor = bgColor;
                    heroSection.classList.remove('bg-white');
                }
            }
            bgColorSet = true;
        } catch (e) {
            console.error("Could not read canvas pixel data", e);
        }
    }
}

// Helper: get scroll fraction relative to the animation container
function getAnimationScrollFraction() {
    const spacer = document.querySelector('.animation-container');
    if (!spacer) return 0;
    const rect = spacer.getBoundingClientRect();
    const containerTop = rect.top;
    const containerHeight = rect.height;
    const windowHeight = window.innerHeight;
    
    // How far into the container we've scrolled (0 = top edge at viewport top, 1 = bottom edge at viewport bottom)
    const scrollableDistance = containerHeight - windowHeight;
    if (scrollableDistance <= 0) return 0;
    
    // containerTop starts positive (below viewport) and goes negative (above viewport)
    const scrolled = -containerTop;
    return Math.max(0, Math.min(1, scrolled / scrollableDistance));
}

// Handle Scroll
window.addEventListener('scroll', () => {  
    const scrollFraction = getAnimationScrollFraction();
    
    // Map scroll fraction to a frame index (1 to 192)
    const frameIndex = Math.min(
        frameCount,
        Math.max(1, Math.ceil(scrollFraction * frameCount))
    );
    
    // Find the closest loaded frame
    let drawIndex = frameIndex;
    if (!images[drawIndex]) {
        for (let i = frameIndex; i >= 1; i--) {
            if (images[i]) {
                drawIndex = i;
                break;
            }
        }
    }
    
    if (!images[drawIndex]) {
        for (let i = frameIndex; i <= frameCount; i++) {
            if (images[i]) {
                drawIndex = i;
                break;
            }
        }
    }

    if (images[drawIndex]) {
        requestAnimationFrame(() => updateCanvas(images[drawIndex]));
    }

    // Fade and blur text overlays synced to animation
    const textOverlays = document.querySelectorAll('.hero-text-overlay');
    textOverlays.forEach(overlay => {
        if (scrollFraction > 0.1) {
            const progress = Math.min(1, Math.max(0, (scrollFraction - 0.1) / 0.7));
            overlay.style.opacity = progress;
            const blurAmount = 20 * (1 - progress);
            overlay.style.filter = `blur(${blurAmount}px)`;
            overlay.style.transform = `translateY(${20 * (1 - progress)}px)`;
        } else {
            overlay.style.opacity = 0;
            overlay.style.filter = 'blur(20px)';
            overlay.style.transform = 'translateY(20px)';
        }
    });
});

// Handle resize
window.addEventListener('resize', () => {
    const scrollFraction = getAnimationScrollFraction();
    
    const frameIndex = Math.min(
        frameCount,
        Math.max(1, Math.ceil(scrollFraction * frameCount))
    );
    
    let drawIndex = frameIndex;
    while (!images[drawIndex] && drawIndex > 1) {
        drawIndex--;
    }

    if (images[drawIndex]) {
        updateCanvas(images[drawIndex]);
    }
});

// Handle interactive steps accordion
window.toggleStep = function(step) {
    for (let i = 1; i <= 3; i++) {
        const container = document.getElementById(`step-container-${i}`);
        const title = document.getElementById(`step-title-${i}`);
        const desc = document.getElementById(`step-desc-${i}`);
        
        if (i === step) {
            container.classList.remove('border-t', 'border-gray-200', 'hover:border-gray-400');
            container.classList.add('border-t-2', 'border-black');
            title.classList.remove('text-gray-500', 'font-medium');
            title.classList.add('text-black', 'font-bold');
            desc.classList.remove('hidden');
        } else {
            container.classList.remove('border-t-2', 'border-black');
            container.classList.add('border-t', 'border-gray-200', 'hover:border-gray-400');
            title.classList.remove('text-black', 'font-bold');
            title.classList.add('text-gray-500', 'font-medium');
            desc.classList.add('hidden');
        }
    }
}

window.currentScrollStep = 1;

// Scroll Spy for Install Section
window.addEventListener('scroll', () => {
    const installSection = document.getElementById('install-section');
    if (!installSection) return;

    const rect = installSection.getBoundingClientRect();
    const sectionTop = rect.top;
    const windowHeight = window.innerHeight;
    const scrollableDistance = windowHeight * 2;

    if (sectionTop <= 0 && sectionTop >= -scrollableDistance) {
        const scrollDistance = -sectionTop;
        const progress = scrollDistance / scrollableDistance;

        let activeStep = 1;
        if (progress > 0.66) {
            activeStep = 3;
        } else if (progress > 0.33) {
            activeStep = 2;
        }

        if (window.currentScrollStep !== activeStep) {
            window.currentScrollStep = activeStep;
            if (typeof window.toggleStep === 'function') {
                window.toggleStep(activeStep);
            }
        }
    } else if (sectionTop > 0 && window.currentScrollStep !== 1) {
        window.currentScrollStep = 1;
        if (typeof window.toggleStep === 'function') window.toggleStep(1);
    } else if (sectionTop < -scrollableDistance && window.currentScrollStep !== 3) {
        window.currentScrollStep = 3;
        if (typeof window.toggleStep === 'function') window.toggleStep(3);
    }
});

// Scroll-driven card reveal for features section
window.addEventListener('scroll', () => {
    const section = document.getElementById('features-cards');
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const sectionTop = rect.top;
    const windowHeight = window.innerHeight;
    // Section is 400vh, so scrollable distance is 300vh
    const scrollableDistance = windowHeight * 3;

    if (sectionTop <= 0 && sectionTop >= -scrollableDistance) {
        const scrolled = -sectionTop;
        const progress = scrolled / scrollableDistance; // 0 to 1

        const card1 = document.querySelector('[data-card="1"]');
        const card2 = document.querySelector('[data-card="2"]');
        const card3 = document.querySelector('[data-card="3"]');

        // Helper function for up-and-down animation (0 -> 1 -> 0)
        function getLift(prog, startRise, endRise, startFall, endFall) {
            if (prog < startRise) return 0;
            if (prog >= startRise && prog < endRise) return (prog - startRise) / (endRise - startRise);
            if (prog >= endRise && prog < startFall) return 1;
            if (prog >= startFall && prog <= endFall) return 1 - ((prog - startFall) / (endFall - startFall));
            return 0;
        }

        // Card 1 lifts, holds, and falls back
        const p1 = getLift(progress, 0.00, 0.15, 0.20, 0.35);
        if (card1) {
            const liftY = -75 - (180 * p1);
            card1.style.transform = `skewY(-8deg) translateX(-120px) translateY(${liftY}px)`;
            
            const overlay1 = card1.querySelector('.display-card-overlay');
            if (overlay1) overlay1.style.opacity = 1 - p1;
        }

        // Card 2 lifts, holds, and falls back
        const p2 = getLift(progress, 0.30, 0.45, 0.50, 0.65);
        if (card2) {
            const liftY = 0 - (180 * p2);
            card2.style.transform = `skewY(-8deg) translateX(0px) translateY(${liftY}px)`;
            
            const overlay2 = card2.querySelector('.display-card-overlay');
            if (overlay2) overlay2.style.opacity = 1 - p2;
        }

        // Card 3 lifts, holds, and falls back
        const p3 = getLift(progress, 0.60, 0.75, 0.85, 0.95);
        if (card3) {
            const liftY = 75 - (180 * p3);
            card3.style.transform = `skewY(-8deg) translateX(120px) translateY(${liftY}px)`;
            
            const overlay3 = card3.querySelector('.display-card-overlay');
            if (overlay3) overlay3.style.opacity = 1 - p3;
        }
    }
});

// Add event listeners to gradient inputs for custom animation replay
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.input-gradient-focus input').forEach(input => {
        input.addEventListener('focus', () => {
            const wrapper = input.closest('.input-gradient-focus');
            wrapper.classList.remove('play-gradient-out');
            wrapper.classList.remove('play-gradient-once');
            void wrapper.offsetWidth; // force reflow
            wrapper.classList.add('play-gradient-once');
        });

        input.addEventListener('blur', () => {
            const wrapper = input.closest('.input-gradient-focus');
            if (input.value.trim() !== '') {
                wrapper.classList.remove('play-gradient-out');
                wrapper.classList.add('keep-gradient');
                wrapper.classList.remove('play-gradient-once');
                void wrapper.offsetWidth; // force reflow
                wrapper.classList.add('play-gradient-once');
            } else {
                wrapper.classList.remove('keep-gradient');
                wrapper.classList.remove('play-gradient-once');
                
                // Trigger the fade-out sweep animation
                wrapper.classList.remove('play-gradient-out');
                void wrapper.offsetWidth;
                wrapper.classList.add('play-gradient-out');
            }
        });
    });

    // Google button hover animations
    document.querySelectorAll('.google-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.classList.remove('gradient-out');
            void btn.offsetWidth; // force reflow
            btn.classList.add('gradient-in');
        });

        btn.addEventListener('mouseleave', () => {
            btn.classList.remove('gradient-in');
            void btn.offsetWidth; // force reflow
            btn.classList.add('gradient-out');
        });
    });
});

// Init Matrix Animation for North Star section
function initMatrix() {
    const canvas = document.getElementById('matrix-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width, height;
    function resize() {
        width = canvas.offsetWidth;
        height = canvas.offsetHeight;
        canvas.width = width;
        canvas.height = height;
    }
    resize();
    window.addEventListener('resize', resize);

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+{}[]|<>/?\\".split('');
    const fontSize = 32;
    let columns = width / fontSize;
    let drops = [];
    for (let x = 0; x < columns; x++) drops[x] = Math.random() * (height / fontSize);

    function drawMatrix() {
        // Semi-transparent white to create trail effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(0, 0, width, height);

        // Create gradient for the text
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#ffcce6');
        gradient.addColorStop(1, '#8ec5fc');
        
        ctx.fillStyle = gradient;
        ctx.font = 'bold ' + fontSize + 'px "Courier New", Courier, monospace';
        
        // Ensure columns match width after resize
        if (Math.floor(width / fontSize) !== drops.length) {
            columns = width / fontSize;
            drops = [];
            for (let x = 0; x < columns; x++) drops[x] = Math.random() * (height / fontSize);
        }

        for (let i = 0; i < drops.length; i++) {
            const text = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            if (drops[i] * fontSize > height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++; // Move down exactly one row to prevent text smearing
        }
    }
    // Control falling speed by adjusting frame rate (90ms = matrix effect speed)
    setInterval(drawMatrix, 90);
}

document.addEventListener('DOMContentLoaded', initMatrix);

// Init ASCII Clouds
function initAsciiClouds() {
    const targets = document.querySelectorAll('.ascii-cloud-target');
    if (targets.length === 0) return;

    // Shared noise generation
    const noiseSize = 256;
    const noise = new Float32Array(noiseSize * noiseSize);
    for(let i=0; i<noise.length; i++) noise[i] = Math.random();
    
    function smoothNoise(x, y) {
        const xf = Math.floor(x);
        const yf = Math.floor(y);
        const xi = x - xf;
        const yi = y - yf;
        
        let x0 = xf % noiseSize;
        if (x0 < 0) x0 += noiseSize;
        let y0 = yf % noiseSize;
        if (y0 < 0) y0 += noiseSize;
        let x1 = (x0 + 1) % noiseSize;
        let y1 = (y0 + 1) % noiseSize;
        
        const u = xi * xi * (3 - 2 * xi);
        const v = yi * yi * (3 - 2 * yi);
        
        const n00 = noise[x0 + y0 * noiseSize];
        const n10 = noise[x1 + y0 * noiseSize];
        const n01 = noise[x0 + y1 * noiseSize];
        const n11 = noise[x1 + y1 * noiseSize];
        
        const nx0 = n00 + u * (n10 - n00);
        const nx1 = n01 + u * (n11 - n01);
        return nx0 + v * (nx1 - nx0);
    }
    
    function fractalNoise(x, y, z) {
        let n = 0;
        let amp = 0.5;
        let freq = 1;
        const zOffsetX = z * 0.1;
        const zOffsetY = z * 0.15;
        for (let i = 0; i < 4; i++) {
            n += amp * smoothNoise((x + zOffsetX) * freq, (y - zOffsetY) * freq);
            amp *= 0.5;
            freq *= 2.0;
        }
        return n;
    }

    const density = "        ....++++xxxxXXXX####";
    const charWidth = 7;
    const charHeight = 12;

    targets.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        let width, height, cols, rows;
        let time = 0;
        
        const cloudType = canvas.getAttribute('data-cloud-type') || 'bottom-right';
        
        let randX = 0, randY = 0;
        if (cloudType.startsWith('social-card')) {
            // Random bloom location per card every time the page reloads
            randX = Math.random();
            randY = Math.random();
        }
        
        // Bitmap font for AGENT X – letters are 7x9 except for X which is 13x9
        const bitmapFont = {
            'A': [
                [0,0,1,1,1,0,0],
                [0,1,1,0,1,1,0],
                [1,1,0,0,0,1,1],
                [1,1,0,0,0,1,1],
                [1,1,1,1,1,1,1],
                [1,1,0,0,0,1,1],
                [1,1,0,0,0,1,1],
                [1,1,0,0,0,1,1],
                [1,1,0,0,0,1,1],
            ],
            'G': [
                [0,1,1,1,1,1,0],
                [1,1,0,0,0,1,1],
                [1,1,0,0,0,0,0],
                [1,1,0,0,0,0,0],
                [1,1,0,1,1,1,1],
                [1,1,0,0,0,1,1],
                [1,1,0,0,0,1,1],
                [1,1,0,0,0,1,1],
                [0,1,1,1,1,1,0],
            ],
            'E': [
                [1,1,1,1,1,1,1],
                [1,1,0,0,0,0,0],
                [1,1,0,0,0,0,0],
                [1,1,0,0,0,0,0],
                [1,1,1,1,1,1,0],
                [1,1,0,0,0,0,0],
                [1,1,0,0,0,0,0],
                [1,1,0,0,0,0,0],
                [1,1,1,1,1,1,1],
            ],
            'N': [
                [1,1,0,0,0,1,1],
                [1,1,1,0,0,1,1],
                [1,1,1,1,0,1,1],
                [1,1,0,1,0,1,1],
                [1,1,0,1,1,1,1],
                [1,1,0,0,1,1,1],
                [1,1,0,0,0,1,1],
                [1,1,0,0,0,1,1],
                [1,1,0,0,0,1,1],
            ],
            'T': [
                [1,1,1,1,1,1,1],
                [0,0,0,1,0,0,0],
                [0,0,0,1,0,0,0],
                [0,0,0,1,0,0,0],
                [0,0,0,1,0,0,0],
                [0,0,0,1,0,0,0],
                [0,0,0,1,0,0,0],
                [0,0,0,1,0,0,0],
                [0,0,0,1,0,0,0],
            ],
            'X': [
                [1,1,1,0,0,0,0,0,0,0,1,1,1],
                [0,1,1,1,0,0,0,0,0,1,1,1,0],
                [0,0,1,1,1,0,0,0,1,1,1,0,0],
                [0,0,0,1,1,1,0,1,1,1,0,0,0],
                [0,0,0,0,1,1,1,1,1,0,0,0,0],
                [0,0,0,1,1,1,0,1,1,1,0,0,0],
                [0,0,1,1,1,0,0,0,1,1,1,0,0],
                [0,1,1,1,0,0,0,0,0,1,1,1,0],
                [1,1,1,0,0,0,0,0,0,0,1,1,1],
            ],
            ' ': [
                [0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0],
            ],
        };
        const logoText = "AGENT X";
        const letterGap = 2; // gap between letters in bitmap cells
        
        // Calculate total bitmap dimensions with variable character widths
        let bitmapTotalW = 0;
        let bitmapTotalH = 0;
        for (let i = 0; i < logoText.length; i++) {
            const glyph = bitmapFont[logoText[i]];
            if (glyph) {
                bitmapTotalW += glyph[0].length;
                bitmapTotalH = Math.max(bitmapTotalH, glyph.length);
            }
            if (i < logoText.length - 1) {
                bitmapTotalW += letterGap;
            }
        }
        
        let logoMask = null; // 2D array [rows][cols] of 0 or 1

        function buildLogoMask() {
            logoMask = [];
            for (let r = 0; r < rows; r++) {
                logoMask[r] = new Uint8Array(cols);
            }
            // Determine scale: how many grid cells per bitmap cell
            // We want the logo to fill roughly 85% of the width as a large background watermark
            const targetW = Math.floor(cols * 0.85);
            const scale = Math.max(1, Math.floor(targetW / bitmapTotalW));
            const scaledW = bitmapTotalW * scale;
            const scaledH = bitmapTotalH * scale;
            // Center the logo
            const offsetX = Math.floor((cols - scaledW) / 2);
            const offsetY = Math.floor((rows - scaledH) / 2);

            let currentX = 0;
            for (let charIdx = 0; charIdx < logoText.length; charIdx++) {
                const ch = logoText[charIdx];
                const glyph = bitmapFont[ch];
                if (!glyph) continue;
                
                const charW = glyph[0].length;
                const charH = glyph.length;
                const charOffsetY = Math.floor((bitmapTotalH - charH) / 2); // vertically center

                for (let by = 0; by < charH; by++) {
                    for (let bx = 0; bx < charW; bx++) {
                        if (glyph[by][bx]) {
                            // Fill scaled block
                            for (let sy = 0; sy < scale; sy++) {
                                for (let sx = 0; sx < scale; sx++) {
                                    const gx = offsetX + (currentX + bx) * scale + sx;
                                    const gy = offsetY + (charOffsetY + by) * scale + sy;
                                    if (gx >= 0 && gx < cols && gy >= 0 && gy < rows) {
                                        logoMask[gy][gx] = 1;
                                    }
                                }
                            }
                        }
                    }
                }
                currentX += charW + letterGap;
            }
        }

        function resize() {
            if (canvas.id === 'ascii-cloud-canvas') {
                width = window.innerWidth;
                height = window.innerHeight;
            } else {
                width = canvas.parentElement.clientWidth;
                height = canvas.parentElement.clientHeight;
            }
            canvas.width = width;
            canvas.height = height;
            cols = Math.ceil(width / charWidth) + 1;
            rows = Math.ceil(height / charHeight) + 1;

            if (cloudType === 'footer') {
                buildLogoMask();
            }
        }
        resize();
        window.addEventListener('resize', resize);

        function draw() {
            ctx.clearRect(0, 0, width, height);
            
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            if (cloudType === 'top-bleed') {
                gradient.addColorStop(0, '#e0c3fc');
                gradient.addColorStop(1, '#e0c3fc');
            } else {
                gradient.addColorStop(0, '#ff99cc');
                gradient.addColorStop(0.3, '#ffcce6');
                gradient.addColorStop(0.6, '#8ec5fc');
                gradient.addColorStop(1, '#e0c3fc');
            }
            
            ctx.fillStyle = gradient;
            ctx.font = `bold ${charHeight}px monospace`;
            ctx.textBaseline = 'top';
            
            let timeStep = 0.02;
            let scaleX = 0.05;
            let scaleY = 0.05;
            
            if (cloudType.includes('fire')) {
                timeStep = 0.04;
                scaleX = 0.08;
                scaleY = 0.02; // Stretch vertically
            } else if (cloudType === 'footer') {
                timeStep = 0.01;
                scaleX = 0.015;
                scaleY = 0.015; // Zoomed in large shapes
            }
            
            time += timeStep;
            
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const yFactor = y / rows;
                    const xFactor = x / cols;
                    const n = fractalNoise(x * scaleX, y * scaleY, time);
                    
                    let v;
                    if (cloudType === 'bottom-right') {
                        v = (n * 1.5) + (yFactor * 1.2) + (xFactor * 0.8) - 1.4;
                    } else if (cloudType.startsWith('social-card')) {
                        const dx = xFactor - randX;
                        const dy = yFactor - randY;
                        const dist = Math.sqrt(dx*dx + dy*dy);
                        // Bloom from the randomized center
                        v = (n * 1.5) + ((1 - dist) * 1.5) - 1.2;
                    } else if (cloudType === 'top-bleed') {
                        // Dense at the top edge, fading out downwards
                        v = (n * 1.5) + ((1 - yFactor) * 1.5) - 0.8;
                    } else if (cloudType === 'bottom-outline') {
                        // Dense at the bottom edge for the nav bar
                        v = (n * 1.5) + (yFactor * 2.0) - 1.2;
                    } else if (cloudType === 'modal-cloud') {
                        // Taller cloud for modal screen
                        v = (n * 1.5) + (yFactor * 1.8) + (xFactor * 1.0) - 1.1;
                    } else if (cloudType === 'bottom-left-fire') {
                        v = (n * 1.8) + (yFactor * 1.8) + ((1 - xFactor) * 0.8) - 1.8;
                    } else if (cloudType === 'bottom-fire') {
                        v = (n * 2.0) + (yFactor * 2.0) - 1.5;
                    } else if (cloudType === 'left') {
                        v = (n * 1.5) + ((1 - xFactor) * 1.5) - 1.2;
                    } else if (cloudType === 'bottom') {
                        v = (n * 1.5) + (yFactor * 1.5) - 1.0;
                    } else if (cloudType === 'footer') {
                        const inLetter = logoMask && logoMask[y] && logoMask[y][x];
                        if (inLetter) {
                            // Always dense inside the letter – use noise for character variety only
                            v = 0.55 + (n * 0.44); // Range ~0.55–0.99: always picks dense chars
                        } else {
                            v = -1; // Empty outside the letters
                        }
                    } else {
                        v = (n * 1.5) + (yFactor * 1.2) + (xFactor * 0.8) - 1.4;
                    }
                    
                    if (v < 0) v = 0;
                    if (v > 0.99) v = 0.99;
                    
                    const charIndex = Math.floor(v * density.length);
                    const char = density[charIndex];
                    
                    if (char !== ' ') {
                        ctx.fillText(char, x * charWidth, y * charHeight);
                    }
                }
            }
            requestAnimationFrame(draw);
        }
        draw();
    });
}
document.addEventListener('DOMContentLoaded', initAsciiClouds);

// Init Typing Effect
function initTypingEffect() {
    const container = document.getElementById('typing-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Create elements
    const elStop = document.createElement('span');
    const elBr = document.createElement('br');
    const elWord1 = document.createElement('span');
    elWord1.className = "italic font-['Playfair_Display'] text-gray-800";
    const elWord2 = document.createElement('span');
    elWord2.className = "italic font-['Playfair_Display'] text-transparent bg-clip-text bg-[linear-gradient(135deg,#ff99cc_0%,#ffcce6_30%,#8ec5fc_60%,#e0c3fc_100%)]";
    
    const cursorEl = document.createElement('span');
    cursorEl.textContent = "|";
    cursorEl.className = "text-transparent bg-clip-text bg-[linear-gradient(135deg,#ff99cc_0%,#ffcce6_30%,#8ec5fc_60%,#e0c3fc_100%)] transition-opacity duration-100";
    cursorEl.style.marginLeft = "4px";
    
    container.appendChild(elStop);
    container.appendChild(cursorEl);
    
    // Blinking cursor
    let cursorVisible = true;
    setInterval(() => {
        cursorVisible = !cursorVisible;
        cursorEl.style.opacity = cursorVisible ? '1' : '0';
    }, 500);

    const typeText = async (el, text, speed = 80) => {
        for (let i = 0; i < text.length; i++) {
            el.textContent += text.charAt(i);
            await new Promise(r => setTimeout(r, speed));
        }
    };

    const deleteText = async (el, speed = 40) => {
        while (el.textContent.length > 0) {
            el.textContent = el.textContent.slice(0, -1);
            await new Promise(r => setTimeout(r, speed));
        }
    };

    const wait = ms => new Promise(r => setTimeout(r, ms));

    const runSequence = async () => {
        await wait(500);
        await typeText(elStop, "Stop ");
        
        container.insertBefore(elBr, cursorEl);
        container.insertBefore(elWord1, cursorEl);
        container.insertBefore(elWord2, cursorEl);
        
        await typeText(elWord1, "AI ");
        await typeText(elWord2, "hallucinations");
        
        while(true) {
            await wait(5000); // Stay for 5 seconds
            
            await deleteText(elWord2);
            await typeText(elWord1, "rogue ");
            await typeText(elWord2, "agents");
            
            await wait(5000); // Stay for 5 seconds
            
            await deleteText(elWord2);
            await deleteText(elWord1);
            await typeText(elWord1, "AI ");
            await typeText(elWord2, "hallucinations");
        }
    };
    
    runSequence();
}
function initStatScramble() {
    const statElements = document.querySelectorAll('.stat-scramble');
    const chars = '!<>-_\\\\/[]{}—=+*^?#_&%$@'; // Symbol characters
    const totalDuration = 1500; // Total animation time (ms)
    
    statElements.forEach(el => {
        const finalString = el.getAttribute('data-final-text');
        if (!finalString) return;
        
        let startTime = null;
        
        function updateScramble(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / totalDuration, 1);
            
            // Number of characters from the final string that are 'locked in'
            const charsToLock = Math.floor(finalString.length * percentage);
            
            let currentString = '';
            for (let i = 0; i < finalString.length; i++) {
                if (i < charsToLock) {
                    currentString += finalString[i];
                } else if (finalString[i] === ' ' || finalString[i] === '.' || finalString[i] === '%') {
                    // Keep spaces and symbols locked
                    currentString += finalString[i];
                } else {
                    currentString += chars[Math.floor(Math.random() * chars.length)];
                }
            }
            
            el.textContent = currentString;
            
            if (percentage < 1) {
                requestAnimationFrame(updateScramble);
            } else {
                el.textContent = finalString; // Ensure exact final text
            }
        }
        
        requestAnimationFrame(updateScramble);
    });
}

function initNavTopo() {
    const canvas = document.getElementById('nav-topo-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    function resize() {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        draw();
    }
    
    const chars = '!@#$%^&*()~<>{}[]|/\\+=';
    
    // Simple 2D noise using sin-based hash
    function noise(x, y) {
        return (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
    }
    
    function smoothNoise(x, y) {
        const ix = Math.floor(x), iy = Math.floor(y);
        const fx = x - ix, fy = y - iy;
        const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
        const n00 = noise(ix, iy), n10 = noise(ix + 1, iy);
        const n01 = noise(ix, iy + 1), n11 = noise(ix + 1, iy + 1);
        const nx0 = n00 + (n10 - n00) * sx;
        const nx1 = n01 + (n11 - n01) * sx;
        return nx0 + (nx1 - nx0) * sy;
    }
    
    function fbm(x, y) {
        let val = 0, amp = 0.5;
        for (let i = 0; i < 4; i++) {
            val += smoothNoise(x, y) * amp;
            x *= 2; y *= 2; amp *= 0.5;
        }
        return val;
    }
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#ff99cc');
        gradient.addColorStop(0.3, '#ffcce6');
        gradient.addColorStop(0.6, '#8ec5fc');
        gradient.addColorStop(1, '#e0c3fc');
        ctx.fillStyle = gradient;
        
        const charSize = 16;
        const cols = Math.ceil(canvas.width / charSize);
        const rows = Math.ceil(canvas.height / charSize);
        const scale = 0.06;
        const numContours = 12;
        
        ctx.font = `bold ${charSize}px monospace`;
        ctx.textBaseline = 'top';
        
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const n = fbm(x * scale, y * scale);
                // Check if near a contour line
                const contourVal = n * numContours;
                const distToContour = Math.abs(contourVal - Math.round(contourVal));
                
                if (distToContour < 0.14) {
                    const ch = chars[Math.floor(Math.abs(noise(x * 7.1, y * 3.7)) * chars.length) % chars.length];
                    ctx.fillText(ch, x * charSize, y * charSize);
                }
            }
        }
    }
    
    resize();
    window.addEventListener('resize', resize);
}

document.addEventListener('DOMContentLoaded', () => {
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    initTypingEffect();
    initStatScramble();
    initNavTopo();
    initSocialCardsSequence();
});

// Social Cards Sequence Animation
function initSocialCardsSequence() {
    const container = document.getElementById('social-cards-container');
    if (!container) return;

    const cards = container.querySelectorAll('.social-card');
    let hasPlayed = false;
    let timerId = null;
    let isUserInteracted = false;

    function resetCards() {
        cards.forEach(card => {
            // Remove active classes
            card.classList.remove('is-active');
            
            // Hide description
            const desc = card.querySelector('.social-desc');
            if (desc) {
                desc.classList.remove('max-h-40', 'opacity-100');
                desc.classList.add('max-h-0', 'opacity-0');
            }
            
            // Reset progress bar immediately
            const prog = card.querySelector('.social-progress');
            if (prog) {
                prog.style.transitionDuration = '0ms';
                prog.style.width = '0%';
            }
        });
    }

    function playCard(index) {
        if (isUserInteracted) return; // Stop auto-sequence if user clicked
        
        resetCards();
        
        if (index >= cards.length) {
            // End of sequence, all remain collapsed
            return;
        }

        activateCard(cards[index], true);

        // Schedule next card
        timerId = setTimeout(() => {
            playCard(index + 1);
        }, 4000);
    }
    
    function activateCard(card, animateProgress = false) {
        card.classList.add('is-active');
        
        // Show description
        const desc = card.querySelector('.social-desc');
        if (desc) {
            desc.classList.remove('max-h-0', 'opacity-0');
            desc.classList.add('max-h-40', 'opacity-100');
        }
        
        // Animate progress bar if part of the sequence
        if (animateProgress) {
            const prog = card.querySelector('.social-progress');
            if (prog) {
                setTimeout(() => {
                    prog.style.transitionDuration = '4000ms';
                    prog.style.width = '100%';
                }, 50);
            }
        }
    }

    // Add click event listeners for manual interaction
    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent global click from firing immediately
            isUserInteracted = true;
            clearTimeout(timerId); // Stop the sequence
            
            const wasActive = card.classList.contains('is-active');
            
            // Reset all cards
            resetCards();
            
            // If the card was NOT active, activate it (toggle behavior)
            if (!wasActive) {
                activateCard(card, false);
            }
        });
    });

    // Collapse when clicking outside the cards
    document.addEventListener('click', (e) => {
        const isClickInsideCard = Array.from(cards).some(card => card.contains(e.target));
        if (!isClickInsideCard) {
            isUserInteracted = true;
            clearTimeout(timerId);
            resetCards(); // collapse all
        }
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !hasPlayed) {
                hasPlayed = true;
                // Wait a moment after scrolling into view before starting
                setTimeout(() => {
                    playCard(0);
                }, 500);
            }
        });
    }, { threshold: 0.5 });

    observer.observe(container);
}

// ==========================================
// Firebase Authentication Integration
// ==========================================

// TODO: Replace with your Firebase project's config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const provider = new firebase.auth.GoogleAuthProvider();

    // Handle Google Login Button Click
    window.handleGoogleLogin = function() {
        auth.signInWithPopup(provider)
            .then((result) => {
                const user = result.user;
                console.log("Logged in as:", user.displayName);
                // The onAuthStateChanged listener handles the UI updates.
            })
            .catch((error) => {
                console.error("Auth Error:", error.message);
                if (error.code !== 'auth/popup-closed-by-user') {
                    alert("Login failed: " + error.message);
                }
            });
    };

    // Listen for Auth State Changes
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in.
            // Close the modal if it's open
            const modal = document.getElementById('request-access-modal');
            if (modal && !modal.classList.contains('hidden')) {
                modal.classList.remove('opacity-100');
                setTimeout(() => {
                    modal.classList.add('hidden');
                    modal.classList.remove('modal-active');
                }, 300);
            }
            
            // Update the "Request Access" button in nav to show their name
            const navCta = document.querySelector('.landing-nav-cta');
            if (navCta) {
                navCta.textContent = user.displayName;
                // Replace onclick to do something else (e.g. sign out)
                navCta.onclick = function(event) {
                    event.preventDefault();
                    if(confirm("Do you want to sign out?")) {
                        auth.signOut();
                    }
                };
            }
        } else {
            // User is signed out.
            const navCta = document.querySelector('.landing-nav-cta');
            if (navCta) {
                navCta.textContent = "Request Access";
                navCta.onclick = function(event) {
                    event.preventDefault();
                    if (typeof openRequestAccessModal === 'function') {
                        openRequestAccessModal();
                    }
                };
            }
        }
    });
} else {
    window.handleGoogleLogin = function() {
        alert("Firebase SDK not loaded properly. Check your connection.");
    }
}
