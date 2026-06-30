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
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const timeout = setTimeout(() => {
      setNotFound(true);
      setLoading(false);
    }, 6000);

    const fetchClaim = async () => {
      try {
        const { data, error } = await anonSupabase
          .from('skill_claims')
          .select('id, discipline, skill_name, video_url, video_name, notes, destination, verified, created_at')
          .eq('id', id)
          .eq('is_public', true)
          .single();
        clearTimeout(timeout);
        if (error || !data) {
          setNotFound(true);
        } else {
          setClaim(data as SkillClaim);
        }
      } catch {
        clearTimeout(timeout);
        setNotFound(true);
      }
      setLoading(false);
    };

    fetchClaim();
    return () => clearTimeout(timeout);
  }, [id]);

  if (loading) {
    return <div className="min-h-screen" style={{ background: '#0a1628' }} />;
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#0a1628' }}>
        {/* Nav bar */}
        <div className="px-6 py-6 flex flex-col items-center justify-center gap-2 border-b border-gray-200 bg-white">
          <img src="/logo.png" alt="PorkChop" className="h-12 w-12 object-contain" />
          <span className="font-retro font-bold text-black text-2xl tracking-wide">PorkChop</span>
          <span className="text-xs text-seafoam font-bold uppercase tracking-widest opacity-70">Skills Evidence</span>
        </div>

        {/* Empty state */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="text-6xl mb-6">🎥</div>
          <h1 className="font-retro font-bold text-white text-2xl mb-3">No Evidence Found</h1>
          <p className="text-white text-opacity-50 text-sm max-w-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            This evidence link is private, expired, or doesn't exist yet.
          </p>
          <div className="mt-8 border border-white border-opacity-10 rounded-xl px-6 py-4 max-w-xs w-full text-left">
            <p className="text-xs font-bold text-seafoam uppercase tracking-widest mb-2">What is this?</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              PorkChop learners share proof-of-work videos with third-party skills wallets using a private evidence link. If you received this link, the learner may need to make it public.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 text-center">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Powered by <span className="font-bold">PorkChop</span> — Trades & Technical Skills Platform</p>
        </div>
      </div>
    );
  }

  const c = claim!;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a1628' }}>
      {/* Nav bar */}
      <div className="px-6 py-6 flex flex-col items-center justify-center gap-2 border-b border-gray-200 bg-white">
        <img src="/logo.png" alt="PorkChop" className="h-12 w-12 object-contain" />
        <span className="font-retro font-bold text-black text-2xl tracking-wide">PorkChop</span>
        <span className="text-xs text-seafoam font-bold uppercase tracking-widest opacity-70">Skills Evidence</span>
      </div>

      <div className="flex-1 px-4 py-8">
        <div className="max-w-xl mx-auto">

          {/* Skill header */}
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Proof of Work</p>
            <h1 className="font-retro font-bold text-white text-3xl leading-tight">{c.skill_name}</h1>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="bg-seafoam text-maineBlue text-xs font-bold px-3 py-1 rounded-full">
              {DISCIPLINE_LABELS[c.discipline] || c.discipline}
            </span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              c.verified
                ? 'bg-green-400 text-green-900'
                : 'bg-yellow-400 text-yellow-900'
            }`}>
              {c.verified ? '✅ Instructor Verified' : '⏳ Pending Verification'}
            </span>
            <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
              {new Date(c.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            {c.destination && (
              <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                → {DESTINATION_LABELS[c.destination] || c.destination}
              </span>
            )}
          </div>

          {/* Video */}
          {c.video_url ? (
            <div className="mb-6">
              <video
                src={c.video_url}
                controls
                className="w-full rounded-xl bg-black"
                style={{ maxHeight: '420px', border: '2px solid rgba(255,255,255,0.1)' }}
              >
                Your browser does not support video playback.
              </video>
              {c.video_name && (
                <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>{c.video_name.replace('.webm', '')}</p>
              )}
            </div>
          ) : (
            <div className="rounded-xl p-8 text-center mb-6" style={{ border: '2px dashed rgba(255,255,255,0.15)' }}>
              <div className="text-4xl mb-2">🎥</div>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>No video attached to this claim.</p>
            </div>
          )}

          {/* Notes */}
          {c.notes && (
            <div className="rounded-xl p-4 mb-6" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-xs font-bold uppercase tracking-widest text-seafoam mb-2">Notes</p>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{c.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center pt-4">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Issued by <span className="font-bold text-white">PorkChop</span> — Trades & Technical Skills Platform
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.15)' }}>ID: {c.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvidencePage;
