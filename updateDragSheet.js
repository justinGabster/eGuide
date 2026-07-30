const fs = require('fs');
const path = 'app/(main)/map/MapComponent.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update State
content = content.replace(
  /const \[isPanelCollapsed, setIsPanelCollapsed\] = useState\(false\);/,
  `const [isPanelCollapsed, setIsPanelCollapsed] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const dragStartY = useRef(0);
  const currentDragY = useRef(0);`
);

// 2. Extract Top Controls from the old Filter Control Overlay
const overlayStartIdx = content.indexOf('{/* Filter Control Overlay */}');
if (overlayStartIdx === -1) {
  console.log("Could not find Filter Control Overlay");
  process.exit(1);
}

// Replace the entire Filter Control Overlay block
// We need to carefully replace the block up to `<style>{`
const overlayEndIdx = content.indexOf('<style>{`', overlayStartIdx);
if (overlayEndIdx === -1) {
  console.log("Could not find style end");
  process.exit(1);
}

// Extract the Trains/Buses/Airplane/Ships row (it was added recently in the last task)
const relocatedTopControlsRegex = /\{\/\* Relocated Top Controls \*\/\}\s*<div style=\{\{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px', padding: '4px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' \}\}>([\s\S]*?)<\/div>\s*<\/div>\s*\)\}\s*<\/div>\s*$/m;

const oldOverlayChunk = content.substring(overlayStartIdx, overlayEndIdx);

const trainsRowMatch = oldOverlayChunk.match(/\{\/\* Relocated Top Controls \*\/\}\s*<div[^>]*>([\s\S]*?)<\!-- Airplane Dropdown/);
// Wait, the regex needs to be more robust. Let's just find the exact strings for the dropdowns.
const trainsDropdown = oldOverlayChunk.match(/\{\/\* Trains Dropdown \*\/\}([\s\S]*?)\{\/\* Buses Dropdown \*\/\}/)[0];
const busesDropdown = oldOverlayChunk.match(/\{\/\* Buses Dropdown \*\/\}([\s\S]*?)\{\/\* Airplane Dropdown \*\/\}/)[0];
const airplaneDropdown = oldOverlayChunk.match(/\{\/\* Airplane Dropdown \*\/\}([\s\S]*?)\{\/\* Ships Dropdown \*\/\}/)[0];
const shipsDropdown = oldOverlayChunk.match(/\{\/\* Ships Dropdown \*\/\}([\s\S]*?<\/div>\s*<\/div>\s*)<\/div>/)[1];

const transitCategoriesRow = `
            {/* Transit Categories Row */}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', padding: '0 16px', justifyContent: 'center' }}>
              ${trainsDropdown}
              ${busesDropdown}
              ${airplaneDropdown}
              {/* Ships Dropdown */}
              ${shipsDropdown}
            </div>
`;

// Extract top controls
const stationNamesChunk = oldOverlayChunk.match(/\{\/\* Toggle Station Names \*\/\}([\s\S]*?)\{\/\* Toggle Live Vehicles \*\/\}/)[1];
const liveVehiclesChunk = oldOverlayChunk.match(/\{\/\* Toggle Live Vehicles \*\/\}([\s\S]*?)\{\/\* Direction Filter \*\/\}/)[1];
const directionFilterChunk = oldOverlayChunk.match(/\{\/\* Direction Filter \*\/\}([\s\S]*?)\{\/\* Toggle Line View Button \*\/\}/)[1];
const lineViewChunk = oldOverlayChunk.match(/\{\/\* Toggle Line View Button \*\/\}([\s\S]*?)\{\/\* Relocated Top Controls \*\/\}/)[1];

const newTopSheet = `
      {/* Top Sheet Overlay */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        width: '92%',
        maxWidth: '400px',
      }}>
        {/* Collapsible Top Section */}
        <div style={{ 
            height: isDragging ? Math.max(0, (isPanelCollapsed ? 0 : 250) + dragY) : (isPanelCollapsed ? 0 : 250),
            overflow: 'hidden',
            transition: isDragging ? 'none' : 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative'
        }}>
           <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                  MAP CONTROLS
                </label>
                <button 
                  onClick={() => setIsPanelCollapsed(true)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  aria-label="Collapse Panel"
                >
                  <ChevronUp size={16} />
                </button>
              </div>

              {/* Toggle Station Names */}
${stationNamesChunk}

              {/* Toggle Live Vehicles */}
${liveVehiclesChunk}

              {/* Direction Filter */}
${directionFilterChunk}

              {/* Toggle Line View Button */}
${lineViewChunk}
           </div>
        </div>

${transitCategoriesRow}

        {/* Drag Handle Area */}
        <div 
          onTouchStart={(e) => { setIsDragging(true); dragStartY.current = e.touches[0].clientY; currentDragY.current = 0; setDragY(0); }}
          onTouchMove={(e) => { 
            if (!isDragging) return; 
            const deltaY = e.touches[0].clientY - dragStartY.current; 
            currentDragY.current = deltaY; 
            setDragY(deltaY); 
          }}
          onTouchEnd={() => { 
            setIsDragging(false); 
            if (isPanelCollapsed && currentDragY.current > 40) setIsPanelCollapsed(false); 
            else if (!isPanelCollapsed && currentDragY.current < -40) setIsPanelCollapsed(true);
            setDragY(0); 
          }}
          style={{ width: '100%', padding: '12px 0 8px 0', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'grab', touchAction: 'none' }}
        >
          <div style={{ width: '40px', height: '4px', backgroundColor: '#475569', borderRadius: '2px' }} />
        </div>
      </div>

      `;

const newContent = content.substring(0, overlayStartIdx) + newTopSheet + content.substring(overlayEndIdx);

fs.writeFileSync(path, newContent);
console.log("Successfully restructured Map Component for top sheet drag.");
