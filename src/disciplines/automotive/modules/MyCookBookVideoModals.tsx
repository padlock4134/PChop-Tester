import React, { useEffect, useState } from 'react';
import { getVideoQueriesForProcedure } from './MyManual';
import { getTutorialVideo, TutorialVideoResult } from '../utils/videoSearch';

import type { Procedure } from './MyManual';

interface Props {
  procedure: Procedure;
  open: boolean;
  onClose: () => void;
}

const MyManualVideoModals: React.FC<Props> = ({ procedure, open, onClose }) => {
  const [videoUrls, setVideoUrls] = useState<(string | null)[]>([null, null]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const queries = getVideoQueriesForProcedure(procedure);
    Promise.all(queries.map((q: string) => getTutorialVideo(q)))
      .then(results => setVideoUrls(results.map((r: TutorialVideoResult | undefined) => r?.url || null)))
      .finally(() => setLoading(false));
  }, [open, procedure]);

  return (
    <div>
      {loading && <div>Loading videos...</div>}
      {!loading && videoUrls.map((url, idx) => (
        <div key={idx} style={{ marginBottom: 24 }}>
          <h3>{idx === 0 ? `How to complete ${procedure.name}` : `How to prepare primary parts`}</h3>
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

export default MyManualVideoModals;

