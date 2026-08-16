import { ExamLesson } from '../types';
import { HandwritingExercise } from '../types/handwriting';
import { getConfiguredGasWebAppUrl } from './gasConfig';
import { getGasRequestUrl } from './gasTransport';

export type GasMediaFolder = 'lesson' | 'submission' | 'correction';

interface GasCapabilities {
  lessons?: boolean;
  media?: boolean;
  submissions?: boolean;
  deleteSubmissions?: boolean;
}

let capabilitiesPromise: Promise<GasCapabilities | null> | null = null;

function getGasUrl(): string {
  return getConfiguredGasWebAppUrl();
}

function buildGasUrl(action: string): string | null {
  const rawUrl = getGasUrl();
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);
    url.searchParams.set('action', action);
    return url.toString();
  } catch (error) {
    console.warn('Invalid GAS Web App URL', error);
    return null;
  }
}

async function gasGet<T>(action: string): Promise<T | null> {
  const url = buildGasUrl(action);
  if (!url) return null;

  try {
    const response = await fetch(getGasRequestUrl(url));
    const data = await response.json();
    return data as T;
  } catch (error) {
    console.warn(`GAS GET failed for ${action}`, error);
    return null;
  }
}

async function gasPost<T>(payload: Record<string, unknown>): Promise<T | null> {
  const url = getGasUrl();
  if (!url) return null;

  try {
    const response = await fetch(getGasRequestUrl(url), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    return data as T;
  } catch (error) {
    console.warn(`GAS POST failed for ${String(payload.action || 'request')}`, error);
    return null;
  }
}

export async function getGasCapabilities(): Promise<GasCapabilities | null> {
  if (!capabilitiesPromise) {
    capabilitiesPromise = gasGet<{ ok?: boolean; capabilities?: GasCapabilities }>('capabilities')
      .then((data) => (data?.ok && data.capabilities ? data.capabilities : null));
  }
  return capabilitiesPromise;
}

export function clearGasCapabilitiesCache(): void {
  capabilitiesPromise = null;
}

export async function fetchGasExams(): Promise<ExamLesson[] | null> {
  const capabilities = await getGasCapabilities();
  if (!capabilities?.lessons) return null;

  const data = await gasGet<{ ok?: boolean; exams?: Array<ExamLesson | HandwritingExercise> }>('list_exams');
  if (!data?.ok || !Array.isArray(data.exams)) return null;

  return data.exams.filter((exam) => exam.type !== 'handwriting_submission') as ExamLesson[];
}

export async function fetchGasDeletedExamIds(): Promise<string[] | null> {
  const capabilities = await getGasCapabilities();
  if (!capabilities?.lessons) return null;

  const data = await gasGet<{ ok?: boolean; deletedIds?: unknown[] }>('list_deleted_exams');
  if (!data?.ok || !Array.isArray(data.deletedIds)) return null;

  return data.deletedIds.map(String);
}

export async function fetchGasHandwritingExercises(): Promise<HandwritingExercise[] | null> {
  const capabilities = await getGasCapabilities();
  if (!capabilities?.lessons) return null;

  const data = await gasGet<{ ok?: boolean; exams?: Array<ExamLesson | HandwritingExercise> }>('list_exams');
  if (!data?.ok || !Array.isArray(data.exams)) return null;

  return data.exams.filter((exam) => exam.type === 'handwriting_submission') as HandwritingExercise[];
}

export async function saveGasExam(exam: ExamLesson | HandwritingExercise): Promise<boolean | null> {
  const capabilities = await getGasCapabilities();
  if (!capabilities?.lessons) return null;

  const data = await gasPost<{ ok?: boolean }>({ action: 'save_exam', exam });
  return data ? Boolean(data.ok) : false;
}

export async function deleteGasExam(examId: string): Promise<boolean | null> {
  const capabilities = await getGasCapabilities();
  if (!capabilities?.lessons) return null;

  const data = await gasPost<{ ok?: boolean }>({ action: 'delete_exam', id: examId });
  return data ? Boolean(data.ok) : false;
}

export async function deleteGasSubmissions(ids: string[], pass: string): Promise<boolean | null> {
  const capabilities = await getGasCapabilities();
  if (!capabilities?.deleteSubmissions) return null;

  const data = await gasPost<{ ok?: boolean }>({
    action: 'delete_submissions',
    ids,
    pass
  });
  return data ? Boolean(data.ok) : false;
}

export async function uploadMediaToGas(
  fileData: string,
  fileName: string | undefined,
  mimeType: string | undefined,
  folder: GasMediaFolder
): Promise<string | null> {
  const capabilities = await getGasCapabilities();
  if (!capabilities?.media) return null;

  const data = await gasPost<{ ok?: boolean; url?: string }>({
    action: 'upload_media',
    fileData,
    fileName,
    mimeType,
    folder
  });
  return data?.ok && data.url ? data.url : null;
}
