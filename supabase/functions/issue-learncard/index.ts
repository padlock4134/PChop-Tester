import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { initLearnCard } from 'npm:@learncard/init@1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { recipientHandle, skillName, discipline, evidenceUrl } = await req.json();

    if (!recipientHandle || !skillName || !evidenceUrl) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const seed = Deno.env.get('LEARNCARD_SEED');
    if (!seed) {
      return new Response(JSON.stringify({ error: 'Issuer not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const learnCard = await initLearnCard({ seed, network: true });

    const cleanHandle = recipientHandle.replace(/^@/, '');

    const unsignedVc = learnCard.invoke.newCredential({
      type: ['VerifiableCredential', 'OpenBadgeCredential'],
      name: skillName,
      description: `Proof of skill in ${discipline} — verified by PorkChop`,
      credentialSubject: {
        id: `did:web:learncard.app:api:profile:${cleanHandle}`,
        achievement: {
          achievementType: 'Skill',
          name: skillName,
          description: `Demonstrated skill in ${discipline}`,
        },
        evidence: [
          {
            id: evidenceUrl,
            type: ['Evidence'],
            name: 'Proof-of-Work Video',
            description: `Video evidence recorded on PorkChop`,
          },
        ],
      },
      image: 'https://pchop.app/logo.png',
    });

    const signedVc = await learnCard.invoke.issueCredential(unsignedVc);
    await learnCard.invoke.sendCredential(cleanHandle, signedVc);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
