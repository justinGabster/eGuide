const fs = require('fs');
const path = 'app/(main)/map/MapComponent.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix Ships Pill
content = content.replace(
  /background: showSeaports \? 'rgba\(13, 148, 136, 0\.2\)' : 'transparent',\s*borderRadius: '6px',\s*border: showSeaports \? '1px solid #0d9488' : '1px solid transparent'/g,
  `background: showSeaports ? 'rgba(13, 148, 136, 0.2)' : '#0B1220',
                  borderRadius: '9999px',
                  border: showSeaports ? '1px solid #0d9488' : '1px solid rgba(51, 65, 85, 0.4)'`
);

// We need to find if there is excess top padding on the panel container or anywhere.
// Let's check the container styles.
const outerStyle = `      <div style={{
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: '#1C2436',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        width: '92%',
        maxWidth: '400px',`;

// If we look at the outer container, there is NO padding.
// Maybe the user meant "add padding" so it looks right? Or maybe `Transit Categories Row` has `padding: '16px 16px'` in their view?
// Wait, I see padding: '0 16px' in my view.
// But wait! Look at the MapComponent.tsx file: I see `padding: '16px 16px 8px 16px'` on the Header of the Collapsible Top Section!
// When collapsed, the Collapsible Top Section has height 0, so that padding is hidden.
// So when collapsed, the pills have NO padding at the top.
// Wait! If they have NO padding, why did the user say "Remove Excess Top Padding"?
// Perhaps the user noticed that when the panel is COLLAPSED, there is excess padding? 
// Wait, if the panel height is based on children, maybe the `Collapsible Top Section` is NOT height 0?
// Let's check `isPanelCollapsed ? 0 : 250`. 
// Wait, if the `Collapsible Top Section` is 0, the `Transit Categories Row` is right at the top. But wait, `padding: '0 16px'` means it has 16px horizontal padding, 0 top/bottom. 
// What about `Drag Handle Area`? It has `padding: '12px 0 8px 0'`. So the bottom has padding.
// But wait, the user's snippet:
// <div className="bg-[#1C2436] rounded-2xl p-3 shadow-lg">
// This means the WHOLE container should have `padding: '12px'`.
// If I add `padding: '12px'` to the outer container, I need to remove `padding: '0 16px'` from the `Transit Categories Row` (it can just be `padding: 0`).
// And the `Drag Handle Area` can just have `padding: '8px 0 0 0'` or something.
// And the `Collapsible Top Section` header shouldn't have `16px 16px` padding, just `0 0 8px 0` since the container has padding.

content = content.replace(
  /width: '92%',\s*maxWidth: '400px',/g,
  `width: '92%',
        maxWidth: '400px',
        padding: '12px',`
);

// Remove padding from Transit Categories Row
content = content.replace(
  /padding: '0 16px', justifyContent: 'center'/g,
  `padding: '0', justifyContent: 'center'`
);

// Remove excess padding from Drag Handle Area (it had 12px 0 8px 0, we can just make it 8px 0 0 0)
content = content.replace(
  /padding: '12px 0 8px 0', display: 'flex'/g,
  `padding: '8px 0 0 0', display: 'flex'`
);

// The Collapsible Top Section header had `padding: '16px 16px 8px 16px'`
content = content.replace(
  /padding: '16px 16px 8px 16px', display: 'flex'/g,
  `padding: '0 0 16px 0', display: 'flex'`
);

fs.writeFileSync(path, content);
console.log('Ships dropdown fixed and padding updated.');
