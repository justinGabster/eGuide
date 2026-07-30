const fs = require('fs');
const path = 'app/(main)/map/MapComponent.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /background: ([^?]+) \? 'rgba\(59, 130, 246, 0\.2\)' : 'transparent',\s*borderRadius: '6px',\s*border: ([^?]+) \? '1px solid #3b82f6' : '1px solid transparent'/g,
  `background: $1 ? 'rgba(59, 130, 246, 0.2)' : '#121a2b',
                  borderRadius: '9999px',
                  border: $2 ? '1px solid #3b82f6' : '1px solid transparent'`
);

// We need to also check the Airplane dropdown which has different logic:
content = content.replace(
  /background: showAirports \? 'rgba\(59, 130, 246, 0\.2\)' : 'transparent',\s*borderRadius: '6px',\s*border: showAirports \? '1px solid #3b82f6' : '1px solid transparent'/g,
  `background: showAirports ? 'rgba(59, 130, 246, 0.2)' : '#121a2b',
                  borderRadius: '9999px',
                  border: showAirports ? '1px solid #3b82f6' : '1px solid transparent'`
);

content = content.replace(
  /background: showShips \? 'rgba\(59, 130, 246, 0\.2\)' : 'transparent',\s*borderRadius: '6px',\s*border: showShips \? '1px solid #3b82f6' : '1px solid transparent'/g,
  `background: showShips ? 'rgba(59, 130, 246, 0.2)' : '#121a2b',
                  borderRadius: '9999px',
                  border: showShips ? '1px solid #3b82f6' : '1px solid transparent'`
);

fs.writeFileSync(path, content);
console.log('Styles updated.');
