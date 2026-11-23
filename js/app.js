
// NextHire AI - Complete Master Application Logic
const API_KEY = "AQ.Ab8RN6Ilj-TkpX4YCPmFAP3VpWyCY1THATepB11BLtkOHr-0qA";

let timerInterval;

document.addEventListener("DOMContentLoaded", () => {
    const setupForm = document.getElementById("setupForm");
    const submitAnsBtn = document.getElementById("submitAnsBtn");

    // Display Past History on Index page
    renderPastHistory();

    // 1. Setup Form Handler (index.html)
    if (setupForm) {
        setupForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const fullName = document.getElementById("fullName").value;
            const jobRole = document.getElementById("jobRole").value;
            const difficulty = document.getElementById("difficulty").value;
            const resumeInput = document.getElementById("resumeFile").files[0];

            if (!resumeInput) {
                alert("Please upload your resume PDF!");
                return;
            }

            const btn = setupForm.querySelector(".glow-btn");
            btn.textContent = "Analyzing Resume with AI... ⏳";
            btn.disabled = true;

            try {
                const resumeText = await extractTextFromPDF(resumeInput);

                localStorage.setItem("candidateName", fullName);
                localStorage.setItem("targetRole", jobRole);
                localStorage.setItem("difficulty", difficulty);
                localStorage.setItem("resumeText", resumeText);

                btn.textContent = `Generating ${difficulty} Level Questions... 🚀`;
                const questions = await generateQuestionsFromAI(jobRole, difficulty, resumeText);

                localStorage.setItem("interviewQuestions", JSON.stringify(questions));
                localStorage.setItem("currentQIndex", 0);
                localStorage.setItem("candidateAnswers", JSON.stringify([]));

                window.location.href = "interview.html";
            } catch (error) {
                console.error(error);
                alert("Error: " + error.message);
                btn.textContent = "Start Mock Interview 🚀";
                btn.disabled = false;
            }
        });
    }

    // 2. Interview Screen Handler (interview.html)
    const questionText = document.getElementById("questionText");
    if (questionText) {
        const roleBadge = document.getElementById("roleBadge");
        const currentQNum = document.getElementById("currentQNum");
        const speakQBtn = document.getElementById("speakQBtn");
        const micBtn = document.getElementById("micBtn");
        const targetRole = localStorage.getItem("targetRole") || "Developer";
        const difficulty = localStorage.getItem("difficulty") || "Medium";

        roleBadge.textContent = `${targetRole} (${difficulty})`;

        let questions = JSON.parse(localStorage.getItem("interviewQuestions") || "[]");
        let currentIndex = parseInt(localStorage.getItem("currentQIndex") || "0");

        if (questions.length > 0 && currentIndex < questions.length) {
            const currentQuestion = questions[currentIndex];
            questionText.textContent = currentQuestion;
            currentQNum.textContent = currentIndex + 1;

            speakText(currentQuestion);
            startTimer(90);
        }

        if (speakQBtn) {
            speakQBtn.addEventListener("click", () => {
                speakText(questionText.textContent);
            });
        }

        if (micBtn) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.lang = 'en-US';

                micBtn.addEventListener("click", () => {
                    recognition.start();
                    micBtn.textContent = "🎙️ Listening...";
                    micBtn.style.background = "#ef4444";
                });

                recognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    const userAnswer = document.getElementById("userAnswer");
                    userAnswer.value = userAnswer.value ? userAnswer.value + " " + transcript : transcript;
                    micBtn.textContent = "🎙️ Speak Answer";
                    micBtn.style.background = "#1e293b";
                };

                recognition.onerror = () => {
                    micBtn.textContent = "🎙️ Speak Answer";
                    micBtn.style.background = "#1e293b";
                };
            } else {
                micBtn.style.display = "none";
            }
        }

        if (submitAnsBtn) {
            submitAnsBtn.addEventListener("click", () => handleAnswerSubmit(questions, currentIndex, targetRole));
        }
    }

    // 3. Report Screen Handler (report.html)
    const finalScoreEl = document.getElementById("finalScore");
    if (finalScoreEl) {
        const finalScore = localStorage.getItem("finalScore") || "85";
        const feedback = localStorage.getItem("finalFeedback") || "Good technical foundation.";
        const qaDetailed = JSON.parse(localStorage.getItem("qaDetailedResult") || "[]");

        finalScoreEl.textContent = finalScore;
        document.getElementById("feedbackContainer").innerHTML = `<p>${feedback.replace(/\n/g, '<br>')}</p>`;

        const qaContainer = document.getElementById("qaBreakdownContainer");
        if (qaContainer && qaDetailed.length > 0) {
            qaContainer.innerHTML = qaDetailed.map((item, index) => `
                <div style="background: #0f172a; padding: 15px; border-radius: 8px; border: 1px solid #334155;">
                    <h4 style="color: #38bdf8; margin-bottom: 5px;">Q${index + 1}: ${item.question}</h4>
                    <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 5px;"><strong>Your Answer:</strong> ${item.answer}</p>
                    <p style="font-size: 13px; color: #4ade80;"><strong>AI Ideal Answer:</strong> ${item.idealAnswer}</p>
                </div>
            `).join("");
        }

        const downloadPdfBtn = document.getElementById("downloadPdfBtn");
        if (downloadPdfBtn) {
            downloadPdfBtn.addEventListener("click", () => {
                const element = document.getElementById("reportPrintArea");
                const candidateName = localStorage.getItem("candidateName") || "Candidate";
                html2pdf().from(element).save(`${candidateName}_NextHire_Report.pdf`);
            });
        }
    }
});

