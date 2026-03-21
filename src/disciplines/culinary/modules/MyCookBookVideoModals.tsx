import React, { useEffect, useState } from 'react';
import { getTutorialVideo, TutorialVideoResult } from '../utils/videoSearch';

import type { Recipe } from './MyCookBook';

interface Props {
  recipe: Recipe;
  open: boolean;
  onClose: () => void;
}

const MyCookBookVideoModals: React.FC<Props> = ({ recipe, open, onClose }) => {
  const [videoUrls, setVideoUrls] = useState<(string | null)[]>([null, null]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    // Simple fallback implementation - create queries based on recipe name
    const queries = [
      `how to make ${recipe.name}`,
      `how to prepare ${recipe.ingredients?.[0] || 'main ingredient'}`
    ];
    Promise.all(queries.map((q: string) => getTutorialVideo(q)))
      .then((results: any[]) => setVideoUrls(results.map((r: any) => r?.url || null)))
      .finally(() => setLoading(false));
  }, [open, recipe]);

  return (
    <div>
      {loading && <div>Loading videos...</div>}
      {!loading && videoUrls.map((url, idx) => (
        <div key={idx} style={{ marginBottom: 24 }}>
          <h3>{idx === 0 ? `How to make ${recipe.name}` : `How to prepare main ingredient`}</h3>
          {url ? (
            <iframe
              width="100%"
              height="315"
              src={url}
              title={`Tutorial Video ${idx + 1}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div>No video found.</div>
          )}
        </div>
      ))}
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default MyCookBookVideoModals;
