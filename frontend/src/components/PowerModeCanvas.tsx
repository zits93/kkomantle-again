import React, { useEffect } from 'react';

interface PowerModeCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export const PowerModeCanvas: React.FC<PowerModeCanvasProps> = ({ canvasRef }) => {
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [canvasRef]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
    />
  );
};
