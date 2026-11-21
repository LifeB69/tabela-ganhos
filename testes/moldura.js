const q = new URLSearchParams(location.search);
const f = document.getElementById('quadro');
f.width = String(Number(q.get('w')) || 390);
f.height = String(Number(q.get('h')) || 844);
const src = q.get('src') || '../index.html';
// só caminhos deste mesmo site
f.src = /^[a-z]+:/i.test(src) ? '../index.html' : src;
