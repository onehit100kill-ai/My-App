const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

const target = '<div class="toolbar-controls">';
const replacement = '<div class="toolbar-controls" style="width: auto;">';

if (html.includes(target)) {
  html = html.replace(target, replacement);
  fs.writeFileSync('public/index.html', html);
  console.log('Replaced toolbar-controls style');
} else {
  console.log('Target string not found');
}
