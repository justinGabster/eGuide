const fs = require('fs');
const path = 'app/(main)/map/MapComponent.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  '  const currentDragY = useRef(0);',
  `  const currentDragY = useRef(0);
  const dragType = useRef<'mouse'|'touch'|null>(null);

  useEffect(() => {
    if (!isDragging || dragType.current !== 'mouse') return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - dragStartY.current;
      currentDragY.current = deltaY;
      setDragY(deltaY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragType.current = null;
      if (isPanelCollapsed && currentDragY.current > 40) setIsPanelCollapsed(false);
      else if (!isPanelCollapsed && currentDragY.current < -40) setIsPanelCollapsed(true);
      setDragY(0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [isDragging, isPanelCollapsed]);`
);

content = content.replace(
  `        <div \n          onTouchStart={(e) => { setIsDragging(true); dragStartY.current = e.touches[0].clientY; currentDragY.current = 0; setDragY(0); }}`,
  `        <div \n          onMouseDown={(e) => { setIsDragging(true); dragType.current = 'mouse'; dragStartY.current = e.clientY; currentDragY.current = 0; setDragY(0); }}\n          onTouchStart={(e) => { setIsDragging(true); dragType.current = 'touch'; dragStartY.current = e.touches[0].clientY; currentDragY.current = 0; setDragY(0); }}`
);

content = content.replace(
  `cursor: 'grab', touchAction: 'none' }}`,
  `cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}`
);

fs.writeFileSync(path, content);
console.log("Mouse drag support added.");
