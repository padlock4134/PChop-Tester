import React, { useState, useRef, useEffect } from 'react';

// Add your fliers here later. `content` can be JSX, an <img>, etc.
type Flier = {
  id: string;
  title: string;
  content?: React.ReactNode;
};

const FLIERS: Flier[] = [];

const DraggableFlierModal: React.FC<{ flier: Flier; onClose: () => void }> = ({ flier, onClose }) => {
  const [pos, setPos] = useState<{ x: number; y: number }>(() => ({
    x: typeof window !== 'undefined' ? Math.max(20, window.innerWidth / 2 - 220) : 120,
    y: 120,
  }));
  const drag = useRef({ active: false, dx: 0, dy: 0 });

  const onMouseDown = (e: React.MouseEvent) => {
    drag.current = { active: true, dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    e.preventDefault();
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!drag.current.active) return;
      setPos({ x: e.clientX - drag.current.dx, y: e.clientY - drag.current.dy });
    };
    const onUp = () => { drag.current.active = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  return (
    <div
      className="fixed z-[60] w-[440px] max-w-[92vw] bg-white border-4 border-maineBlue rounded-xl shadow-2xl"
      style={{ left: pos.x, top: pos.y }}
    >
      <div
        onMouseDown={onMouseDown}
        className="cursor-move flex items-center justify-between px-4 py-3 bg-maineBlue text-white rounded-t-lg select-none"
      >
        <span className="font-retro font-bold">{flier.title}</span>
        <button onClick={onClose} className="text-white text-xl font-bold leading-none hover:text-seafoam">×</button>
      </div>
      <div className="p-5 max-h-[70vh] overflow-y-auto">
        {flier.content ?? <p className="text-gray-400 italic">Flier content goes here.</p>}
      </div>
    </div>
  );
};

const HowToGuides: React.FC = () => {
  const [showPicker, setShowPicker] = useState(false);
  const [activeFlier, setActiveFlier] = useState<Flier | null>(null);

  return (
    <>
      <button
        onClick={() => setShowPicker(true)}
        className="flex items-center gap-1 px-3 py-2 bg-sand text-maineBlue border-2 border-maineBlue rounded-lg font-retro text-sm hover:bg-seafoam transition-colors whitespace-nowrap"
      >
        📋 How-To
      </button>

      {showPicker && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPicker(false)}
        >
          <div
            className="bg-sand rounded-xl shadow-lg border-4 border-maineBlue max-w-3xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b-2 border-maineBlue sticky top-0 bg-sand z-10">
              <h3 className="text-xl font-bold text-maineBlue font-retro">📋 How-To Guides</h3>
              <button
                onClick={() => setShowPicker(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            {FLIERS.length === 0 ? (
              <p className="p-5 text-sm text-gray-500 italic">No fliers yet. Add them to the FLIERS array.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
                {FLIERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => { setActiveFlier(f); setShowPicker(false); }}
                    className="text-left bg-white border-4 border-maineBlue rounded-xl p-4 hover:bg-seafoam hover:scale-105 transition-all duration-200"
                  >
                    <div className="font-retro font-bold text-maineBlue">{f.title}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeFlier && (
        <DraggableFlierModal flier={activeFlier} onClose={() => setActiveFlier(null)} />
      )}
    </>
  );
};

export default HowToGuides;
