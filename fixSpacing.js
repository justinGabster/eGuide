const fs = require('fs');
const path = 'app/(main)/map/MapComponent.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `{/* Collapsible Top Section */}
        <div style={{ 
            height: isDragging ? Math.max(0, (isPanelCollapsed ? 0 : 250) + dragY) : (isPanelCollapsed ? 0 : 250),
            overflow: 'hidden',
            transition: isDragging ? 'none' : 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative'
        }}>
           <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>`;

const replaceStr = `{/* Collapsible Top Section */}
        <div style={{ 
            maxHeight: isDragging ? Math.max(0, (isPanelCollapsed ? 0 : 250) + dragY) : (isPanelCollapsed ? 0 : 250),
            opacity: isDragging ? Math.min(1, Math.max(0.3, (isPanelCollapsed ? 0 : 1) + (dragY / 150))) : (isPanelCollapsed ? 0 : 1),
            overflow: 'hidden',
            transition: isDragging ? 'none' : 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            width: '100%'
        }}>
           <div style={{ padding: '0 0 16px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replaceStr);
    fs.writeFileSync(path, content);
    console.log('Fixed Top Sheet extra spacing.');
} else {
    console.log('Target string not found. Please review the file manually.');
}
