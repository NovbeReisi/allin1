// Shared quiz engine for the 4-part study test.
// Expects a global `DATA` array (from data/partN.js) and `PART_INFO`
// (from an inline <script> in the page, e.g. {num:1, lo:1, hi:120}).

const state = {}; // num -> {selected, correct}
let currentIndex = 0;

const navgrid = document.getElementById('navgrid');
const qnumEl = document.getElementById('qnum');
const qflagEl = document.getElementById('qflag');
const qtextEl = document.getElementById('qtext');
const optionsEl = document.getElementById('options');
const feedbackEl = document.getElementById('feedback');
const scoreval = document.getElementById('scoreval');
const answeredval = document.getElementById('answeredval');
const progressBar = document.getElementById('progress-bar');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const finishBtn = document.getElementById('finishBtn');
const quizview = document.getElementById('quizview');
const donescreen = document.getElementById('donescreen');
const scoreBig = document.getElementById('scoreBig');
const pctText = document.getElementById('pctText');
const btnBackToQuiz = document.getElementById('btnBackToQuiz');

function buildNavGrid() {
  navgrid.innerHTML = '';
  DATA.forEach((q, i) => {
    const btn = document.createElement('div');
    btn.className = 'qbtn' + (q.flagged ? ' flagged' : '');
    btn.textContent = q.num;
    btn.id = 'nav-' + i;
    btn.onclick = () => { currentIndex = i; render(); };
    navgrid.appendChild(btn);
  });
}

function updateNavGrid() {
  DATA.forEach((q, i) => {
    const btn = document.getElementById('nav-' + i);
    btn.classList.remove('current', 'correct', 'incorrect');
    if (i === currentIndex) btn.classList.add('current');
    const st = state[q.num];
    if (st) {
      if (st.correct === true) btn.classList.add('correct');
      else if (st.correct === false) btn.classList.add('incorrect');
    }
  });
}

function updateScore() {
  let correctCount = 0, answeredCount = 0;
  Object.values(state).forEach(s => {
    answeredCount++;
    if (s.correct === true) correctCount++;
  });
  scoreval.textContent = correctCount;
  answeredval.textContent = answeredCount;
  progressBar.style.width = (answeredCount / DATA.length * 100) + '%';
}

function selectOption(qi, oi) {
  const q = DATA[qi];
  if (state[q.num]) return;
  let correct = null;
  if (q.correct !== null && q.correct !== undefined) {
    correct = (oi === q.correct);
  }
  state[q.num] = { selected: oi, correct: correct };
  render();
  updateScore();
}

function render() {
  const q = DATA[currentIndex];
  qnumEl.textContent = 'Question ' + q.num;
  qtextEl.textContent = q.stem;

  if (q.flagged) {
    qflagEl.style.display = 'block';
    qflagEl.textContent = '⚠ Flagged in source as suspicious — ' + q.note;
  } else {
    qflagEl.style.display = 'none';
  }

  optionsEl.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D', 'E'];
  const st = state[q.num];
  q.options.forEach((opt, oi) => {
    const div = document.createElement('div');
    div.className = 'option';
    div.innerHTML = '<span class="letter">' + letters[oi] + '.</span>' + opt;
    if (st) {
      div.classList.add('disabled');
      if (q.correct !== null && q.correct !== undefined) {
        if (oi === st.selected && st.correct) div.classList.add('selected-correct');
        else if (oi === st.selected && !st.correct) div.classList.add('selected-incorrect');
        if (oi === q.correct && oi !== st.selected) div.classList.add('reveal-correct');
      }
    } else {
      div.onclick = () => selectOption(currentIndex, oi);
    }
    optionsEl.appendChild(div);
  });

  feedbackEl.className = '';
  if (st) {
    if (q.correct === null || q.correct === undefined) {
      feedbackEl.textContent = 'No verified correct answer for this question — flagged in source.';
      feedbackEl.classList.add('neutral');
    } else if (st.correct) {
      feedbackEl.textContent = '✓ Correct';
      feedbackEl.classList.add('correct');
    } else {
      feedbackEl.textContent = '✗ Incorrect — correct answer highlighted above';
      feedbackEl.classList.add('incorrect');
    }
  } else {
    feedbackEl.textContent = '';
  }

  prevBtn.disabled = (currentIndex === 0);
  nextBtn.disabled = (currentIndex === DATA.length - 1);
  updateNavGrid();
}

prevBtn.onclick = () => { if (currentIndex > 0) { currentIndex--; render(); } };
nextBtn.onclick = () => { if (currentIndex < DATA.length - 1) { currentIndex++; render(); } };

function showResults() {
  let correctCount = 0, answeredCount = 0;
  Object.values(state).forEach(s => {
    answeredCount++;
    if (s.correct === true) correctCount++;
  });
  scoreBig.textContent = correctCount + ' / ' + DATA.length;
  const pct = Math.round(correctCount / DATA.length * 100);
  const unanswered = DATA.length - answeredCount;
  let detail = pct + '%';
  if (unanswered > 0) detail += '  ·  ' + unanswered + ' unanswered';
  pctText.textContent = detail;
  quizview.style.display = 'none';
  donescreen.style.display = 'block';
}

finishBtn.onclick = showResults;

btnBackToQuiz.onclick = () => {
  donescreen.style.display = 'none';
  quizview.style.display = 'block';
  render();
};

document.addEventListener('keydown', (e) => {
  if (donescreen.style.display !== 'none') return;
  if (e.key === 'ArrowLeft') prevBtn.click();
  else if (e.key === 'ArrowRight') nextBtn.click();
  else if (['1', '2', '3'].includes(e.key)) {
    const oi = parseInt(e.key) - 1;
    const q = DATA[currentIndex];
    if (oi < q.options.length) selectOption(currentIndex, oi);
  }
});

buildNavGrid();
render();
updateScore();
