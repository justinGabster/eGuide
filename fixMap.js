const fs = require('fs');
const path = 'app/(main)/map/MapComponent.tsx';
let content = fs.readFileSync(path, 'utf8');

const anchor = `<path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>`;
const afterAnchor = `          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"`;

const toInsert = `
            </svg>
            <style>{\`@keyframes spin { 100% { transform: rotate(360deg); } }\`}</style>
            Loading map routes...
          </div>
        )}
      </div>

      <MapContainer 
        ref={mapRef}
        center={[14.6500, 121.0300]} 
        zoom={11} 
        zoomControl={false}
        scrollWheelZoom={true} 
        style={{ width: '100%', height: '100%', background: '#1e293b' }}
      >
        <MapResizer />
        {/* Dark mode tiles using CartoDB Dark Matter */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
`;

// Only replace if it hasn't been fixed yet
if (content.indexOf('<MapContainer') === -1) {
  content = content.replace(anchor, anchor + toInsert);
  fs.writeFileSync(path, content);
  console.log('Fixed MapComponent.tsx');
} else {
  console.log('Already fixed?');
}
