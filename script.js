// --- CONFIG ---
const DEBUG_MODE = true; // Set to FALSE when using a real API key
const API_KEY = "YOUR_API_KEY_HERE";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

let selectedImageBase64 = null;

// --- NAVIGATION ---
function switchMode(event, mode) {
    // Hide all mode sections
    document.querySelectorAll('.mode-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // Reset image preview when switching
    selectedImageBase64 = null;
    document.getElementById('preview-img').style.display = 'none';

    // Highlight current tab
    event.currentTarget.classList.add('active');

    if (mode === 'camera') {
        document.getElementById('camera-section').style.display = 'block';
        startCamera();
    } else if (mode === 'upload') {
        document.getElementById('upload-section').style.display = 'block';
    }
}

// --- CAMERA & UPLOAD ---
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        document.getElementById('video').srcObject = stream;
    } catch (err) {
        alert("Camera access denied.");
    }
}

function takeSnapshot() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const preview = document.getElementById('preview-img');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    selectedImageBase64 = canvas.toDataURL('image/jpeg');
    preview.src = selectedImageBase64;
    preview.style.display = 'block';
    
    // Stop camera to save battery
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
    document.getElementById('camera-section').style.display = 'none';
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
        selectedImageBase64 = reader.result;
        const preview = document.getElementById('preview-img');
        preview.src = selectedImageBase64;
        preview.style.display = 'block';
        document.getElementById('upload-section').style.display = 'none';
    };
    if (file) reader.readAsDataURL(file);
}

// --- TRANSLATION CORE ---
async function processTranslation() {
    const inputText = document.getElementById('inputText').value.trim();
    const target = document.getElementById('targetLang').value;
    const outputField = document.getElementById('outputText');
    const translateBtn = document.getElementById('translateBtn');

    if (!inputText && !selectedImageBase64) {
        alert("Please enter text or provide an image.");
        return;
    }

    outputField.value = "Processing...";
    translateBtn.disabled = true;

    if (DEBUG_MODE) {
        setTimeout(() => {
            outputField.value = (target === "Tibetan") ? "བཀྲ་ཤིས་བདེ་ལེགས་ (Test: Tashi Delek)" : "Hello! (Test Result)";
            translateBtn.disabled = false;
        }, 1000);
        return;
    }

    try {
        const prompt = `Translate to ${target}. Return ONLY the translation. Text: ${inputText}`;
        const body = {
            contents: [{
                parts: [
                    { text: prompt },
                    ...(selectedImageBase64 ? [{ inline_data: { mime_type: "image/jpeg", data: selectedImageBase64.split(',')[1] } }] : [])
                ]
            }]
        };

        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        outputField.value = data.candidates?.[0]?.content?.parts?.[0]?.text || "No results found.";
    } catch (err) {
        outputField.value = "Error: " + err.message;
    } finally {
        translateBtn.disabled = false;
    }
}

function copyResult() {
    const text = document.getElementById('outputText').value;
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
}