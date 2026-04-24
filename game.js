/* ============================================================
   EL PANELL DEL DIRECTOR — LÒGICA DE LES RULETES
   ============================================================ */

// ------- DADES PER DEFECTE (si no es carrega cap fitxer) -------
const JOCS_DEFECTE = [
  "TGC Instruments",
  "Note Snake",
  "Tira la Corda Rítmica",
  "Symphonic Tactics",
  "Music Dash",
  "Rhythm Crush",
  "Melodle",
  "Busca-Ritmes",
  "Rajoles Rítmiques"
];

const PREMIS_DEFECTE = [
  "x1 Positiu",
  "x2 Positius",
  "x3 Positius",
  "x5 Positius (Jackpot!)",
  "El professor tria",
  "Joc prohibit!"
];

// Paleta de colors pel dibuix dels segments
const PALETA = [
  "#ff3b9a", "#ffcc00", "#00e6c3", "#7a5cff",
  "#ff6b3d", "#32d96b", "#3db4ff", "#e83e8c",
  "#ffb84d", "#9b59b6", "#1abc9c", "#f1c40f"
];

// ------- REFERÈNCIES DOM -------
const txtJocs   = document.getElementById("txtJocs");
const txtPremis = document.getElementById("txtPremis");
const canvasJ   = document.getElementById("ruletaJocs");
const canvasP   = document.getElementById("ruletaPremis");
const btnGirar  = document.getElementById("btnGirar");
const modal     = document.getElementById("modal");
const modalContingut = document.getElementById("modalContingut");
const jocResultat    = document.getElementById("jocResultat");
const premiResultat  = document.getElementById("premiResultat");
const btnTancarModal = document.getElementById("btnTancarModal");
const btnFullscreen  = document.getElementById("btnFullscreen");

// Estat rotació (en radians)
let rotJ = 0;
let rotP = 0;
let animant = false;

// ------- INIT -------
init();

async function init() {
  // Intenta carregar els .txt externs (si el navegador permet fetch local)
  const [jocs, premis] = await Promise.all([
    carregarFitxerExtern("jocs.txt", JOCS_DEFECTE),
    carregarFitxerExtern("premis.txt", PREMIS_DEFECTE)
  ]);
  txtJocs.value   = jocs.join("\n");
  txtPremis.value = premis.join("\n");

  dibuixarRuletes();
  vincularEsdeveniments();
}

// Intenta fer fetch. Si falla (CORS amb file://), fa servir els valors per defecte.
async function carregarFitxerExtern(path, defecte) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error("No trobat");
    const text = await res.text();
    const llista = netejarLlista(text);
    return llista.length ? llista : defecte;
  } catch (e) {
    console.info(`[Info] No s'ha pogut carregar ${path} via fetch (normal si obres l'index.html sense servidor). Es fan servir els valors per defecte.`);
    return defecte;
  }
}

// ------- UTILITATS -------
function netejarLlista(text) {
  return text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith("#"));
}

function getJocs()   { return netejarLlista(txtJocs.value); }
function getPremis() { return netejarLlista(txtPremis.value); }

// ------- DIBUIX DE LES RULETES -------
function dibuixarRuletes() {
  dibuixarRuleta(canvasJ, getJocs(),   rotJ);
  dibuixarRuleta(canvasP, getPremis(), rotP);
}

function dibuixarRuleta(canvas, items, rotacio) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const radi = Math.min(W, H) / 2 - 8;

  ctx.clearRect(0, 0, W, H);

  if (items.length === 0) {
    ctx.fillStyle = "#aab3d4";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("(llista buida)", cx, cy);
    return;
  }

  const angSeg = (Math.PI * 2) / items.length;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotacio);

  items.forEach((item, i) => {
    const a0 = i * angSeg;
    const a1 = a0 + angSeg;

    // Segment
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radi, a0, a1);
    ctx.closePath();
    ctx.fillStyle = PALETA[i % PALETA.length];
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(0,0,0,.35)";
    ctx.stroke();

    // Text del segment
    ctx.save();
    ctx.rotate(a0 + angSeg / 2);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,.8)";
    ctx.shadowBlur = 4;

    const textMax = radi - 30;
    const fontSize = Math.max(11, Math.min(20, 180 / items.length + 10));
    ctx.font = `bold ${fontSize}px "Segoe UI", sans-serif`;

    const text = escurcarText(ctx, item, textMax);
    ctx.fillText(text, radi - 12, 0);
    ctx.restore();
  });

  ctx.restore();

  // Cercle central
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, Math.PI * 2);
  ctx.fillStyle = "#0b0f1a";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#ffcc00";
  ctx.stroke();
}

function escurcarText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxWidth) {
    t = t.slice(0, -1);
  }
  return t + "…";
}

