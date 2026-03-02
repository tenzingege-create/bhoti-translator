let selectedImageBase64 = null;
const DEBUG_MODE = true; // Use TRUE for testing without API errors

function switchMode(mode) {
    document.querySelectorAll('.mode-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    event.currentTarget.classList.add('active');
    
    if (mode === 'camera') {
        document.getElementById('camera-section').style.display = 'block';
        startCamera();
    } else if (mode === 'upload') {
        document.getElementById('upload-section').style.display = 'block';
    }
    
    // Reset inputs if needed
    selectedImageBase64 = null;
    document.getElementById('preview-img').style.display = 'none';
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
        selectedImageBase64 = reader.result;
        const preview = document.getElementById('preview-img');
        preview.src = selectedImageBase64;
        preview.style.display = 'block';
    };
    if (file) reader.readAsDataURL(file);
}

// ... include startCamera, takeSnapshot, and processTranslation from previous code ...