import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface AROverlay {
  type: 'line' | 'circle' | 'grid' | 'text' | 'arrow' | 'hand' | 'tool' | string;
  position?: string;
  angle?: number;
  color?: string;
  label?: string;
  size?: string;
  coordinates?: { x: number; y: number; z: number };
}

export interface ARStep {
  id: number;
  instruction: string;
  duration?: string;
  overlays?: AROverlay[];
  tools?: string[];
  ingredients?: string[];
  keyPoints?: string[];
}

export interface ARPracticeScene {
  lesson?: string;
  setup?: {
    workspace?: string;
    requiredTools?: string[];
    requiredIngredients?: string[];
  };
  steps?: ARStep[];
  tips?: string[];
}

export interface GenericFirstPersonARSceneProps {
  scene?: ARPracticeScene | null;
  onComplete: () => void;
  guideOpen?: boolean;
  setGuideOpen?: (open: boolean) => void;
  onStopTrackingRef?: React.MutableRefObject<(() => void) | null>;
  discipline?: string;
  themeColor?: string;
}

const DISCIPLINE_THEME_COLORS: Record<string, string> = {
  welding: '#F59E0B',
  culinary: '#DC2626',
  construction: '#F97316',
  automotive: '#2563EB',
  hvac: '#06B6D4',
  plumbing: '#0EA5E9',
  electrical: '#FACC15',
  manufacturing: '#8B5CF6',
  logistics: '#22C55E',
};

