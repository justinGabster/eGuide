
async function testOsrm() {
  const coords = [
    [121.0017, 14.5373], // Taft
    [120.9880, 14.5358], // EDSA Ext Via 1
    [120.9855, 14.5348], // EDSA Ext Via 2
    [120.98326, 14.53503], // MOA
    [120.9908, 14.5098] // PITX
  ];
  const url = 'http://router.project-osrm.org/route/v1/driving/' + coords.map(c => c.join(',')).join(';') + '?overview=full&geometries=geojson';
  const res = await fetch(url);
  const data = await res.json();
  console.log('OSRM Route Length:', data.routes?.[0]?.geometry?.coordinates?.length);
  require('fs').writeFileSync('route_test.geojson', JSON.stringify(data.routes?.[0]?.geometry));
}
testOsrm();

