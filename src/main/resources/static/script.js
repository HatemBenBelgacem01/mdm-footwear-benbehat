// Drag and Drop Initialisierung
const dropZone = document.getElementById('drop-zone');

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
        checkFiles(files);
    });
}

function checkFiles(files) {
    if (files.length !== 1) {
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

    // Vorschau anzeigen
    preview.src = URL.createObjectURL(files[0]);

    // Upload via API
    const formData = new FormData();
    formData.append("image", files[0]);

    fetch('/analyze', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(jsonData => {
        loadingPart.classList.add("d-none");
        resultsPart.classList.remove("d-none");
        displayResults(jsonData);
    })
    .catch(error => {
        console.error("Fehler:", error);
        loadingPart.classList.add("d-none");
        alert("Fehler beim Verarbeiten des Bildes.");
    });
}

function displayResults(jsonData) {
    let classifications = [];
    
    // Datenextraktion (Unterstützt verschiedene Formate)
    if (Array.isArray(jsonData)) {
        classifications = jsonData;
    } else if (jsonData.classes) {
        classifications = jsonData.classes;
    }

    // Sortierung nach Wahrscheinlichkeit
    classifications.sort((a, b) => b.probability - a.probability);

    if (classifications.length > 0) {
        const top = classifications[0];
        document.getElementById("topLabel").textContent = top.className || top.class;
        document.getElementById("topPercentage").textContent = (top.probability * 100).toFixed(1) + "%";
    }

    // Restliche Ergebnisse rendern
    const listContainer = document.getElementById("classificationList");
    listContainer.innerHTML = classifications.slice(1, 5).map(item => {
        const prob = (item.probability * 100).toFixed(1);
        return `
            <div class="classification-item">
                <div class="label-container">
                    <span>${item.className || item.class}</span>
                    <span class="text-muted">${prob}%</span>
                </div>
                <div class="progress">
                    <div class="progress-bar" style="width: ${prob}%"></div>
                </div>
            </div>
        `;
    }).join('');
}