const POSITION_STYLES: Record<string, React.CSSProperties> = {
  center: { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' },
  left: { left: '14%', top: '50%', transform: 'translate(-50%, -50%)' },
  right: { right: '14%', top: '50%', transform: 'translate(50%, -50%)' },
  top: { left: '50%', top: '16%', transform: 'translate(-50%, -50%)' },
  bottom: { left: '50%', bottom: '21%', transform: 'translate(-50%, 50%)' },
};

const SIZE_CLASSES: Record<string, string> = {
  small: 'scale-75',
  medium: 'scale-100',
  large: 'scale-125',
};

const getPositionStyle = (position?: string): React.CSSProperties => {
  if (!position) return POSITION_STYLES.center;
  return POSITION_STYLES[position.toLowerCase()] || POSITION_STYLES.center;
};

const normalizeArray = <T,>(items?: T[]): T[] => (Array.isArray(items) ? items : []);

const GenericFirstPersonARScene: React.FC<GenericFirstPersonARSceneProps> = ({
  scene,
  onComplete,
  guideOpen: externalGuideOpen,
  setGuideOpen: externalSetGuideOpen,
  onStopTrackingRef,
  discipline = 'welding',
  themeColor,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [internalGuideOpen, setInternalGuideOpen] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);

  const guideOpen = externalGuideOpen !== undefined ? externalGuideOpen : internalGuideOpen;
  const setGuideOpen = externalSetGuideOpen || setInternalGuideOpen;
  const resolvedThemeColor = themeColor || DISCIPLINE_THEME_COLORS[discipline] || '#F59E0B';
  const steps = normalizeArray(scene?.steps);
  const safeCurrentStep = steps.length ? Math.min(currentStep, steps.length - 1) : 0;
  const currentStepData = steps[safeCurrentStep];
  const overlays = normalizeArray(currentStepData?.overlays);
  const keyPoints = normalizeArray(currentStepData?.keyPoints);
  const stepTools = normalizeArray(currentStepData?.tools);
  const stepMaterials = normalizeArray(currentStepData?.ingredients);
  const setupTools = normalizeArray(scene?.setup?.requiredTools);
  const setupMaterials = normalizeArray(scene?.setup?.requiredIngredients);
  const tips = normalizeArray(scene?.tips);

  const teardownARSession = useCallback(() => {
    document.querySelectorAll('video').forEach((node) => {
      if (node.closest('#root') && !node.id?.includes('arjs')) return;
      const mediaStream = node.srcObject;
      if (typeof MediaStream !== 'undefined' && mediaStream instanceof MediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
      node.pause();
      node.srcObject = null;
      node.remove();
    });

    ['.arjs-loader', '#arjsDebugUIContainer', '.a-enter-vr', '.a-orientation-modal', '.a-loader-title', 'a-scene > canvas', '.a-canvas'].forEach((selector) => {
      document.querySelectorAll(selector).forEach((node) => {
        if (!node.closest('#root')) node.remove();
      });
    });

    document.querySelectorAll('style[data-href*="aframe"]').forEach((node) => node.remove());
    document.body.style.overflow = '';
    document.body.style.margin = '';
    document.body.style.padding = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.documentElement.style.overflow = '';
  }, []);

  useEffect(() => {
    setCurrentStep(0);
  }, [scene]);

  useEffect(() => {
    if (steps.length > 0 && currentStep >= steps.length) {
      setCurrentStep(steps.length - 1);
    }
  }, [currentStep, steps.length]);

  useEffect(() => {
    return () => teardownARSession();
  }, [teardownARSession]);

  useEffect(() => {
    if (onStopTrackingRef) {
      onStopTrackingRef.current = teardownARSession;
    }

    return () => {
      if (onStopTrackingRef) {
        onStopTrackingRef.current = null;
      }
    };
  }, [onStopTrackingRef, teardownARSession]);

  const sceneMarkup = useMemo(() => `
    <a-scene embedded vr-mode-ui="enabled: false" style="width: 100%; height: 100%;">
      <a-entity camera look-controls="enabled: false" position="0 0.05 0"></a-entity>
      <a-sky color="#1a1a2e"></a-sky>

      <a-entity position="0 0 -1.6">
        <a-plane position="0 -0.42 0" rotation="-90 0 0" width="3" height="2" color="#202334" material="shader: standard; roughness: 0.9"></a-plane>
        <a-box position="0 -0.36 -0.15" width="2.2" height="0.08" depth="1" color="#32384A" material="shader: standard; roughness: 0.75"></a-box>
        <a-box position="0 -0.31 0.36" width="2.24" height="0.025" depth="0.035" color="${resolvedThemeColor}" material="shader: standard; emissive: ${resolvedThemeColor}; emissiveIntensity: 0.25"></a-box>
        <a-box position="0 -0.3 -0.15" width="0.7" height="0.012" depth="0.42" color="${resolvedThemeColor}" material="opacity: 0.18; transparent: true; emissive: ${resolvedThemeColor}; emissiveIntensity: 0.35"></a-box>
      </a-entity>

      <a-entity position="0 0 -1.7">
        <a-box position="-1.15 0.15 -0.2" width="0.035" height="0.95" depth="0.035" color="#3A4158"></a-box>
        <a-box position="1.15 0.15 -0.2" width="0.035" height="0.95" depth="0.035" color="#3A4158"></a-box>
        <a-box position="0 0.62 -0.2" width="2.35" height="0.035" depth="0.035" color="#3A4158"></a-box>
      </a-entity>

      <a-entity position="-0.55 -0.42 -0.88" rotation="-28 0 24" animation="property: position; to: -0.55 -0.405 -0.88; dur: 1800; easing: easeInOutSine; loop: true; dir: alternate">
        <a-cylinder position="-0.08 -0.02 0" radius="0.055" height="0.56" color="${resolvedThemeColor}" rotation="0 0 82" material="shader: standard; roughness: 0.72"></a-cylinder>
        <a-sphere position="0.19 0.02 0" radius="0.068" scale="1.2 0.8 0.7" color="#F4A460" material="shader: standard; roughness: 0.82"></a-sphere>
        <a-cylinder position="0.25 0.035 -0.02" radius="0.018" height="0.14" color="#F4A460" rotation="0 0 78"></a-cylinder>
        <a-cylinder position="0.25 0.005 0.025" radius="0.016" height="0.12" color="#F4A460" rotation="0 0 76"></a-cylinder>
      </a-entity>

      <a-entity position="0.55 -0.42 -0.88" rotation="-28 0 -24" animation="property: position; to: 0.55 -0.405 -0.88; dur: 1900; easing: easeInOutSine; loop: true; dir: alternate">
        <a-cylinder position="0.08 -0.02 0" radius="0.055" height="0.56" color="${resolvedThemeColor}" rotation="0 0 -82" material="shader: standard; roughness: 0.72"></a-cylinder>
        <a-sphere position="-0.19 0.02 0" radius="0.068" scale="1.2 0.8 0.7" color="#F4A460" material="shader: standard; roughness: 0.82"></a-sphere>
        <a-cylinder position="-0.25 0.035 -0.02" radius="0.018" height="0.14" color="#F4A460" rotation="0 0 -78"></a-cylinder>
        <a-cylinder position="-0.25 0.005 0.025" radius="0.016" height="0.12" color="#F4A460" rotation="0 0 -76"></a-cylinder>
      </a-entity>

      <a-entity position="0 0 -1.45">
        <a-sphere position="-0.55 0.35 -0.05" radius="0.012" color="${resolvedThemeColor}" material="emissive: ${resolvedThemeColor}; emissiveIntensity: 0.65" animation="property: position; to: -0.55 0.55 -0.05; dur: 2800; easing: easeInOutSine; loop: true; dir: alternate"></a-sphere>
        <a-sphere position="0.48 0.28 0.05" radius="0.009" color="#94A3B8" material="emissive: #94A3B8; emissiveIntensity: 0.45" animation="property: position; to: 0.48 0.48 0.05; dur: 3200; easing: easeInOutSine; loop: true; dir: alternate"></a-sphere>
      </a-entity>

      <a-light type="ambient" color="#FFFFFF" intensity="0.48"></a-light>
      <a-light type="directional" color="#FFFFFF" intensity="0.62" position="-1 2 1"></a-light>
      <a-light type="point" color="${resolvedThemeColor}" intensity="0.26" position="0 0.4 -1.1" distance="2.5"></a-light>
    </a-scene>
  `, [resolvedThemeColor]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((step) => step + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    setCurrentStep((step) => Math.max(0, step - 1));
  };

  const renderOverlay = (overlay: AROverlay, index: number) => {
    const color = overlay.color || resolvedThemeColor;
    const positionStyle = getPositionStyle(overlay.position);
    const sizeClass = SIZE_CLASSES[(overlay.size || 'medium').toLowerCase()] || SIZE_CLASSES.medium;
    const label = overlay.label || '';
    const baseClass = `absolute pointer-events-none ${sizeClass}`;
    const key = `${overlay.type}-${overlay.position || 'center'}-${index}`;

    switch ((overlay.type || '').toLowerCase()) {
      case 'line':
        return (
          <div key={key} className={baseClass} style={positionStyle}>
            <svg width="240" height="120" viewBox="0 0 240 120" style={{ transform: `rotate(${overlay.angle || 0}deg)` }}>
              <line x1="30" y1="60" x2="210" y2="60" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray="14 8" />
              <circle cx="30" cy="60" r="7" fill={color} />
              <circle cx="210" cy="60" r="7" fill={color} />
            </svg>
            {label && <div className="mt-1 rounded-full bg-black/70 px-3 py-1 text-center text-xs font-bold text-white shadow-lg">{label}</div>}
          </div>
        );
      case 'arrow':
        return (
          <div key={key} className={baseClass} style={positionStyle}>
            <div className="ar-hud-arrow">
              <svg width="180" height="90" viewBox="0 0 180 90" style={{ transform: `rotate(${overlay.angle || 0}deg)` }}>
              <defs>
                <marker id={`arrowhead-${index}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill={color} />
                </marker>
              </defs>
              <path d="M20 45 C65 15, 110 15, 160 45" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" markerEnd={`url(#arrowhead-${index})`} />
              </svg>
              {label && <div className="rounded-full bg-black/70 px-3 py-1 text-center text-xs font-bold text-white shadow-lg">{label}</div>}
            </div>
          </div>
        );
      case 'text':
        return (
          <div key={key} className={`${baseClass} max-w-[220px] rounded-xl border px-4 py-2 text-center text-sm font-bold text-white shadow-2xl backdrop-blur`} style={{ ...positionStyle, borderColor: color, backgroundColor: `${color}DD` }}>
            {label || 'Step note'}
          </div>
        );
      case 'circle':
        return (
          <div key={key} className={baseClass} style={positionStyle}>
            <div className="ar-hud-pulse flex h-32 w-32 items-center justify-center rounded-full border-4 bg-white/5 shadow-2xl" style={{ borderColor: color, boxShadow: `0 0 28px ${color}` }}>
              {label && <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white">{label}</span>}
            </div>
          </div>
        );
      case 'grid':
        return (
          <div key={key} className={`${baseClass} h-44 w-64 rounded-lg border-2 bg-black/10 backdrop-blur-[1px]`} style={{ ...positionStyle, borderColor: color, backgroundImage: `linear-gradient(${color}55 1px, transparent 1px), linear-gradient(90deg, ${color}55 1px, transparent 1px)`, backgroundSize: '24px 24px' }}>
            {label && <div className="m-2 inline-block rounded bg-black/70 px-2 py-1 text-xs font-bold text-white">{label}</div>}
          </div>
        );
      case 'hand':
        return (
          <div key={key} className={`${baseClass} flex flex-col items-center gap-1 text-white`} style={positionStyle}>
            <div className="ar-hud-pulse">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 bg-black/40 text-4xl shadow-2xl" style={{ borderColor: color }}>✋</div>
            </div>
            <div className="rounded-full bg-black/70 px-3 py-1 text-xs font-bold">{label || 'Hand position'}</div>
          </div>
        );
      case 'tool':
        return (
          <div key={key} className={`${baseClass} rounded-xl border-2 bg-slate-950/80 px-4 py-3 text-center text-white shadow-2xl backdrop-blur`} style={{ ...positionStyle, borderColor: color }}>
            <div className="text-2xl">🛠️</div>
            <div className="text-xs font-bold uppercase tracking-wide" style={{ color }}>Tool</div>
            <div className="text-sm font-semibold">{label || stepTools[0] || 'Required item'}</div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!steps.length) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-950 p-6 text-center text-white">
        <div className="max-w-md rounded-2xl border border-amber-400/50 bg-slate-900/90 p-5 shadow-2xl">
          <div className="mb-3 text-4xl">🧭</div>
          <h3 className="mb-2 text-lg font-bold">Practice scene needs steps</h3>
          <p className="text-sm text-slate-300">This generated lesson did not include step data yet. Try regenerating the AR practice or selecting another lesson.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950 text-white">
      <style>{`
        @keyframes arHudArrowDrift { 0% { opacity: .55; transform: translateX(-8px); } 100% { opacity: 1; transform: translateX(8px); } }
        @keyframes arHudPulse { 0% { opacity: .55; transform: scale(.96); } 100% { opacity: 1; transform: scale(1.04); } }
        .ar-hud-arrow { animation: arHudArrowDrift 900ms ease-in-out infinite alternate; }
        .ar-hud-pulse { animation: arHudPulse 1100ms ease-in-out infinite alternate; }
      `}</style>

      <div ref={sceneRef} className="h-full w-full" dangerouslySetInnerHTML={{ __html: sceneMarkup }} />

      <div className="absolute inset-0 pointer-events-none">
        {overlays.map(renderOverlay)}
      </div>

      <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-3 pointer-events-none">
        <div className="max-w-[65%] rounded-xl border border-white/10 bg-black/55 px-3 py-2 shadow-xl backdrop-blur">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: resolvedThemeColor }}>{discipline} first-person practice</div>
          <div className="truncate text-sm font-bold">{scene?.lesson || 'Generated practice lesson'}</div>
          {scene?.setup?.workspace && <div className="mt-1 line-clamp-2 text-[11px] text-slate-200">{scene.setup.workspace}</div>}
        </div>
        <div className="rounded-full bg-black/55 px-3 py-2 text-xs font-bold shadow-xl backdrop-blur">
          Step {safeCurrentStep + 1} / {steps.length}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/85 to-transparent p-3 pt-16">
        <div className="rounded-2xl border border-white/10 bg-slate-950/86 p-4 shadow-2xl backdrop-blur">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Instruction</div>
              <h3 className="text-base font-bold leading-snug text-white">{currentStepData.instruction || 'Follow the current practice step.'}</h3>
            </div>
            {currentStepData.duration && <span className="shrink-0 rounded-full px-3 py-1 text-xs font-bold text-slate-950" style={{ backgroundColor: resolvedThemeColor }}>{currentStepData.duration}</span>}
          </div>

          {keyPoints.length > 0 && (
            <div className="mb-3 grid gap-1 sm:grid-cols-2">
              {keyPoints.slice(0, 4).map((point, index) => (
                <div key={`${point}-${index}`} className="flex items-start gap-2 text-xs text-slate-200">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: resolvedThemeColor }} />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mb-3 flex flex-wrap gap-2 text-[11px] text-slate-200">
            {[...stepTools, ...setupTools].slice(0, 4).map((tool, index) => (
              <span key={`tool-${tool}-${index}`} className="rounded-full border border-white/10 bg-white/10 px-2 py-1">🛠️ {tool}</span>
            ))}
            {[...stepMaterials, ...setupMaterials].slice(0, 4).map((item, index) => (
              <span key={`material-${item}-${index}`} className="rounded-full border border-white/10 bg-white/10 px-2 py-1">📦 {item}</span>
            ))}
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <button onClick={prevStep} disabled={currentStep === 0} className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40">
              ← Prev
            </button>
            <button onClick={nextStep} className="flex-1 rounded-lg px-4 py-2 text-xs font-bold text-slate-950 transition brightness-100 hover:brightness-110" style={{ backgroundColor: resolvedThemeColor }}>
              {safeCurrentStep === steps.length - 1 ? 'Complete Practice' : 'Next Step →'}
            </button>
            <button onClick={() => setGuideOpen(!guideOpen)} className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/20">
              {guideOpen ? 'Close Guide' : 'Guide'}
            </button>
          </div>
        </div>
      </div>

      {guideOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-4 pointer-events-auto">
          <div className="max-h-[86%] w-full max-w-lg overflow-y-auto rounded-2xl border-2 bg-white p-5 text-slate-900 shadow-2xl" style={{ borderColor: resolvedThemeColor }}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold">Practice Guide</h3>
              <button onClick={() => setGuideOpen(false)} className="text-2xl font-bold text-slate-500 hover:text-slate-900">×</button>
            </div>
            {scene?.setup?.workspace && (
              <div className="mb-4 rounded-lg bg-slate-100 p-3">
                <div className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Workspace</div>
                <p className="text-sm">{scene?.setup?.workspace}</p>
              </div>
            )}
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={step.id || index} className="rounded-lg border-l-4 bg-slate-50 p-3" style={{ borderLeftColor: index === safeCurrentStep ? resolvedThemeColor : '#CBD5E1' }}>
                  <div className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Step {index + 1}{step.duration ? ` · ${step.duration}` : ''}</div>
                  <p className="text-sm font-semibold">{step.instruction}</p>
                </div>
              ))}
            </div>
            {tips.length > 0 && (
              <div className="mt-4 rounded-lg bg-slate-900 p-3 text-white">
                <div className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: resolvedThemeColor }}>Tips</div>
                <ul className="list-disc space-y-1 pl-4 text-sm">
                  {tips.map((tip, index) => <li key={`${tip}-${index}`}>{tip}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GenericFirstPersonARScene;
