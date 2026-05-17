// FICHIER: script.js 
// Configuration
const MY_PHOTO_URL = "moi.jpg";
const GRID_SIZE = 4;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;
const CORRECT_POSITIONS = [6, 7, 9, 10, 11, 13, 14, 15];

// ---------- CANVAS BACKGROUND ----------
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

// Animation du Kaptcha "wiggle"
const kaptchaValueElement = document.getElementById("kaptchaValue");
let kaptchaAnimationInterval = null;

function startKaptchaWiggle() {
    if (kaptchaAnimationInterval) clearInterval(kaptchaAnimationInterval);
    
    kaptchaAnimationInterval = setInterval(() => {
        if (!step1Div.classList.contains("hidden") && kaptchaValueElement) {
            // Effet de déformation aléatoire
            const skewX = (Math.sin(Date.now() * 0.008) * 3).toFixed(1);
            const skewY = (Math.cos(Date.now() * 0.007) * 2).toFixed(1);
            const rotate = (Math.sin(Date.now() * 0.01) * 1.5).toFixed(1);
            const translateX = (Math.sin(Date.now() * 0.015) * 2).toFixed(1);
            const translateY = (Math.cos(Date.now() * 0.012) * 1.5).toFixed(1);
            
            kaptavaValueElement.style.transform = `skew(${skewX}deg, ${skewY}deg) rotate(${rotate}deg) translate(${translateX}px, ${translateY}px)`;
            
            // Légère variation de couleur
            const hue = 55 + Math.sin(Date.now() * 0.01) * 10;
            kaptchaValueElement.style.textShadow = `0 0 3px hsl(${hue}, 100%, 60%)`;
            kaptchaValueElement.style.color = `hsl(${hue}, 80%, 65%)`;
        }
    }, 100);
}

// Arrêter l'animation quand on quitte l'étape 1
function stopKaptchaWiggle() {
    if (kaptchaAnimationInterval) {
        clearInterval(kaptchaAnimationInterval);
        kaptchaAnimationInterval = null;
    }
    if (kaptchaValueElement) {
        kaptchaValueElement.style.transform = "";
        kaptchaValueElement.style.textShadow = "";
        kaptchaValueElement.style.color = "";
    }
}

// Grille étape 2
const imageGrid = document.getElementById("imageGrid");
const verifyGridBtn = document.getElementById("verifyGridBtn");
const gridError = document.getElementById("gridError");
let selectedCells = new Set();
let gridItems = [];

function updateGridPrompt() {
    const promptDiv = document.querySelector(".grid-prompt p");
    if (promptDiv) {
        promptDiv.innerHTML = `Sélectionnez tous les carrés où <strong style="color:#8effd4;">apparaît MA PHOTO</strong> <span style="font-size:0.7rem;">(${CORRECT_POSITIONS.length} case(s) à sélectionner)</span>`;
    }
}

function loadImage() {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Impossible de charger l'image: " + MY_PHOTO_URL));
        img.src = MY_PHOTO_URL;
    });
}

async function generateGridFromPhoto() {
    imageGrid.innerHTML = "";
    selectedCells.clear();
    gridItems = [];
    
    imageGrid.style.display = "grid";
    imageGrid.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
    imageGrid.style.gap = "4px";
    imageGrid.style.margin = "20px auto";
    imageGrid.style.maxWidth = "450px";
    imageGrid.style.aspectRatio = "1 / 1";
    
    try {
        const img = await loadImage();
        const imgSize = Math.min(img.width, img.height);
        const cropX = (img.width - imgSize) / 2;
        const cropY = (img.height - imgSize) / 2;
        const cellSize = imgSize / GRID_SIZE;
        
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const index = row * GRID_SIZE + col;
                const isCorrect = CORRECT_POSITIONS.includes(index);
                
                tempCanvas.width = cellSize;
                tempCanvas.height = cellSize;
                tempCtx.drawImage(
                    img,
                    cropX + col * cellSize, cropY + row * cellSize, cellSize, cellSize,
                    0, 0, cellSize, cellSize
                );
                
                const cellDiv = document.createElement("div");
                cellDiv.className = "grid-item";
                cellDiv.dataset.index = index;
                cellDiv.style.aspectRatio = "1 / 1";
                cellDiv.style.cursor = "pointer";
                cellDiv.style.borderRadius = "8px";
                cellDiv.style.overflow = "hidden";
                
                const cellImg = document.createElement("img");
                cellImg.src = tempCanvas.toDataURL();
                cellImg.alt = isCorrect ? "Moi" : "Autre";
                cellImg.style.width = "100%";
                cellImg.style.height = "100%";
                cellImg.style.objectFit = "cover";
                
                cellDiv.appendChild(cellImg);
                cellDiv.addEventListener("click", () => toggleSelect(index, cellDiv));
                imageGrid.appendChild(cellDiv);
                gridItems.push(cellDiv);
            }
        }
        updateGridPrompt();
    } catch (error) {
        console.error("Erreur:", error);
        for (let i = 0; i < TOTAL_CELLS; i++) {
            const isCorrect = CORRECT_POSITIONS.includes(i);
            const cellDiv = document.createElement("div");
            cellDiv.className = "grid-item";
            cellDiv.dataset.index = i;
            cellDiv.style.background = isCorrect ? "#2a5f4a" : "#1a1f2a";
            cellDiv.style.aspectRatio = "1 / 1";
            cellDiv.style.display = "flex";
            cellDiv.style.alignItems = "center";
            cellDiv.style.justifyContent = "center";
            cellDiv.style.color = "#8effd4";
            cellDiv.style.fontSize = "14px";
            cellDiv.style.borderRadius = "8px";
            cellDiv.innerText = isCorrect ? "📷" : "?";
            cellDiv.addEventListener("click", () => toggleSelect(i, cellDiv));
            imageGrid.appendChild(cellDiv);
            gridItems.push(cellDiv);
        }
        gridError.innerText = "⚠️ Photo 'moi.jpg' introuvable. Placez-la à la racine.";
        updateGridPrompt();
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
    gridError.innerText = "";
}