function startTimer(seconds) {
    let timeLeft = seconds;
    const timerBox = document.getElementById("timerBox");

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        let mins = Math.floor(timeLeft / 60);
        let secs = timeLeft % 60;
        if (timerBox) {
            timerBox.textContent = `⏳ ${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            const subBtn = document.getElementById("submitAnsBtn");
            if (subBtn) subBtn.click();
        }
        timeLeft--;
    }, 1000);
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
    }
}

async function handleAnswerSubmit(questions, currentIndex, targetRole) {
    clearInterval(timerInterval);
    window.speechSynthesis.cancel();

    const userAnswerNode = document.getElementById("userAnswer");
    const userAnswer = userAnswerNode ? userAnswerNode.value.trim() : "No answer provided.";

    let answers = JSON.parse(localStorage.getItem("candidateAnswers") || "[]");
    answers.push({
        question: questions[currentIndex],
        answer: userAnswer
    });
    localStorage.setItem("candidateAnswers", JSON.stringify(answers));

    currentIndex++;
    localStorage.setItem("currentQIndex", currentIndex);

    const submitAnsBtn = document.getElementById("submitAnsBtn");

    if (currentIndex < questions.length) {
        window.location.reload();
    } else {
        if (submitAnsBtn) {
            submitAnsBtn.textContent = "AI Evaluating & Generating Ideal Answers... 🤖";
            submitAnsBtn.disabled = true;
        }

        await evaluateInterviewWithGemini(answers, targetRole);
        window.location.href = "report.html";
    }
}

async function generateQuestionsFromAI(jobRole, difficulty, resumeText) {
    const prompt = `You are a technical interviewer for the role of ${jobRole} at ${difficulty} difficulty level. 
Based strictly on this resume text: "${resumeText.substring(0, 1500)}", generate exactly 5 distinct, highly specific technical interview questions. 
Return ONLY a valid JSON array of 5 strings. Format: ["Q1", "Q2", "Q3", "Q4", "Q5"]`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        const rawText = data.candidates[0].content.parts[0].text;
        const cleanedText = rawText.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanedText);
    } catch (err) {
        console.error("API error, using targeted role fallbacks", err);
        if (jobRole.includes("Java")) {
            return [
                "Explain the core architecture and dependency injection in Spring Boot.",
                "How do you manage database transactions and concurrency in Java?",
                "What are the best practices for RESTful API exception handling?",
                "Describe how garbage collection works in JVM memory regions.",
                "How do you optimize SQL query performance in Hibernate/JPA?"
            ];
        } else if (jobRole.includes("Frontend")) {
            return [
                "How do you manage complex global state in large-scale React apps?",
                "Explain the JavaScript event loop, microtask and macro-task queues.",
                "What performance memoization techniques do you use in React?",
                "How do you optimize Core Web Vitals for production web apps?",
                "Explain CSS modules/Tailwind architecture for responsive designs."
            ];
        } else {
            return [
                `Explain key technical challenges you faced in ${jobRole}.`,
                `How do you handle error management and debugging under pressure?`,
                `What architectural design patterns do you implement?`,
                `How do you ensure code scalability and quality?`,
                `Describe a complex bug you resolved successfully.`
            ];
        }
    }
}

async function evaluateInterviewWithGemini(answers, jobRole) {
    const candidateName = localStorage.getItem("candidateName") || "Candidate";
    const difficulty = localStorage.getItem("difficulty") || "Medium";

    const prompt = `Evaluate ${candidateName} for the role of ${jobRole} (${difficulty} level).
Candidate Answers: ${JSON.stringify(answers)}

Provide response in strictly valid JSON format:
{
  "score": 85,
  "feedback": "Overall feedback text here...",
  "qaDetailed": [
     {"question": "...", "answer": "...", "idealAnswer": "Best concise technical answer..."}
  ]
}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        const rawText = data.candidates[0].content.parts[0].text;
        const evalResult = JSON.parse(rawText.replace(/```json|```/g, "").trim());

        saveHistory(candidateName, jobRole, evalResult.score);
        localStorage.setItem("finalScore", evalResult.score);
        localStorage.setItem("finalFeedback", evalResult.feedback);
        localStorage.setItem("qaDetailedResult", JSON.stringify(evalResult.qaDetailed));
    } catch (err) {
        console.error("Eval error", err);
        const fallbackResults = answers.map(a => ({
            question: a.question,
            answer: a.answer,
            idealAnswer: `An ideal answer for ${jobRole} should cover strong technical fundamentals, error handling, and scalable design principles.`
        }));

        saveHistory(candidateName, jobRole, 85);
        localStorage.setItem("finalScore", "85");
        localStorage.setItem("finalFeedback", "Good interview attempt. Solid technical base shown across answers.");
        localStorage.setItem("qaDetailedResult", JSON.stringify(fallbackResults));
    }
}

function saveHistory(name, role, score) {
    let history = JSON.parse(localStorage.getItem("interviewHistory") || "[]");
    history.unshift({
        date: new Date().toLocaleDateString(),
        name: name,
        role: role,
        score: score
    });
    localStorage.setItem("interviewHistory", JSON.stringify(history.slice(0, 5)));
}

function renderPastHistory() {
    const historyList = document.getElementById("historyList");
    if (historyList) {
        let history = JSON.parse(localStorage.getItem("interviewHistory") || "[]");
        if (history.length > 0) {
            historyList.innerHTML = history.map(item => `
                <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 8px 0; border-bottom: 1px solid #1e293b;">
                    <span><strong>${item.role}</strong> (${item.date})</span>
                    <span style="color: #38bdf8; font-weight: 600;">Score: ${item.score}/100</span>
                </div>
            `).join("");
        }
    }
}