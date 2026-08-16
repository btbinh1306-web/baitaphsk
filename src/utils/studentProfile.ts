export interface StudentProfile {
  name: string;
  className: string;
}

const STUDENT_PROFILE_KEY = 'hsk_student_profile_v1';

export function loadStudentProfile(): StudentProfile | null {
  try {
    const raw = localStorage.getItem(STUDENT_PROFILE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StudentProfile>;
    if (typeof parsed.name !== 'string' || typeof parsed.className !== 'string') return null;
    if (!parsed.name.trim() || !parsed.className.trim()) return null;

    return {
      name: parsed.name.trim(),
      className: parsed.className.trim()
    };
  } catch (error) {
    console.warn('Failed to load student profile:', error);
    return null;
  }
}

export function saveStudentProfile(profile: StudentProfile): void {
  try {
    localStorage.setItem(
      STUDENT_PROFILE_KEY,
      JSON.stringify({
        name: profile.name.trim(),
        className: profile.className.trim()
      })
    );
  } catch (error) {
    console.warn('Failed to save student profile:', error);
  }
}