// ------- EVENTS -------
function vincularEsdeveniments() {
  txtJocs.addEventListener("input", dibuixarRuletes);
  txtPremis.addEventListener("input", dibuixarRuletes);

  btnGirar.addEventListener("click", girar);
  btnTancarModal.addEventListener("click", tancarModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) tancarModal();
  });

  // Càrrega/desat de fitxers
  document.getElementById("fileJocs").addEventListener("change", (e) => carregarArxiu(e, txtJocs));
  document.getElementById("filePremis").addEventListener("change", (e) => carregarArxiu(e, txtPremis));

  document.getElementById("btnDescarregaJocs")
    .addEventListener("click", () => descarregar("jocs.txt", txtJocs.value));
  document.getElementById("btnDescarregaPremis")
    .addEventListener("click", () => descarregar("premis.txt", txtPremis.value));

  document.getElementById("btnResetJocs").addEventListener("click", () => {
    txtJocs.value = JOCS_DEFECTE.join("\n");
    dibuixarRuletes();
  });
  document.getElementById("btnResetPremis").addEventListener("click", () => {
    txtPremis.value = PREMIS_DEFECTE.join("\n");
    dibuixarRuletes();
  });

  // Fullscreen
  btnFullscreen.addEventListener("click", toggleFullscreen);

  // Toggle llistes
  document.getElementById("btnToggleLlistes").addEventListener("click", () => {
    const zona = document.getElementById("zonaGestio");
    const layout = document.querySelector(".layout");
    const visible = !zona.hidden;
    zona.hidden = visible;
    layout.classList.toggle("mostra-llistes", !visible);
    // Redibuixa perquè el tamany del canvas ha canviat
    requestAnimationFrame(dibuixarRuletes);
  });

  // Redibuixa en canvis de mida
  window.addEventListener("resize", dibuixarRuletes);
}

// ------- CÀRREGA / DESAT ARXIUS (offline, amb FileReader) -------
function carregarArxiu(event, textarea) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    textarea.value = e.target.result;
    dibuixarRuletes();
  };
  reader.readAsText(file, "UTF-8");
  event.target.value = ""; // permetre tornar a carregar el mateix fitxer
}

function descarregar(nom, contingut) {
  const blob = new Blob([contingut], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ------- FULLSCREEN -------
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen();
  }
}

// ------- GIRAR RULETES -------
function girar() {
  if (animant) return;
  const jocs   = getJocs();
  const premis = getPremis();

  if (jocs.length === 0 || premis.length === 0) {
    alert("Cal tenir almenys un element a cada llista!");
    return;
  }

  animant = true;
  btnGirar.disabled = true;

  // Redibuixa per si s'han editat els textareas
  dibuixarRuletes();

  // Rotació final totalment aleatòria (no prefixem cap guanyador).
  // El guanyador es llegeix de la rotació final → així SEMPRE coincideix amb el que veu l'ull.
  const voltesJ = 5 + Math.random() * 2; // 5-7 voltes
  const voltesP = 6 + Math.random() * 2; // 6-8 voltes
  const extraJ  = Math.random() * Math.PI * 2;
  const extraP  = Math.random() * Math.PI * 2;

  const rotacioFinalJ = rotJ + voltesJ * Math.PI * 2 + extraJ;
  const rotacioFinalP = rotP + voltesP * Math.PI * 2 + extraP;

  const durada = 4500 + Math.random() * 1000; // 4.5 - 5.5 segons
  const inici = performance.now();
  const rotJIni = rotJ;
  const rotPIni = rotP;

  function animar(now) {
    const t = Math.min(1, (now - inici) / durada);
    const eased = easeOutCubic(t);

    rotJ = rotJIni + (rotacioFinalJ - rotJIni) * eased;
    rotP = rotPIni + (rotacioFinalP - rotPIni) * eased;

    dibuixarRuletes();

    if (t < 1) {
      requestAnimationFrame(animar);
    } else {
      // Determinem el resultat A PARTIR de la rotació final real:
      const idxJ = segmentSotaFletxa(jocs.length, rotJ);
      const idxP = segmentSotaFletxa(premis.length, rotP);

      // Normalitzem per evitar que rotJ/rotP creixin sense límit
      rotJ = normalitzar(rotJ);
      rotP = normalitzar(rotP);
      animant = false;
      btnGirar.disabled = false;
      mostrarResultat(jocs[idxJ], premis[idxP]);
    }
  }
  requestAnimationFrame(animar);
}

// Retorna l'índex del segment que queda just sota la fletxa (part superior del canvas).
// A canvas: X creix cap a la dreta, Y creix cap avall; angle 0 apunta a la dreta (3h)
// i creix en sentit horari visual. "Amunt" (12h) és angle 3π/2.
// Segment i ocupa [i·angSeg, (i+1)·angSeg) amb centre (i+0.5)·angSeg.
// Després de rotar R, el centre del segment i apareix a (R + (i+0.5)·angSeg) mod 2π.
// Volem el i tal que aquest angle sigui més a prop de 3π/2.
function segmentSotaFletxa(n, R) {
  const angSeg = (Math.PI * 2) / n;
  const objectiu = (3 * Math.PI) / 2;
  // Trobem quin angle local (en la ruleta) queda a l'objectiu: θ_local ≡ objectiu - R (mod 2π)
  const local = normalitzar(objectiu - R);
  // L'índex és floor(local / angSeg)
  return Math.floor(local / angSeg) % n;
}

function normalitzar(a) {
  const TAU = Math.PI * 2;
  return ((a % TAU) + TAU) % TAU;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// ------- RESULTAT -------
function mostrarResultat(joc, premi) {
  jocResultat.textContent   = joc;
  premiResultat.textContent = premi;

  const esAlerta = /prohibit/i.test(premi);
  modalContingut.classList.toggle("alerta", esAlerta);

  modal.classList.remove("hidden");
}

function tancarModal() {
  modal.classList.add("hidden");
}
