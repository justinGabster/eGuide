const fs = require('fs');
const path = 'app/(main)/map/MapComponent.tsx';
let content = fs.readFileSync(path, 'utf8');

// Update panel background
content = content.replace(
  /background: 'rgba\(15, 23, 42, 0\.95\)'/g,
  `background: '#1C2436'`
);

// Update pill styling
content = content.replace(
  /: '#121a2b',\s*borderRadius: '9999px',\s*border: (.*?)\? '1px solid #3b82f6' : '1px solid transparent'/g,
  `: '#0B1220',
                  borderRadius: '9999px',
                  border: $1? '1px solid #3b82f6' : '1px solid rgba(51, 65, 85, 0.4)'`
);

fs.writeFileSync(path, content);
console.log('UI styles updated for contrast.');
