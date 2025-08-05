// Image upload and camera functionality for product management

class ImageUploadManager {
    constructor() {
        this.currentStream = null;
        this.selectedImageData = null;
        this.maxImageSize = 1024; // Max width/height in pixels
        this.imageQuality = 0.8; // JPEG quality
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Image upload option buttons
        document.getElementById('cameraBtn')?.addEventListener('click', () => this.activateCamera());
        document.getElementById('uploadBtn')?.addEventListener('click', () => this.activateFileUpload());
        document.getElementById('urlBtn')?.addEventListener('click', () => this.activateUrlInput());
        
        // Camera controls
        document.getElementById('captureBtn')?.addEventListener('click', () => this.capturePhoto());
        document.getElementById('closeCameraBtn')?.addEventListener('click', () => this.closeCamera());
        
        // File input
        document.getElementById('imageFileInput')?.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // URL input
        document.getElementById('productImageUrl')?.addEventListener('blur', (e) => this.handleUrlInput(e));
        
        // Remove image
        document.getElementById('removeImageBtn')?.addEventListener('click', () => this.removeImage());
    }

    activateCamera() {
        this.setActiveButton('cameraBtn');
        this.hideAllInputs();
        this.startCamera();
    }

    activateFileUpload() {
        this.setActiveButton('uploadBtn');
        this.hideAllInputs();
        document.getElementById('imageFileInput').click();
    }

    activateUrlInput() {
        this.setActiveButton('urlBtn');
        this.hideAllInputs();
        const urlInput = document.getElementById('productImageUrl');
        urlInput.classList.remove('hidden');
        urlInput.focus();
    }

    setActiveButton(activeId) {
        const buttons = document.querySelectorAll('.image-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        document.getElementById(activeId)?.classList.add('active');
    }

    hideAllInputs() {
        document.getElementById('cameraSection').classList.add('hidden');
        document.getElementById('productImageUrl').classList.add('hidden');
    }

    async startCamera() {
        try {
            // Check if camera is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera not supported on this device');
            }

            // Stop any existing stream
            this.stopCamera();

            // Get camera stream
            this.currentStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'environment' // Use back camera if available
                }
            });

            // Display camera feed
            const video = document.getElementById('cameraPreview');
            video.srcObject = this.currentStream;
            document.getElementById('cameraSection').classList.remove('hidden');

            console.log('Camera started successfully');
        } catch (error) {
            console.error('Error starting camera:', error);
            this.showNotification('Camera access denied or not available', 'error');
            
            // Fallback to file upload
            this.activateFileUpload();
        }
    }

    stopCamera() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
    }

    closeCamera() {
        this.stopCamera();
        this.hideAllInputs();
        this.setActiveButton('uploadBtn'); // Default to file upload
    }

    capturePhoto() {
        const video = document.getElementById('cameraPreview');
        const canvas = document.getElementById('imageCanvas');
        
        if (!video || !canvas) return;

        // Set canvas size to video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        // Convert to blob and process
        canvas.toBlob((blob) => {
            this.processImageBlob(blob);
            this.stopCamera();
            this.hideAllInputs();
        }, 'image/jpeg', this.imageQuality);
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            this.showNotification('Please select an image file', 'error');
            return;
        }

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.showNotification('Image file too large. Please choose a smaller image.', 'error');
            return;
        }

        this.processImageFile(file);
    }

    handleUrlInput(event) {
        const url = event.target.value.trim();
        if (!url) return;

        // Validate URL format
        try {
            new URL(url);
        } catch {
            this.showNotification('Please enter a valid URL', 'error');
            return;
        }

        // Test if URL points to an image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            this.selectedImageData = url;
            this.showImagePreview(url);
        };
        img.onerror = () => {
            this.showNotification('Unable to load image from URL', 'error');
        };
        img.src = url;
    }

    processImageFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const resizedImageData = this.resizeImage(img);
                this.selectedImageData = resizedImageData;
                this.showImagePreview(resizedImageData);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    processImageBlob(blob) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const resizedImageData = this.resizeImage(img);
                this.selectedImageData = resizedImageData;
                this.showImagePreview(resizedImageData);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(blob);
    }

    resizeImage(img) {
        const canvas = document.getElementById('imageCanvas');
        const ctx = canvas.getContext('2d');

        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        const maxSize = this.maxImageSize;

        if (width > height) {
            if (width > maxSize) {
                height = (height * maxSize) / width;
                width = maxSize;
            }
        } else {
            if (height > maxSize) {
                width = (width * maxSize) / height;
                height = maxSize;
            }
        }

        // Set canvas size and draw resized image
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 with compression
        return canvas.toDataURL('image/jpeg', this.imageQuality);
    }

    showImagePreview(imageSrc) {
        const preview = document.getElementById('imagePreview');
        const img = document.getElementById('previewImg');
        
        img.src = imageSrc;
        preview.classList.remove('hidden');
        
        this.showNotification('Image uploaded successfully!');
    }

    removeImage() {
        this.selectedImageData = null;
        document.getElementById('imagePreview').classList.add('hidden');
        document.getElementById('previewImg').src = '';
        
        // Reset file input
        document.getElementById('imageFileInput').value = '';
        document.getElementById('productImageUrl').value = '';
        
        // Clear active states
        document.querySelectorAll('.image-btn').forEach(btn => btn.classList.remove('active'));
        
        this.hideAllInputs();
        this.showNotification('Image removed');
    }

    getSelectedImage() {
        return this.selectedImageData;
    }

    clearSelection() {
        this.removeImage();
    }

    showNotification(message, type = 'success') {
        // Use the existing notification system from main.js
        if (window.store) {
            window.store.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    // Cleanup method
    destroy() {
        this.stopCamera();
    }
}

// Initialize image upload manager
window.imageUploadManager = new ImageUploadManager();

// Cleanup when page unloads
window.addEventListener('beforeunload', () => {
    if (window.imageUploadManager) {
        window.imageUploadManager.destroy();
    }
});