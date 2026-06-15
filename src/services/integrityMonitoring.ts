import { supabase } from '../disciplines/culinary/api/supabaseClient';

export interface IntegrityAlert {
  id: string;
  user_id: string;
  discipline: string;
  alert_type: 'fast_completion' | 'plagiarism' | 'activity_anomaly';
  severity: 'low' | 'medium' | 'high';
  description: string;
  metadata: any;
  reviewed: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
}

export interface CompletionTracking {
  user_id: string;
  discipline: string;
  module_type: string;
  module_id: string;
  started_at: string;
  completed_at: string;
}

export interface TextSubmission {
  user_id: string;
  discipline: string;
  assignment_id: string;
  assignment_title: string;
  submission_text: string;
  word_count: number;
}

export interface UserActivity {
  user_id: string;
  activity_type: string;
  discipline?: string;
  metadata?: any;
  ip_address?: string;
  user_agent?: string;
}

const VALID_ALERT_TYPES = new Set<IntegrityAlert['alert_type']>([
  'fast_completion',
  'plagiarism',
  'activity_anomaly'
]);

const VALID_ALERT_SEVERITIES = new Set<IntegrityAlert['severity']>([
  'low',
  'medium',
  'high'
]);

function sanitizeJson(value: any): any {
  if (value === undefined) return null;

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

// Track module completion
export async function trackCompletion(data: CompletionTracking): Promise<void> {
  try {
    const { error } = await supabase
      .from('completion_tracking')
      .insert(data);

    if (error) throw error;

    // Check for suspicious completion patterns
    await checkCompletionPatterns(data.user_id, data.discipline);
  } catch (error) {
    console.error('Error tracking completion:', error);
  }
}

// Check for unusually fast completions
async function checkCompletionPatterns(userId: string, discipline: string): Promise<void> {
  try {
    // Get recent completions in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: recentCompletions, error } = await supabase
      .from('completion_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('discipline', discipline)
      .gte('completed_at', oneHourAgo)
      .order('completed_at', { ascending: false });

    if (error) throw error;

    if (!recentCompletions || recentCompletions.length === 0) return;

    // Flag 1: More than 10 completions in 1 hour
    if (recentCompletions.length > 10) {
      await createIntegrityAlert({
        user_id: userId,
        discipline,
        alert_type: 'fast_completion',
        severity: 'medium',
        description: `Completed ${recentCompletions.length} modules in the last hour`,
        metadata: {
          completion_count: recentCompletions.length,
          time_window: '1 hour',
          modules: recentCompletions.map(c => c.module_id)
        }
      });
    }

    // Flag 2: Average completion time less than 30 seconds
    const avgDuration = recentCompletions.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / recentCompletions.length;
    if (avgDuration < 30 && recentCompletions.length >= 5) {
      await createIntegrityAlert({
        user_id: userId,
        discipline,
        alert_type: 'fast_completion',
        severity: 'high',
        description: `Average completion time of ${Math.round(avgDuration)} seconds (suspiciously fast)`,
        metadata: {
          avg_duration_seconds: avgDuration,
          completion_count: recentCompletions.length,
          threshold: 30
        }
      });
    }

    // Flag 3: Completing modules in exact same duration (bot-like behavior)
    const durations = recentCompletions.map(c => c.duration_seconds || 0);
    const uniqueDurations = new Set(durations);
    if (durations.length >= 5 && uniqueDurations.size === 1) {
      await createIntegrityAlert({
        user_id: userId,
        discipline,
        alert_type: 'activity_anomaly',
        severity: 'high',
        description: `All recent completions have identical duration (${durations[0]}s) - possible bot activity`,
        metadata: {
          duration_seconds: durations[0],
          completion_count: durations.length
        }
      });
    }
  } catch (error) {
    console.error('Error checking completion patterns:', error);
  }
}

// Submit text for plagiarism checking
export async function submitText(data: TextSubmission): Promise<void> {
  try {
    const { data: submission, error } = await supabase
      .from('text_submissions')
      .insert({
        ...data,
        plagiarism_checked: false
      })
      .select()
      .single();

    if (error) throw error;

    // Run plagiarism check
    if (submission) {
      await checkPlagiarism(submission.id, data.user_id, data.assignment_id, data.submission_text, data.discipline);
    }
  } catch (error) {
    console.error('Error submitting text:', error);
  }
}

// Simple plagiarism detection using text similarity
async function checkPlagiarism(
  submissionId: string,
  userId: string,
  assignmentId: string,
  submissionText: string,
  discipline: string
): Promise<void> {
  try {
    // Get all other submissions for the same assignment
    const { data: otherSubmissions, error } = await supabase
      .from('text_submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('discipline', discipline)
      .neq('user_id', userId);

    if (error) throw error;
    if (!otherSubmissions || otherSubmissions.length === 0) {
      // Mark as checked with no issues
      await supabase
        .from('text_submissions')
        .update({ plagiarism_checked: true, plagiarism_score: 0 })
        .eq('id', submissionId);
      return;
    }

    // Calculate similarity scores
    const similarities: Array<{ user_id: string; similarity_score: number }> = [];
    let maxSimilarity = 0;

    for (const other of otherSubmissions) {
      const similarity = calculateTextSimilarity(submissionText, other.submission_text);
      similarities.push({
        user_id: other.user_id,
        similarity_score: similarity
      });
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    // Update submission with plagiarism score
    await supabase
      .from('text_submissions')
      .update({
        plagiarism_checked: true,
        plagiarism_score: maxSimilarity,
        similar_submissions: similarities.filter(s => s.similarity_score > 50)
      })
      .eq('id', submissionId);

    // Create alert if high similarity detected
    if (maxSimilarity > 70) {
      const topMatch = similarities.find(s => s.similarity_score === maxSimilarity);
      await createIntegrityAlert({
        user_id: userId,
        discipline,
        alert_type: 'plagiarism',
        severity: maxSimilarity > 90 ? 'high' : 'medium',
        description: `${Math.round(maxSimilarity)}% similarity detected with another student's submission`,
        metadata: {
          assignment_id: assignmentId,
          similarity_score: maxSimilarity,
          similar_to_user: topMatch?.user_id,
          all_similarities: similarities.filter(s => s.similarity_score > 50)
        }
      });
    }
  } catch (error) {
    console.error('Error checking plagiarism:', error);
  }
}

// Simple text similarity calculation (Jaccard similarity on words)
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3));

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  if (union.size === 0) return 0;
  return (intersection.size / union.size) * 100;
}

// Log user activity
export async function logActivity(data: UserActivity): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_activity_log')
      .insert(data);

    if (error) throw error;

    // Check for activity anomalies
    if (data.activity_type === 'login') {
      await checkActivityAnomalies(data.user_id);
    }
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

// Check for suspicious activity patterns
async function checkActivityAnomalies(userId: string): Promise<void> {
  try {
    // Check for multiple logins in short time
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: recentLogins, error } = await supabase
      .from('user_activity_log')
      .select('*')
      .eq('user_id', userId)
      .eq('activity_type', 'login')
      .gte('created_at', fiveMinutesAgo);

    if (error) throw error;

    if (recentLogins && recentLogins.length > 5) {
      await createIntegrityAlert({
        user_id: userId,
        discipline: 'system',
        alert_type: 'activity_anomaly',
        severity: 'medium',
        description: `${recentLogins.length} login attempts in 5 minutes`,
        metadata: {
          login_count: recentLogins.length,
          time_window: '5 minutes',
          ip_addresses: [...new Set(recentLogins.map(l => l.ip_address))]
        }
      });
    }

    // Check for logins from multiple IPs in short time
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: hourlyLogins, error: hourlyError } = await supabase
      .from('user_activity_log')
      .select('ip_address')
      .eq('user_id', userId)
      .eq('activity_type', 'login')
      .gte('created_at', oneHourAgo);

    if (hourlyError) throw hourlyError;

    if (hourlyLogins) {
      const uniqueIPs = new Set(hourlyLogins.map(l => l.ip_address).filter(ip => ip));
      if (uniqueIPs.size > 3) {
        await createIntegrityAlert({
          user_id: userId,
          discipline: 'system',
          alert_type: 'activity_anomaly',
          severity: 'high',
          description: `Logged in from ${uniqueIPs.size} different IP addresses in the last hour`,
          metadata: {
            ip_count: uniqueIPs.size,
            time_window: '1 hour',
            ip_addresses: Array.from(uniqueIPs)
          }
        });
      }
    }
  } catch (error) {
    console.error('Error checking activity anomalies:', error);
  }
}

