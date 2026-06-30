export interface LearnCardCredentialParams {
  recipientHandle: string;
  skillName: string;
  discipline: string;
  evidenceUrl: string;
}

export const issueLearnCardCredential = async (params: LearnCardCredentialParams): Promise<boolean> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

    const response = await fetch(`${supabaseUrl}/functions/v1/issue-learncard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(params),
    });

    return response.ok;
  } catch {
    return false;
  }
};
