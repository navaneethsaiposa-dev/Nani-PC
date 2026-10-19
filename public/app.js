const $ = (id) => document.getElementById(id);
const value = (id) => $(id).value;

function card(t) {
  return `<article class="card"><div class="poster" style="background:linear-gradient(135deg,${t.colors[0]},${t.colors[1]})">${t.emoji}<small>Match ${Math.round(t.score * 100)}%</small></div><div class="card-body"><div class="meta">${t.duration} min · ${t.rating} · ${(t.languages || []).join(' / ')}</div><h3>${t.name}</h3><p class="desc">${t.description || ''}</p><div class="why"><b>Why this?</b>${t.why}</div><button class="play" onclick="play('${t.name.replaceAll("'", "\\'")}')">▶ Play now</button></div></article>`;
}

async function recommend() {
  const button = $('find');
  button.disabled = true;
  button.textContent = 'Finding your match...';
  try {
    const res = await fetch('/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minutes: Number(value('minutes')), mood: value('mood'), audience: value('audience'), language: value('language'), genre: value('genre'), budget: value('budget') })
    });
    if (!res.ok) throw new Error('Recommendation request failed');
    const data = await res.json();
    const surprise = value('budget') === 'surprise';
    $('results').innerHTML = `<div class="result-head"><div><p class="eyebrow">YOUR SHORTLIST</p><h2>${surprise ? 'Your surprise pick' : 'Three choices. Zero endless scrolling.'}</h2></div><div class="metric">Loaded from MongoDB</div></div><div class="cards">${data.recommendations.map(card).join('')}</div>`;
    $('results').scrollIntoView({ behavior: 'smooth' });
  } catch {
    $('results').innerHTML = '<div class="empty">Backend unavailable. Check that MongoDB is connected and the server is running.</div>';
  } finally {
    button.disabled = false;
    button.textContent = 'Find something to watch ✦';
  }
}

function play(name) {
  const toast = $('toast');
  toast.textContent = `▶ Ready to play: ${name}`;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

$('find').onclick = recommend;
$('clear').onclick = () => {
  $('results').innerHTML = '<div class="empty">Session cleared. Choose your preferences to begin again.</div>';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
