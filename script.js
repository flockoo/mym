// FICHIER: script.js
// Configuration - METS ICI LE CHEMIN DE TA PHOTO !
const MY_PHOTO_URL = "moi.jpg";  // <--- TA PHOTO ICI
const GRID_SIZE = 4;  // 4x4 grid
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE; 
const CORRECT_POSITIONS = [5, 6, 9, 10];  


// ---------- CANVAS BACKGROUND (inchangé) ----------
const canvas = document.getElementById("bgCanvas");
const ctx = canvas.getContext("2d");
let width, height;
let particles = [];
let mouseX = 0, mouseY = 0;
let time = 0;

function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener("resize", () => {
    resizeCanvas();
    initParticles();
});

function initParticles() {
    particles = [];
    const particleCount = Math.min(130, Math.floor(width * height / 7500));
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 2 + 1,
            alpha: Math.random() * 0.5 + 0.2,
            speedX: (Math.random() - 0.5) * 0.25,
            speedY: (Math.random() - 0.5) * 0.2,
            colorHue: Math.random() * 60 + 140,
        });
    }
}

function drawBackground() {
    if (!ctx) return;
    ctx.fillStyle = "#03060b";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#00ffaa20";
    ctx.lineWidth = 0.5;
    const step = 48;
    for (let i = 0; i < width + step; i += step) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i % height);
        ctx.lineTo(width, i % height);
        ctx.stroke();
    }
    for (let p of particles) {
        p.x += p.speedX + (mouseX - width/2) * 0.0006;
        p.y += p.speedY + (mouseY - height/2) * 0.0005;
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.colorHue + time * 0.5}, 80%, 65%, ${p.alpha * 0.7})`;
        ctx.fill();
    }
    for (let i = 0; i < 14; i++) {
        let angle = Date.now() * 0.007 + i;
        let rad = 20 + Math.sin(angle) * 7;
        let x = mouseX + Math.cos(angle + time * 0.02) * rad;
        let y = mouseY + Math.sin(angle * 1.2 + time * 0.02) * rad;
        ctx.beginPath();
        ctx.arc(x, y, 1.3, 0, Math.PI*2);
        ctx.fillStyle = `rgba(80, 255, 180, 0.5)`;
        ctx.fill();
    }
    time++;
    requestAnimationFrame(drawBackground);
}

function updateMouse(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
}
window.addEventListener("mousemove", updateMouse);
resizeCanvas();
initParticles();
drawBackground();

// ---------- LOGIQUE PRINCIPALE ----------
const step1Div = document.getElementById("step1");
const step2Div = document.getElementById("step2");
const step3Div = document.getElementById("step3");
const kaptchaInput = document.getElementById("kaptchaInput");
const errorMsgSpan = document.getElementById("errorMsg");
const resetBtn = document.getElementById("resetBtn");

// reCAPTCHA
const recaptchaBox = document.getElementById("recaptchaBox");
const checkIcon = document.getElementById("recaptchaCheckIcon");
const verifyMsgSpan = document.getElementById("recaptchaVerifyMsg");
let isRecaptchaChecked = false;
let waitingForValidation = false;

// Grille étape 2 (photo découpée)
const imageGrid = document.getElementById("imageGrid");
const verifyGridBtn = document.getElementById("verifyGridBtn");
const gridError = document.getElementById("gridError");
let selectedCells = new Set();
let gridItems = [];

// Fonction pour charger une image et la découper en grille
function loadAndSplitImage() {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous"; // pour éviter les problèmes CORS avec certaines images
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Impossible de charger l'image"));
        img.src = MY_PHOTO_URL;
    });
}

// Découpe l'image et crée les cellules de la grille
async function generateGridFromPhoto() {
    imageGrid.innerHTML = "";
    selectedCells.clear();
    gridItems = [];
    
    // Style dynamique pour la grille
    imageGrid.style.display = "grid";
    imageGrid.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
    imageGrid.style.gap = "8px";
    imageGrid.style.margin = "20px 0";
    
    try {
        const img = await loadAndSplitImage();
        const cellWidth = img.width / GRID_SIZE;
        const cellHeight = img.height / GRID_SIZE;
        
        // Créer un canvas temporaire pour découper
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const index = row * GRID_SIZE + col;
                const isCorrect = CORRECT_POSITIONS.includes(index);
                
                // Découper le morceau
                tempCanvas.width = cellWidth;
                tempCanvas.height = cellHeight;
                tempCtx.drawImage(
                    img,
                    col * cellWidth, row * cellHeight, cellWidth, cellHeight,
                    0, 0, cellWidth, cellHeight
                );
                
                // Créer l'élément de la grille
                const cellDiv = document.createElement("div");
                cellDiv.className = "grid-item";
                cellDiv.dataset.index = index;
                
                const cellImg = document.createElement("img");
                cellImg.src = tempCanvas.toDataURL();
                cellImg.alt = isCorrect ? "Moi" : "Autre";
                
                cellDiv.appendChild(cellImg);
                cellDiv.addEventListener("click", () => toggleSelect(index, cellDiv));
                imageGrid.appendChild(cellDiv);
                gridItems.push(cellDiv);
            }
        }
    } catch (error) {
        console.error("Erreur de chargement de l'image:", error);
        // Fallback: générer des carrés colorés avec message d'erreur
        for (let i = 0; i < TOTAL_CELLS; i++) {
            const isCorrect = CORRECT_POSITIONS.includes(i);
            const cellDiv = document.createElement("div");
            cellDiv.className = "grid-item";
            cellDiv.dataset.index = i;
            cellDiv.style.background = isCorrect ? "#2a5f4a" : "#1a1f2a";
            cellDiv.style.display = "flex";
            cellDiv.style.alignItems = "center";
            cellDiv.style.justifyContent = "center";
            cellDiv.style.color = "#8effd4";
            cellDiv.style.fontSize = "12px";
            cellDiv.innerText = isCorrect ? "📷" : "?";
            cellDiv.addEventListener("click", () => toggleSelect(i, cellDiv));
            imageGrid.appendChild(cellDiv);
            gridItems.push(cellDiv);
        }
        gridError.innerText = "⚠️ Photo non trouvée - Utilisation d'un aperçu temporaire. Placez votre photo dans assets/moi.jpg";
    }
}

function toggleSelect(index, element) {
    if (selectedCells.has(index)) {
        selectedCells.delete(index);
        element.classList.remove("selected");
    } else {
        selectedCells.add(index);
        element.classList.add("selected");
    }
}

// Vérification étape 2
function verifyGridSelection() {
    const selectedArray = Array.from(selectedCells).sort((a,b)=>a-b);
    const expected = [...CORRECT_POSITIONS].sort((a,b)=>a-b);
    
    if (selectedArray.length !== expected.length || !selectedArray.every((val, idx) => val === expected[idx])) {
        gridError.innerText = `❌ Sélection incorrecte ! Vous devez choisir les ${expected.length} carré(s) où APPARAÎT MON VISAGE.`;
        return false;
    }
    gridError.innerText = "✓ Parfait ! Humanité confirmée !";
    return true;
}

// Passage étape 2 -> étape 3
function goToStep3() {
    step2Div.classList.add("hidden");
    step3Div.classList.remove("hidden");
    updateDots(3);
    const welcomeSpan = document.getElementById("welcomeText");
    if (welcomeSpan) welcomeSpan.innerHTML = "Bienvenue, Florent ✨";
    const humanIconSpan = document.getElementById("humanIcon");
    if (humanIconSpan) humanIconSpan.innerHTML = "🧠💚🫀";
}

// ÉTAPE 1 : validation combinée
function attemptGlobalValidation() {
    const userInput = kaptchaInput.value.trim();
    const isFlorentOk = (userInput.toLowerCase() === "florent");
    
    if (!isFlorentOk && isRecaptchaChecked) {
        errorMsgSpan.innerText = "❌ Le mot 'Florent' est incorrect.";
        return false;
    }
    if (isFlorentOk && !isRecaptchaChecked) {
        errorMsgSpan.innerText = "❌ Vous devez cocher « I'm not a robot ».";
        return false;
    }
    if (!isFlorentOk && !isRecaptchaChecked) {
        errorMsgSpan.innerText = "❌ Écrivez 'Florent' et cochez la case.";
        return false;
    }
    
    errorMsgSpan.innerText = "";
    waitingForValidation = true;
    recaptchaBox.style.pointerEvents = "none";
    recaptchaBox.style.opacity = "0.9";
    verifyMsgSpan.innerHTML = "✓ humanité confirmée, passage à l'épreuve photo...";
    
    setTimeout(() => {
        step1Div.classList.add("hidden");
        step2Div.classList.remove("hidden");
        updateDots(2);
        generateGridFromPhoto(); // génère la grille découpée
    }, 600);
    return true;
}

// Écoute des changements
function checkBothConditions() {
    if (waitingForValidation) return;
    const inputVal = kaptchaInput.value.trim();
    const inputOk = (inputVal.toLowerCase() === "florent");
    if (inputOk && isRecaptchaChecked) {
        attemptGlobalValidation();
    } else {
        if (inputOk && !isRecaptchaChecked) {
            errorMsgSpan.innerText = "✔ Bon mot ! Cochez maintenant 'I'm not a robot'.";
        } else if (!inputOk && isRecaptchaChecked) {
            errorMsgSpan.innerText = "✔ Case validée, mais écrivez exactement 'Florent'.";
        } else {
            if (!waitingForValidation) errorMsgSpan.innerText = "";
        }
    }
}

// UI checkbox
function updateCheckboxUI() {
    if (isRecaptchaChecked) {
        checkIcon.innerHTML = "✓";
        checkIcon.style.background = "#2effb0";
        checkIcon.style.color = "#0a2b1f";
        recaptchaBox.classList.add("checked");
        verifyMsgSpan.innerHTML = "✔ vérification humaine effectuée";
    } else {
        checkIcon.innerHTML = "☐";
        checkIcon.style.background = "#0f1a1c";
        checkIcon.style.color = "#5fcfb0";
        recaptchaBox.classList.remove("checked");
        verifyMsgSpan.innerHTML = "";
    }
}

recaptchaBox.addEventListener("click", (e) => {
    e.stopPropagation();
    if (waitingForValidation) return;
    isRecaptchaChecked = !isRecaptchaChecked;
    updateCheckboxUI();
    if (isRecaptchaChecked) {
        verifyMsgSpan.innerHTML = "vérification en cours... <span class='loading-spinner-small'></span>";
        setTimeout(() => {
            if (isRecaptchaChecked) {
                verifyMsgSpan.innerHTML = "✔ vérification humaine effectuée";
                attemptGlobalValidation();
            }
        }, 400);
    } else {
        verifyMsgSpan.innerHTML = "";
        errorMsgSpan.innerText = "";
    }
});

kaptchaInput.addEventListener("input", () => {
    if (waitingForValidation) return;
    checkBothConditions();
});

verifyGridBtn.addEventListener("click", () => {
    if (verifyGridSelection()) {
        goToStep3();
    }
});

// Dots progression
function updateDots(step) {
    const dotsStep1 = step1Div.querySelectorAll(".progress-dots .dot");
    const dotsStep2 = step2Div.querySelectorAll(".progress-dots .dot");
    const dotsStep3 = step3Div.querySelectorAll(".progress-dots .dot");
    function setActive(dots, idx) {
        dots.forEach((dot, i) => {
            if (i === idx) dot.classList.add("active");
            else dot.classList.remove("active");
        });
    }
    if (step === 1) {
        setActive(dotsStep1, 0); setActive(dotsStep2, 0); setActive(dotsStep3, 0);
    } else if (step === 2) {
        setActive(dotsStep1, 1); setActive(dotsStep2, 1); setActive(dotsStep3, 1);
    } else if (step === 3) {
        setActive(dotsStep1, 2); setActive(dotsStep2, 2); setActive(dotsStep3, 2);
    }
}

// Reset global
function fullReset() {
    waitingForValidation = false;
    isRecaptchaChecked = false;
    updateCheckboxUI();
    recaptchaBox.style.pointerEvents = "auto";
    recaptchaBox.style.opacity = "1";
    kaptchaInput.value = "";
    errorMsgSpan.innerText = "";
    verifyMsgSpan.innerHTML = "";
    selectedCells.clear();
    step1Div.classList.remove("hidden");
    step2Div.classList.add("hidden");
    step3Div.classList.add("hidden");
    updateDots(1);
    kaptchaInput.focus();
    gridError.innerText = "";
}

resetBtn.addEventListener("click", fullReset);

// Initialisation
updateCheckboxUI();
updateDots(1);
kaptchaInput.focus();
