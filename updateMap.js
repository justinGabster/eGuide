const fs = require('fs');

const path = 'app/(main)/map/MapComponent.tsx';
const content = fs.readFileSync(path, 'utf8');

const topControlsRegex = /\s*\{\/\* Top Dropdown Controls \*\/\}\s*<div style=\{\{[\s\S]*?alignItems: 'center'\s*\}\}>\s*\{\/\* Trains Dropdown \*\/\}([\s\S]*?)\{\/\* Ships Dropdown \*\/\}([\s\S]*?<\/div>\s*<\/div>)\s*<\/div>\s*/;

const match = content.match(topControlsRegex);
if (!match) {
  console.log("Could not find Top Dropdown Controls block");
  process.exit(1);
}

const trainsBlock = `        {/* Trains Dropdown */}${match[1]}`;
const shipsBlock = `{/* Ships Dropdown */}${match[2]}`;
const fullDropdowns = trainsBlock + shipsBlock;

let newContent = content.replace(topControlsRegex, '\n\n');

// Find end of Filter Control Overlay logic
const panelEndRegex = /(\s*)<\/button>\s*<\/div>\s*\)\}\s*<\/div>\s*<style>/;
const panelMatch = newContent.match(panelEndRegex);

if (!panelMatch) {
  console.log("Could not find panel end");
  process.exit(1);
}

const newDropdownsContainer = `
            {/* Relocated Top Controls */}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px', padding: '4px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
${fullDropdowns.split('\n').map(line => '      ' + line).join('\n')}
            </div>
`;

newContent = newContent.replace(
  /(\s*)<\/button>\s*<\/div>\s*\)\}\s*<\/div>\s*<style>/,
  `$1</button>${newDropdownsContainer}          </div>\n        )}\n      </div>\n\n      <style>`
);

fs.writeFileSync(path, newContent);
console.log("Successfully restructured map controls.");
