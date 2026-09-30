const fs = require('fs');
let js = fs.readFileSync('public/js/app.js', 'utf8');
const target = `    tab.addEventListener('click', () => {
      intensiveTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');`;
const replacement = `    tab.addEventListener('click', () => {
      intensiveTabs.forEach(t => {
        t.classList.remove('active');
        t.style.color = 'var(--text-secondary)';
        t.style.borderBottomColor = 'transparent';
      });
      tab.classList.add('active');
      tab.style.color = 'var(--primary)';
      tab.style.borderBottomColor = 'var(--primary)';`;

if (js.includes(target)) {
  js = js.replace(target, replacement);
  fs.writeFileSync('public/js/app.js', js);
  console.log('Fixed tab active styles');
} else {
  console.log('Target string not found');
}
