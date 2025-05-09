document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('webcam');
    const asciiOutput = document.getElementById('ascii-output');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const resolutionSelect = document.getElementById('resolution');
    const charsetSelect = document.getElementById('charset');
    const colorModeSelect = document.getElementById('colorMode');
    const updateSpeedInput = document.getElementById('updateSpeed');
    const speedValueDisplay = document.getElementById('speedValue');
    const watchdogsModeBtn = document.getElementById('watchdogsMode');
    const enhanceDetailBtn = document.getElementById('enhanceDetail');
    const saveCaptureBtn = document.getElementById('saveCapture');
    const timestampDisplay = document.querySelector('.timestamp');
    const terminalPrompt = document.querySelector('.typing-effect');
    
    let isStreaming = false;
    let processingInterval = null;
    let isWatchdogsMode = false;
    let enhancedDetail = false;
    let startTime = null;
    
    // Character sets for different detail levels
    const charSets = {
        standard: '@%#*+=-:. ',
        simple: '@#. ',
        complex: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ',
        matrix: '01'
    };
    
    // Resolution settings (width in characters) - REDUCED
    const resolutions = {
        ultra: { width: 120, height: 60 },
        high: { width: 100, height: 50 },
        medium: { width: 80, height: 40 },
        low: { width: 60, height: 30 }
    };
    
    // Initialize canvas for image processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // Update timestamp
    function updateTimestamp() {
        if (startTime) {
            const elapsed = Math.floor((new Date() - startTime) / 1000);
            const hours = Math.floor(elapsed / 3600).toString().padStart(2, '0');
            const minutes = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            timestampDisplay.textContent = `${hours}:${minutes}:${seconds}`;
        }
    }
    
    setInterval(updateTimestamp, 1000);
    
    // Update speed value display
    updateSpeedInput.addEventListener('input', () => {
        speedValueDisplay.textContent = updateSpeedInput.value;
        if (isStreaming) {
            clearInterval(processingInterval);
            startProcessing();
        }
    });
    
    // Start webcam stream
    startBtn.addEventListener('click', async () => {
        if (isStreaming) return;
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            
            video.srcObject = stream;
            video.onloadedmetadata = () => {
                video.play();
                isStreaming = true;
                startTime = new Date();
                startProcessing();
                
                startBtn.classList.add('btn-active');
                updateStatus('webcam connected. processing feed...');
            };
        } catch (err) {
            console.error('Error accessing webcam:', err);
            asciiOutput.textContent = 'Error: Webcam access denied. Check permissions.';
            updateStatus('error: webcam access denied');
        }
    });
    
    // Stop webcam stream
    stopBtn.addEventListener('click', () => {
        if (!isStreaming) return;
        
        const stream = video.srcObject;
        const tracks = stream.getTracks();
        
        tracks.forEach(track => track.stop());
        video.srcObject = null;
        isStreaming = false;
        startTime = null;
        
        clearInterval(processingInterval);
        asciiOutput.textContent = 'webcam disconnected.';
        
        startBtn.classList.remove('btn-active');
        updateStatus('webcam disconnected');
    });
    
    // Toggle Watch Dogs mode
    watchdogsModeBtn.addEventListener('click', () => {
        isWatchdogsMode = !isWatchdogsMode;
        
        if (isWatchdogsMode) {
            video.classList.add('filter-watchdogs');
            watchdogsModeBtn.classList.add('btn-active');
            
            // Add Watch Dogs overlay elements
            const overlay = document.createElement('div');
            overlay.className = 'watchdogs-overlay';
            video.parentElement.appendChild(overlay);
            
            const info = document.createElement('div');
            info.className = 'watchdogs-info';
            info.innerHTML = 'CTOS v2.0<br>FACIAL RECOGNITION ACTIVE';
            video.parentElement.appendChild(info);
            
            // Add random boxes that simulate facial/object recognition
            addWatchdogsBoxes();
            
            colorModeSelect.value = 'blue';
            updateStatus('watchdogs mode activated');
        } else {
            video.classList.remove('filter-watchdogs');
            watchdogsModeBtn.classList.remove('btn-active');
            
            // Remove Watch Dogs overlay elements
            const overlay = document.querySelector('.watchdogs-overlay');
            if (overlay) overlay.remove();
            
            const info = document.querySelector('.watchdogs-info');
            if (info) info.remove();
            
            // Remove boxes
            document.querySelectorAll('.watchdogs-box').forEach(box => box.remove());
            
            colorModeSelect.value = 'grayscale';
            updateStatus('watchdogs mode deactivated');
        }
        
        if (isStreaming) {
            processFrame();
        }
    });
    
    // Add random boxes to simulate Watch Dogs object recognition
    function addWatchdogsBoxes() {
        if (!isWatchdogsMode) return;
        
        // Clear existing boxes
        document.querySelectorAll('.watchdogs-box').forEach(box => box.remove());
        
        const container = video.parentElement;
        const numBoxes = Math.floor(Math.random() * 2) + 1;
        
        for (let i = 0; i < numBoxes; i++) {
            const box = document.createElement('div');
            box.className = 'watchdogs-box';
            
            const width = Math.floor(Math.random() * 80) + 40;
            const height = Math.floor(Math.random() * 80) + 40;
            const left = Math.floor(Math.random() * (container.offsetWidth - width));
            const top = Math.floor(Math.random() * (container.offsetHeight - height));
            
            box.style.width = `${width}px`;
            box.style.height = `${height}px`;
            box.style.left = `${left}px`;
            box.style.top = `${top}px`;
            
            container.appendChild(box);
        }
        
        // Update boxes periodically
        setTimeout(addWatchdogsBoxes, 2000);
    }
    
    // Toggle enhanced detail
    enhanceDetailBtn.addEventListener('click', () => {
        enhancedDetail = !enhancedDetail;
        
        if (enhancedDetail) {
            enhanceDetailBtn.classList.add('btn-active');
            updateStatus('enhanced detail mode activated');
        } else {
            enhanceDetailBtn.classList.remove('btn-active');
            updateStatus('enhanced detail mode deactivated');
        }
        
        if (isStreaming) {
            processFrame();
        }
    });
    
    // Save current ASCII art
    saveCaptureBtn.addEventListener('click', () => {
        if (!isStreaming) return;
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `ascii-capture-${timestamp}.txt`;
        
        // Get plain text version of ASCII art
        const plainText = asciiOutput.textContent;
        
        // Create download link
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(plainText));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        
        updateStatus(`capture saved as ${filename}`);
    });
    
    // Update status message
    function updateStatus(message) {
        terminalPrompt.textContent = message;
    }
    
    // Process video frame to ASCII
    function processFrame() {
        if (!isStreaming || !video.videoWidth) return;
      
        const videoContainer = video.parentElement;
        const asciiContainer = asciiOutput.parentElement;
      
        const widthPx = videoContainer.clientWidth;
        const heightPx = videoContainer.clientHeight;
      
        // Character size for 10px font approx
        const charWidth = 10;   // approx width of one character at 10px font
        const charHeight = 18; // approx height of one character at 10px font
      
        // Calculate how many characters fit horizontally and vertically
        const charsX = Math.floor(widthPx / charWidth);
        const charsY = Math.floor(heightPx / charHeight);
      
        canvas.width = charsX;
        canvas.height = charsY;
      
        const charset = charSets[charsetSelect.value];
        const colorMode = colorModeSelect.value;
      
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
      
        let asciiImage = '';
      
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const idx = (y * canvas.width + x) * 4;
            const r = pixels[idx];
            const g = pixels[idx + 1];
            const b = pixels[idx + 2];
            const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
            const charIndex = Math.floor(brightness / 255 * (charset.length - 1));
            const char = charset[charIndex];
      
            if (colorMode === 'color') {
              asciiImage += `<span style="color: rgb(${r},${g},${b})">${char}</span>`;
            } else if (colorMode === 'grayscale') {
              const gray = Math.floor(brightness);
              asciiImage += `<span style="color: rgb(${gray},${gray},${gray})">${char}</span>`;
            } else {
              asciiImage += char;
            }
          }
          asciiImage += '\n';
        }
      
        asciiOutput.innerHTML = asciiImage.replace(/\n/g, '<br>');
      }
    
    // Start processing frames at specified interval
    function startProcessing() {
        const updateSpeed = parseInt(updateSpeedInput.value);
        processingInterval = setInterval(processFrame, updateSpeed);
    }
    
    // Handle settings changes
    resolutionSelect.addEventListener('change', () => {
        if (isStreaming) {
            processFrame();
        }
    });
    
    charsetSelect.addEventListener('change', () => {
        if (isStreaming) {
            processFrame();
        }
    });
    
    colorModeSelect.addEventListener('change', () => {
        if (isStreaming) {
            processFrame();
        }
    });
    
    // Initial UI state
    asciiOutput.textContent = 'system initialized. click START to begin.';
    updateStatus('ready');
    
    // Adjust sizing on window resize
    window.addEventListener('resize', () => {
        if (isStreaming) {
            processFrame();
        }
    });
});