function verifyGridSelection() {
    const selectedArray = Array.from(selectedCells).sort((a,b)=>a-b);
    const expected = [...CORRECT_POSITIONS].sort((a,b)=>a-b);
    
    if (selectedArray.length !== expected.length) {
        gridError.innerText = `❌ Sélection incorrecte ! ${selectedArray.length}/${expected.length} cases.`;
        return false;
    }
    
    if (!selectedArray.every((val, idx) => val === expected[idx])) {
        gridError.innerText = `❌ Mauvaises cases. Sélectionnez celles où APPARAÎT MA PHOTO.`;
        return false;
    }
    
    gridError.innerText = "✓ Parfait ! Humanité confirmée !";
    return true;
}

function goToStep3() {
    step2Div.classList.add("hidden");
    step3Div.classList.remove("hidden");
    updateDots(3);
    const welcomeSpan = document.getElementById("welcomeText");
    if (welcomeSpan) welcomeSpan.innerHTML = "Bienvenue, Florent ✨";
    const humanIconSpan = document.getElementById("humanIcon");
    if (humanIconSpan) humanIconSpan.innerHTML = "🧠💚🫀";
}

function attemptGlobalValidation() {
    const userInput = kaptchaInput.value.trim();
    const isFlorentOk = (userInput.toLowerCase() === "florent");
    
    if (!isFlorentOk && isRecaptchaChecked) {
        errorMsgSpan.innerText = "❌ Le code visuel est incorrect.";
        return false;
    }
    if (isFlorentOk && !isRecaptchaChecked) {
        errorMsgSpan.innerText = "❌ Cochez « I'm not a robot ».";
        return false;
    }
    if (!isFlorentOk && !isRecaptchaChecked) {
        errorMsgSpan.innerText = "❌ Recopiez le code ci-dessus et cochez la case.";
        return false;
    }
    
    errorMsgSpan.innerText = "";
    waitingForValidation = true;
    recaptchaBox.style.pointerEvents = "none";
    recaptchaBox.style.opacity = "0.9";
    verifyMsgSpan.innerHTML = "✓ Vérifié, passage à l'épreuve photo...";
    
    setTimeout(() => {
        stopKaptchaWiggle();
        step1Div.classList.add("hidden");
        step2Div.classList.remove("hidden");
        updateDots(2);
        generateGridFromPhoto();
    }, 600);
    return true;
}

function checkBothConditions() {
    if (waitingForValidation) return;
    const inputVal = kaptchaInput.value.trim();
    const inputOk = (inputVal.toLowerCase() === "florent");
    if (inputOk && isRecaptchaChecked) {
        attemptGlobalValidation();
    } else {
        if (inputOk && !isRecaptchaChecked) {
            errorMsgSpan.innerText = "✔ Code correct ! Cochez la case.";
        } else if (!inputOk && isRecaptchaChecked) {
            errorMsgSpan.innerText = "✔ Case cochée, mais recopiez exactement 'FLORENT'.";
        } else {
            if (!waitingForValidation) errorMsgSpan.innerText = "";
        }
    }
}

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
        verifyMsgSpan.innerHTML = "vérification... <span class='loading-spinner-small'></span>";
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
    startKaptchaWiggle();
}

resetBtn.addEventListener("click", fullReset);

// Démarrer l'animation du Kaptcha au chargement
startKaptchaWiggle();
updateCheckboxUI();
updateDots(1);
kaptchaInput.focus();
