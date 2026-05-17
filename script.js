// FICHIER: script.js
// Configuration: remplacez cette image par le chemin VOTRE PHOTO
const MY_PHOTO_URL = "moi.jpg";  // <--- METS ICI LE CHEMIN DE TA PHOTO !
// Si tu n'as pas encore l'image, utilise une image placeholder temporaire:


// Position des images contenant ma photo dans la grille 3x3 (0 à 8)

const CORRECT_POSITIONS = [0,1,2];

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

// Grille étape 2
const imageGrid = document.getElementById("imageGrid");
const verifyGridBtn = document.getElementById("verifyGridBtn");
const gridError = document.getElementById("gridError");
let selectedCells = new Set(); // stocke les indices sélectionnés
let gridItems = [];

// Génération des images pour la grille 3x3
function generateGridImages() {
    imageGrid.innerHTML = "";
    selectedCells.clear();
    gridItems = [];
    // 9 images: certaines sont MOI, d'autres sont des images randoms (sujets divers)
    for (let i = 0; i < 9; i++) {
        const isMe = CORRECT_POSITIONS.includes(i);
        const imgUrl = isMe ? MY_PHOTO_URL : `https://picsum.photos/id/${100 + i * 7}/200/200?random=${i}`;
        const div = document.createElement("div");
        div.className = "grid-item";
        div.dataset.index = i;
        const img = document.createElement("img");
        img.src = imgUrl;
        img.alt = isMe ? "Moi" : "Autre";
        // Gestion erreur de chargement image perso
        if (isMe) {
            img.onerror = () => {
                img.src = "https://picsum.photos/id/42/200/200"; // fallback
                console.warn("Photo non trouvée, remplacement par image aléatoire");
            };
        }
        div.appendChild(img);
        div.addEventListener("click", () => toggleSelect(i, div));
        imageGrid.appendChild(div);
        gridItems.push(div);
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
        gridError.innerText = "❌ Sélection incorrecte ! Vous devez choisir TOUS les carrés où apparaît MA PHOTO.";
        return false;
    }
    gridError.innerText = "";
    return true;
}

// Passage étape 2 -> étape 3 (succès)
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
        generateGridImages(); // génère la grille dynamique
    }, 600);
    return true;
}

// Écoute des changements + checkbox
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
                attemptGlobalValidation(); // retente validation globale
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

// Init
updateCheckboxUI();
updateDots(1);
kaptchaInput.focus();
