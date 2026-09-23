export type ErrorCorrectionJudgement = 'correct' | 'incorrect';

export interface ErrorCorrectionAnswer {
  judgement: ErrorCorrectionJudgement;
  correction?: string;
}

export function parseErrorCorrectionAnswer(value?: string): Partial<ErrorCorrectionAnswer> {
  if (!value?.trim()) return {};
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const judgement = parsed.judgement === 'correct' || parsed.judgement === 'incorrect'
      ? parsed.judgement
      : undefined;
    return {
      judgement,
      correction: typeof parsed.correction === 'string' ? parsed.correction : ''
    };
  } catch {
    return {};
  }
}

export function serializeErrorCorrectionAnswer(answer: ErrorCorrectionAnswer): string {
  return JSON.stringify({
    judgement: answer.judgement,
    ...(answer.judgement === 'incorrect' ? { correction: answer.correction?.trim() || '' } : {})
  });
}

export function isErrorCorrectionAnswered(value?: string): boolean {
  const answer = parseErrorCorrectionAnswer(value);
  return answer.judgement === 'correct' || (
    answer.judgement === 'incorrect' && Boolean(answer.correction?.trim())
  );
}

export function formatErrorCorrectionAnswer(value?: string): string {
  const answer = parseErrorCorrectionAnswer(value);
  if (answer.judgement === 'correct') return 'Đúng';
  if (answer.judgement === 'incorrect') return `Sai${answer.correction?.trim() ? ` — Sửa: ${answer.correction.trim()}` : ''}`;
  return '';
}
