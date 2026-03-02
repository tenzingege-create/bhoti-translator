// --- CONFIGURATION ---
const DEBUG_MODE = true; // SET TO FALSE TO USE REAL API
const API_KEY = "YOUR_API_KEY_HERE";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

let selectedImageBase64 = null;
let stream = null;

// --- NAVIGATION LOGIC ---
function switchMode(event, mode) {
    // 1. Hide all mode contents
    document.querySelectorAll('.mode-content').forEach(el => el.style.display = 'none');
    
    // 2. Remove active class from buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // 3. Highlight clicked tab
    event.currentTarget.classList.add('active');

    // 4. Stop camera if it's running
    stopCamera();

    // 5. Show correct section
    if (mode === 'camera') {
        document.getElementById('camera-section').style.display = 'block';
        startCamera();
    } else if (mode === 'upload') {
        document.getElementById('upload-section').style.display = 'block';
    }
}

// --- CAMERA FUNCTIONS ---
async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        document.getElementById('video').srcObject = stream;
    } catch (err) {
        alert("Camera access denied or unavailable.");
    }
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

function takeSnapshot() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const preview = document.getElementById('preview-img');
    const clearBtn = document.getElementById('clear-img');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    selectedImageBase64 = canvas.toDataURL('image/jpeg');
    preview.src = selectedImageBase64;
    preview.style.display = 'block';
    clearBtn.style.display = 'block';
    
    stopCamera();
    document.getElementById('camera-section').style.display = 'none';
}

// --- FILE UPLOAD ---
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
        selectedImageBase64 = reader.result;
        const preview = document.getElementById('preview-img');
        preview.src = selectedImageBase64;
        preview.style.display = 'block';
        document.getElementById('clear-img').style.display = 'block';
        document.getElementById('upload-section').style.display = 'none';
    };
    reader.readAsDataURL(file);
}

function clearImage() {
    selectedImageBase64 = null;
    document.getElementById('preview-img').style.display = 'none';
    document.getElementById('clear-img').style.display = 'none';
}

// --- API / TRANSLATION LOGIC ---
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
            outputField.value = (target === "Tibetan") 
                ? "བཀྲ་ཤིས་བདེ་ལེགས་ (Test Success)" 
                : "Hello World! (Test Success)";
            translateBtn.disabled = false;
        }, 800);
        return;
    }

    try {
        const prompt = `Translate to ${target}. Return ONLY translation. Context: ${inputText}`;
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
        outputField.value = data.candidates?.[0]?.content?.parts?.[0]?.text || "No result.";
    } catch (err) {
        outputField.value = "Error: " + err.message;
    } finally {
        translateBtn.disabled = false;
    }
}

function copyResult() {
    const text = document.getElementById('outputText').value;
    if (!text) return;
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
}