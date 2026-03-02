const API_KEY = "YOUR_NEW_KEY_HERE";
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
        alert("Camera access denied or not available.");
        console.error(err);
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
    
    // Stop camera stream
    const stream = video.srcObject;
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    document.getElementById('cameraArea').style.display = 'none';
}

// --- TRANSLATION LOGIC ---
async function processTranslation() {
    const inputText = document.getElementById('inputText').value.trim();
    const source = document.getElementById('sourceLang').value;
    const target = document.getElementById('targetLang').value;
    const outputField = document.getElementById('outputText');
    const translateBtn = document.getElementById('translateBtn');

    if (!inputText && !selectedImageBase64) {
        alert("Please provide text or capture an image.");
        return;
    }

    outputField.value = "Processing translation...";
    translateBtn.disabled = true;

    try {
        let prompt = `You are a professional ${source} to ${target} translator. `;
        
        if (selectedImageBase64 && !inputText) {
            prompt += "Extract the text from this image and translate it. Provide ONLY the final translation.";
        } else if (selectedImageBase64 && inputText) {
            prompt += `The user provided this context: "${inputText}". Translate the text found in the image accordingly. Provide ONLY the translation.`;
        } else {
            prompt += `Translate the following: "${inputText}". Provide ONLY the translation.`;
        }

        const body = {
            contents: [{
                parts: [
                    { text: prompt },
                    ...(selectedImageBase64 ? [{ 
                        inline_data: { 
                            mime_type: "image/jpeg", 
                            data: selectedImageBase64.split(',')[1] 
                        } 
                    }] : [])
                ]
            }]
        };

        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }

        const result = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (result) {
            outputField.value = result.trim();
        } else {
            throw new Error("No translation returned. Try a clearer image.");
        }

    } catch (err) {
        outputField.value = "Error: " + err.message;
        console.error(err);
    } finally {
        translateBtn.disabled = false;
    }
}