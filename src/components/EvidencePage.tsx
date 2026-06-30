import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const anonSupabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
);

interface SkillClaim {
  id: string;
  discipline: string;
  skill_name: string;
  video_url: string | null;
  video_name: string | null;
  notes: string | null;
  destination: string;
  verified: boolean;
  created_at: string;
}

const DISCIPLINE_LABELS: Record<string, string> = {
  automotive: '🔧 Automotive',
  culinary: '🍳 Culinary',
  construction: '🏗️ Construction',
  electrical: '⚡ Electrical',
  hvac: '❄️ HVAC',
  manufacturing: '🏭 Manufacturing',
  logistics: '📦 Logistics',
  plumbing: '🔩 Plumbing',
  welding: '🔥 Welding',
};

const DESTINATION_LABELS: Record<string, string> = {
  credivera: 'Credivera',
  iq4: 'IQ4',
  velocity: 'Velocity',
  territorium: 'Territorium',
  learncard: 'LearnCard',
  government: 'Government',
};

const EvidencePage = () => {
  const { id } = useParams<{ id: string }>();
  const [claim, setClaim] = useState<SkillClaim | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchClaim = async () => {
      const { data, error } = await anonSupabase
        .from('skill_claims')
        .select('id, discipline, skill_name, video_url, video_name, notes, destination, verified, created_at')
        .eq('id', id)
        .eq('is_public', true)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setClaim(data as SkillClaim);
      }
      setLoading(false);
    };
    fetchClaim();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-blue-800 text-xl font-semibold">Loading evidence...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Evidence Not Found</h1>
          <p className="text-gray-500">This evidence is either private or doesn't exist.</p>
        </div>
      </div>
    );
  }

  const c = claim!;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header bar */}
        <div className="bg-blue-900 text-white rounded-t-xl px-6 py-4 flex items-center gap-3">
          <span className="text-3xl">💼</span>
          <div>
            <div className="text-xs font-bold opacity-60 uppercase tracking-widest mb-0.5">PChop · Skills Evidence</div>
            <h1 className="text-2xl font-bold leading-tight">{c.skill_name}</h1>
          </div>
        </div>

        {/* Body card */}
        <div className="bg-white border-x-4 border-b-4 border-blue-900 rounded-b-xl p-6 space-y-6">

          {/* Tags row */}
          <div className="flex flex-wrap gap-2">
            <span className="bg-teal-100 text-teal-800 text-sm font-bold px-3 py-1 rounded-full">
              {DISCIPLINE_LABELS[c.discipline] || c.discipline}
            </span>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${c.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {c.verified ? '✅ Instructor Verified' : '⏳ Pending Verification'}
            </span>
            <span className="bg-gray-100 text-gray-500 text-sm px-3 py-1 rounded-full">
              {new Date(c.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            {c.destination && (
              <span className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full font-medium">
                Submitted to {DESTINATION_LABELS[c.destination] || c.destination}
              </span>
            )}
          </div>

          {/* Video */}
          {c.video_url ? (
            <div>
              <h2 className="text-sm font-bold text-blue-900 mb-2 uppercase tracking-wide">🎥 Proof of Work</h2>
              <video
                src={c.video_url}
                controls
                className="w-full rounded-lg border-2 border-gray-200 bg-black"
                style={{ maxHeight: '420px' }}
              >
                Your browser does not support video playback.
              </video>
              {c.video_name && (
                <p className="text-xs text-gray-400 mt-1">{c.video_name.replace('.webm', '')}</p>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-400 text-sm border-2 border-dashed border-gray-200">
              No video evidence attached to this claim.
            </div>
          )}

          {/* Notes */}
          {c.notes && (
            <div>
              <h2 className="text-sm font-bold text-blue-900 mb-1 uppercase tracking-wide">Notes</h2>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-200 leading-relaxed">{c.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-100 pt-4 text-center">
            <p className="text-xs text-gray-400">
              Issued by <span className="font-bold text-blue-900">PChop</span> — Trades & Technical Skills Platform
            </p>
            <p className="text-xs text-gray-300 mt-0.5">Claim ID: {c.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvidencePage;