// Create an integrity alert
async function createIntegrityAlert(data: Omit<IntegrityAlert, 'id' | 'reviewed' | 'created_at'>): Promise<void> {
  try {
    // Do not pre-query integrity_alerts here. On older Supabase schemas that
    // duplicate-check SELECT was the failing 400 shown in the browser console.
    // Alerts are monitoring-only, so one direct sanitized insert is safer than
    // an extra read that can fail before the write is attempted.

    if (!VALID_ALERT_TYPES.has(data.alert_type) || !VALID_ALERT_SEVERITIES.has(data.severity)) {
      console.warn('Skipping invalid integrity alert payload:', {
        alert_type: data.alert_type,
        severity: data.severity
      });
      return;
    }

    const alertPayload = {
      user_id: data.user_id,
      discipline: data.discipline || null,
      alert_type: data.alert_type,
      severity: data.severity,
      description: data.description,
      metadata: sanitizeJson(data.metadata),
      reviewed: false
    };

    const { error } = await supabase
      .from('integrity_alerts')
      .insert(alertPayload);

    if (error) throw error;
  } catch (error) {
    console.error('Error creating integrity alert:', error);
  }
}

// Get all integrity alerts (admin only)
export async function getIntegrityAlerts(
  discipline?: string,
  reviewed?: boolean
): Promise<IntegrityAlert[]> {
  try {
    let query = supabase
      .from('integrity_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (discipline && discipline !== 'total') {
      query = query.eq('discipline', discipline);
    }

    if (reviewed !== undefined) {
      query = query.eq('reviewed', reviewed);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting integrity alerts:', error);
    return [];
  }
}

// Review an integrity alert (admin only)
export async function reviewIntegrityAlert(
  alertId: string,
  reviewedBy: string,
  reviewNotes: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('integrity_alerts')
      .update({
        reviewed: true,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes
      })
      .eq('id', alertId);

    if (error) throw error;
  } catch (error) {
    console.error('Error reviewing integrity alert:', error);
    throw error;
  }
}
