// Shapes produced by the interview engine's evaluation (see asparagus
// interviews.analysis). Every field is optional because older engine builds
// omit some of them.

export interface ParameterScore {
  key?: string;
  label: string;
  score: number;
  weight?: number;
  verdict?: string;
  evidence?: string;
}

export interface Evaluation {
  overall_score?: number;
  summary?: string;
  recommendation?: string;
  comparable_level?: string;
  parameter_scores?: ParameterScore[];
  strengths?: string[];
  areas_for_improvement?: string[];
  red_flags?: string[];
  standout_moment?: string;
  candidate_feedback?: {
    summary?: string;
    tip?: string;
    strengths_to_highlight?: string;
  };
}

export interface TranscriptTurn {
  role?: string;
  speaker?: string;
  content: string;
}

export type PracticeStatus = 'created' | 'in_progress' | 'completed' | 'failed';

export interface PracticeInterview {
  id: string;
  session_id: string;
  job_role: string;
  interview_type: string;
  level: string;
  target_company: string | null;
  candidate_name: string;
  status: PracticeStatus;
  transcript: TranscriptTurn[] | null;
  evaluation: Evaluation | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}
