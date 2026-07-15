// Exam engine for the 140-question randomized exam.
// Expects a global `FULL_BANK` array (from data/exam-data.js).

const EXAM_SIZE = 140;

let examQuestions = [];
let answers = {};
let currentIndex = 0;
let phase = 'exam'; // 'exam' | 'review'
let prevExamNums = null;

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildExam() {
  let picked;
  for (let tries = 0; tries < 200; tries++) {
    const shuffledBank = shuffle(FULL_BANK);
    picked = shuffledBank.slice(0, EXAM_SIZE);
    const candidateNums = new Set(picked.map(q => q.num));
    if (!prevExamNums) break;
    let overlap = 0;
    candidateNums.forEach(n => { if (prevExamNums.has(n)) overlap++; });
    if (overlap < EXAM_SIZE / 2) break;
  }
  examQuestions = picked.map(q => {
    const idxs = shuffle([0, 1, 2]);
    const newOptions = idxs.map(i => q.options[i]);
    const newCorrect = idxs.indexOf(q.correct);
    return { num: q.num, stem: q.stem, options: newOptions, correct: newCorrect, flagged: q.flagged, note: q.note };
  });
  prevExamNums = new Set(examQuestions.map(q => q.num));
  answers = {};
  currentIndex = 0;
  phase = 'exam';
}

const navgrid = document.getElementById('navgrid');
const qnumEl = document.getElementById('qnum');
const qflagEl = document.getElementById('qflag');
const qtextEl = document.getElementById('qtext');
const optionsEl = document.getElementById('options');
const answeredval = document.getElementById('answeredval');
const progressBar = document.getElementById('progress-bar');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const examview = document.getElementById('examview');
const donescreen = document.getElementById('donescreen');
const scoreBig = document.getElementById('scoreBig');
const pctText = document.getElementById('pctText');
const btnReview = document.getElementById('btnReview');
const btnRestart = document.getElementById('btnRestart');

function buildNavGrid() {
  navgrid.innerHTML = '';
  examQuestions.forEach((q, i) => {
    const btn = document.createElement('div');
    btn.className = 'qbtn';
    btn.textContent = i + 1;
    btn.id = 'nav-' + i;
    btn.onclick = () => { currentIndex = i; render(); };
    navgrid.appendChild(btn);
  });
}

function updateNavGrid() {
  examQuestions.forEach((q, i) => {
    const btn = document.getElementById('nav-' + i);
    btn.classList.remove('current', 'answered', 'review-correct', 'review-incorrect');
    if (i === currentIndex) btn.classList.add('current');
    if (phase === 'exam') {
      if (answers[i] !== undefined) btn.classList.add('answered');
    } else {
      const sel = answers[i];
      if (sel === undefined) return;
      if (sel === q.correct) btn.classList.add('review-correct');
      else btn.classList.add('review-incorrect');
    }
  });
}

function updateMeta() {
  const answeredCount = Object.keys(answers).length;
  answeredval.textContent = answeredCount;
  progressBar.style.width = (answeredCount / examQuestions.length * 100) + '%';
}

function selectOption(qi, oi) {
  if (phase !== 'exam') return;
  answers[qi] = oi;
  render();
  updateMeta();
}

function render() {
  const q = examQuestions[currentIndex];
  qnumEl.textContent = 'Question ' + (currentIndex + 1) + ' of ' + examQuestions.length + '  (bank #' + q.num + ')';
  qtextEl.textContent = q.stem;

  if (phase === 'review' && q.flagged) {
    qflagEl.style.display = 'block';
    qflagEl.textContent = '⚠ Flagged in source as suspicious — ' + q.note;
  } else {
    qflagEl.style.display = 'none';
  }

  optionsEl.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D', 'E'];
  const sel = answers[currentIndex];
  q.options.forEach((opt, oi) => {
    const div = document.createElement('div');
    div.className = 'option';
    div.innerHTML = '<span class="letter">' + letters[oi] + '.</span>' + opt;
    if (phase === 'exam') {
      if (sel === oi) div.classList.add('picked');
      div.onclick = () => selectOption(currentIndex, oi);
    } else {
      div.classList.add('disabled');
      if (sel === oi && sel === q.correct) div.classList.add('review-selected-correct');
      else if (sel === oi && sel !== q.correct) div.classList.add('review-selected-incorrect');
      if (oi === q.correct && oi !== sel) div.classList.add('review-correct-reveal');
    }
    optionsEl.appendChild(div);
  });

  prevBtn.disabled = (currentIndex === 0);
  nextBtn.disabled = (currentIndex === examQuestions.length - 1);
  updateNavGrid();
}

prevBtn.onclick = () => { if (currentIndex > 0) { currentIndex--; render(); } };
nextBtn.onclick = () => { if (currentIndex < examQuestions.length - 1) { currentIndex++; render(); } };

submitBtn.onclick = () => {
  let correctCount = 0;
  examQuestions.forEach((q, i) => { if (answers[i] === q.correct) correctCount++; });
  scoreBig.textContent = correctCount + ' / ' + examQuestions.length;
  const pct = Math.round(correctCount / examQuestions.length * 100);
  pctText.textContent = pct + '%  ·  ' + (examQuestions.length - correctCount) + ' incorrect or unanswered';
  examview.style.display = 'none';
  donescreen.style.display = 'block';
};

btnReview.onclick = () => {
  phase = 'review';
  currentIndex = 0;
  donescreen.style.display = 'none';
  examview.style.display = 'block';
  render();
};

btnRestart.onclick = () => {
  buildExam();
  buildNavGrid();
  donescreen.style.display = 'none';
  examview.style.display = 'block';
  render();
  updateMeta();
};

document.addEventListener('keydown', (e) => {
  if (phase !== 'exam') return;
  if (e.key === 'ArrowLeft') prevBtn.click();
  else if (e.key === 'ArrowRight') nextBtn.click();
  else if (['1', '2', '3'].includes(e.key)) {
    const oi = parseInt(e.key) - 1;
    const q = examQuestions[currentIndex];
    if (oi < q.options.length) selectOption(currentIndex, oi);
  }
});

buildExam();
buildNavGrid();
render();
updateMeta();
window.__getExamNums = () => examQuestions.map(q => q.num);
window.__getExamCorrectPositions = () => examQuestions.map(q => q.correct);
