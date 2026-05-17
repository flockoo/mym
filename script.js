// NOUVELLE ÉTAPE 3 : ZGEG CONFIRMÉ + REDIRECTION INSTA (version clean)
function goToStep3() {
    step2Div.classList.add("hidden");
    step3Div.classList.remove("hidden");
    updateDots(3);
    
    // On vide l'ancien contenu et on met uniquement le gros ZGEG CONFIRMÉ
    const finalMessage = document.querySelector("#step3 .final-message");
    if (finalMessage) {
        finalMessage.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 4rem; font-weight: bold; letter-spacing: 8px; color: #2effb0; text-shadow: 0 0 20px #00ffaa; animation: pulse 0.5s infinite alternate;">
                    ZGEG
                </div>
                <div style="font-size: 3rem; font-weight: bold; letter-spacing: 4px; color: #2effb0; text-shadow: 0 0 15px #00ffaa; margin-top: 10px;">
                    CONFIRMÉ
                </div>
                <div style="margin-top: 30px; font-size: 0.7rem; color: #88ffcc;">
                    Redirection vers Instagram dans <span id="countdown">3</span> secondes...
                </div>
            </div>
        `;
    }
    
    // Animation pulse
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); text-shadow: 0 0 20px #00ffaa; }
            100% { transform: scale(1.05); text-shadow: 0 0 40px #2effb0; }
        }
    `;
    document.head.appendChild(style);
    
    // Compte à rebours et redirection
    let seconds = 3;
    const countdownElement = document.getElementById("countdown");
    
    const interval = setInterval(() => {
        seconds--;
        if (countdownElement) countdownElement.innerText = seconds;
        if (seconds <= 0) {
            clearInterval(interval);
            window.location.href = "https://www.instagram.com/florent_brds/";
        }
    }, 1000);
}
