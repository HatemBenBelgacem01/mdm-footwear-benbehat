// Drag and Drop Initialisierung
const dropZone = document.getElementById('drop-zone');
const MAX_HISTORY = 8;
let analysisHistory = [];

if (dropZone) {
    ['dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, e => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    dropZone.addEventListener('dragover', () => dropZone.classList.add('drag-over'));
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => {
        dropZone.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            checkFiles(files);
        }
    });
}

function checkFiles(files) {
    if (!files || files.length !== 1) {
        alert("Bitte genau ein Bild hochladen.");
        return;
    }

    const fileSize = files[0].size / 1024 / 1024;
    if (fileSize > 10) {
        alert("Datei zu groß (max. 10MB)");
        return;
    }

    // UI-Elemente vorbereiten
    const answerPart = document.getElementById("answerPart");
    const loadingPart = document.getElementById("loadingPart");
    const resultsPart = document.getElementById("resultsPart");
    const preview = document.getElementById("preview");

    answerPart.classList.remove("d-none");
    loadingPart.classList.remove("d-none");
    resultsPart.classList.add("d-none");

    // Vorschau anzeigen und URL für Historie speichern
    const imageUrl = URL.createObjectURL(files[0]);
    preview.src = imageUrl;

    // Upload via API
    const formData = new FormData();
    formData.append("image", files[0]);

    fetch('/analyze', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(text => {
        try {
            const jsonData = JSON.parse(text);
            loadingPart.classList.add("d-none");
            resultsPart.classList.remove("d-none");
            
            displayResults(jsonData, imageUrl);
        } catch (e) {
            console.error("Fehler beim Parsen der JSON:", e);
            loadingPart.classList.add("d-none");
            alert("Fehler beim Verarbeiten der Antwort vom Server.");
        }
    })
    .catch(error => {
        console.error("Netzwerk- oder Upload-Fehler:", error);
        loadingPart.classList.add("d-none");
        alert("Fehler beim Hochladen des Bildes: " + error.message);
    });
}

function displayResults(jsonData, imageUrl) {
    let classifications = [];
    
    if (Array.isArray(jsonData)) {
        classifications = jsonData.map(item => ({
            className: item.className || item.class || item.name,
            probability: parseFloat(item.probability || 0)
        }));
    } else if (jsonData.classes && Array.isArray(jsonData.classes)) {
        classifications = jsonData.classes.map(item => ({
            className: item.className || item.class || item.name,
            probability: parseFloat(item.probability || 0)
        }));
    } else if (typeof jsonData === 'object') {
        for (const [key, value] of Object.entries(jsonData)) {
            if (key !== 'classes' && typeof value === 'number') {
                classifications.push({
                    className: key,
                    probability: parseFloat(value)
                });
            }
        }
    }

    classifications.sort((a, b) => b.probability - a.probability);

    // Top-Ergebnis anzeigen
    let topName = "Unbekannt";
    let topProb = "0%";
    
    if (classifications.length > 0) {
        const top = classifications[0];
        topName = top.className || "Unbekannt";
        topProb = (top.probability * 100).toFixed(1) + "%";
        document.getElementById("topLabel").textContent = topName;
        document.getElementById("topPercentage").textContent = topProb;
    }

    // Restliche Ergebnisse rendern
    const listContainer = document.getElementById("classificationList");
    let classificationHTML = "";
    
    classifications.slice(1, 5).forEach(item => {
        const prob = (item.probability * 100).toFixed(1);
        classificationHTML += `
            <div class="classification-item">
                <div class="label-container">
                    <span>${item.className || "Unbekannt"}</span>
                    <span class="text-muted">${prob}%</span>
                </div>
                <div class="progress">
                    <div class="progress-bar" style="width: ${prob}%"></div>
                </div>
            </div>
        `;
    });
    
    listContainer.innerHTML = classificationHTML;

    // Historie aktualisieren
    addToHistory(imageUrl, topName, topProb);
}

function addToHistory(imgSrc, label, probability) {
    analysisHistory.unshift({ imgSrc, label, probability });

    if (analysisHistory.length > MAX_HISTORY) {
        analysisHistory.pop();
    }

    renderHistory();
}

function renderHistory() {
    const historyContainer = document.getElementById('historyContainer');
    const historyGrid = document.getElementById('historyGrid');

    if (analysisHistory.length > 0) {
        historyContainer.classList.remove('d-none');
    }

    historyGrid.innerHTML = analysisHistory.map(item => `
        <div class="col-6 col-md-4 col-lg-3">
            <div class="history-card">
                <div class="history-img-wrapper">
                    <img src="${item.imgSrc}" alt="${item.label}" class="history-img">
                </div>
                <div class="history-info">
                    <div class="history-label">${item.label}</div>
                    <span class="badge rounded-pill bg-success" style="font-size: 0.75rem;">${item.probability}</span>
                </div>
            </div>
        </div>
    `).join('');
}