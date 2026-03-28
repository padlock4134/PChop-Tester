import React, { useEffect, useState } from 'react';
import { getVideoQueriesForRecipe } from './MySpecBook';
import { getTutorialVideo, TutorialVideoResult } from '../utils/videoSearch';

import type { Recipe } from './MySpecBook';

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
    const queries = getVideoQueriesForRecipe(recipe);
    Promise.all(queries.map((q: string) => getTutorialVideo(q)))
      .then(results => setVideoUrls(results.map((r: TutorialVideoResult | undefined) => r?.url || null)))
      .finally(() => setLoading(false));
  }, [open, recipe]);

  return (
    <div>
      {loading && <div>Loading videos...</div>}
      {!loading && videoUrls.map((url, idx) => (
        <div key={idx} style={{ marginBottom: 24 }}>
          <h3>{idx === 0 ? `How to complete ${recipe.name}` : `How to prepare primary material`}</h3>
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

