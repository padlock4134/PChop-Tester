// Anthropic Claude Haiku API integration for Jake the Welder
import { supabase } from './supabaseClient';
import { isSessionValid } from './userSession';

export async function askChefFreddie(userId: string, prompt: string): Promise<string> {
  // --- Chat limit logic ---
  const isValid = await isSessionValid();
  if (!userId || !isValid) {
    return 'Error: User not authenticated. Please sign in again.';
  }
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('chat_count, last_chat_date')
    .eq('id', userId)
    .single();
  if (error || !profile) {
    return 'Error fetching user profile. Please try again.';
  }
  const today = new Date().toISOString().slice(0, 10);
  let chatCount = profile.chat_count || 0;
  let lastChatDate = profile.last_chat_date ? profile.last_chat_date.toString().slice(0, 10) : null;
  if (lastChatDate === today) {
    if (chatCount >= 15) {
      return 'You have reached your daily limit of 15 chats. Please come back tomorrow!';
    }
    await supabase.from('profiles').update({ chat_count: chatCount + 1 }).eq('id', userId);
  } else {
    await supabase.from('profiles').update({ chat_count: 1, last_chat_date: today }).eq('id', userId);
  }
  // --- End chat limit logic ---

  const systemPrompt = `You are Jake the Welder, a friendly and knowledgeable AI welding assistant for the PorkChop platform.
  You help users with welding processes (MIG, TIG, Stick, Flux-Core), filler metal selection, joint design, and weld defect troubleshooting.
  You know about blueprint reading, AWS codes, WPS/PQR, heat input, shielding gas, and welding certifications.
  When discussing jobs, you always mention the filler metals, base metals, and processes needed.
  Keep responses friendly but concise.`;
  // Use Netlify proxy for Anthropic API (no direct key in frontend)
  const response = await fetch('/.netlify/functions/anthropic-proxy', {
    method: 'POST',
    headers: {
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      apiKeyIdentifier: 'chef',
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{ role: 'user', content: `You are Jake the Welder, a friendly and knowledgeable AI welding assistant. Help me with: ${prompt}` }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${errorText}`);
  }

  const data = await response.json();
  // Claude API returns an array of content blocks
  const responseText = data.content?.[0]?.text || 'Sorry, I could not generate a response.';
  
  // Log conversation for admin analytics
  try {
    await supabase.from('chat_logs').insert({
      user_id: userId,
      prompt: prompt,
      response: responseText
    });
  } catch (logError) {
    console.error('Failed to log chat:', logError);
    // Don't fail the request if logging fails
  }
  
  return responseText;
}
