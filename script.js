// --- CONFIGURATION ---
const DEBUG_MODE = true; // Set to FALSE when you have a working API Key
const API_KEY = "YOUR_API_KEY_HERE"; 
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

let selectedImageBase64 = null;

// --- CAMERA LOGIC ---
async function startCamera() {
    const cameraArea = document.getElementById('cameraArea');
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" } 
        });
        cameraArea.style.display = 'block';
        document.getElementById('video').srcObject = stream;
    } catch (err) {
        alert("Camera error: " + err.message);
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
    
    // Stop camera
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
    document.getElementById('cameraArea').style.display = 'none';
}

// --- TRANSLATION LOGIC ---
async function processTranslation() {
    const inputText = document.getElementById('inputText').value.trim();
    const target = document.getElementById('targetLang').value;
    const outputField = document.getElementById('outputText');
    const translateBtn = document.getElementById('translateBtn');

    if (!inputText && !selectedImageBase64) {
        alert("Please enter text or take a photo.");
        return;
    }

    outputField.value = DEBUG_MODE ? "DEBUG: Simulating AI..." : "Translating...";
    translateBtn.disabled = true;

    if (DEBUG_MODE) {
        // --- TEST MODE (No API Key) ---
        setTimeout(() => {
            const testResult = target === "Tibetan" 
                ? "བཀྲ་ཤིས་བདེ་ལེགས་ (Test: Tashi Delek)" 
                : "Hello, how are you? (Test Translation)";
            outputField.value = testResult;
            translateBtn.disabled = false;
        }, 1000);
        return;
    }

    // --- REAL AI MODE (Requires API Key) ---
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
        outputField.value = data.candidates?.[0]?.content?.parts?.[0]?.text || "Error: No response.";
    } catch (err) {
        outputField.value = "API Error: " + err.message;
    } finally {
        translateBtn.disabled = false;
    }
}