import { LessonData, ValidationError, ValidationResult } from '../types/lesson';

export function validateLesson(jsonString: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!jsonString || !jsonString.trim()) {
    return {
      isValid: false,
      errors: [
        {
          path: 'root',
          message: 'Dữ liệu JSON rỗng. Vui lòng dán nội dung JSON hoặc tải file .json.'
        }
      ]
    };
  }

  let data: unknown;
  try {
    data = JSON.parse(jsonString);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      isValid: false,
      errors: [
        {
          path: 'JSON Parse Error',
          message: `Lỗi cú pháp JSON: ${errorMsg}`
        }
      ]
    };
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return {
      isValid: false,
      errors: [
        {
          path: 'root',
          message: 'Dữ liệu gốc phải là một đối tượng JSON (Object { ... }).'
        }
      ]
    };
  }

  const record = data as Record<string, unknown>;

  // Check version
  if (record.version === undefined || record.version === null || record.version === '') {
    errors.push({
      path: 'version',
      message: 'Thiếu trường: version'
    });
  }

  // Check lesson
  if (!record.lesson || typeof record.lesson !== 'object' || Array.isArray(record.lesson)) {
    errors.push({
      path: 'lesson',
      message: 'Thiếu trường: lesson (phải là đối tượng chứa thông tin bài học)'
    });
  } else {
    const lessonObj = record.lesson as Record<string, unknown>;
    if (!lessonObj.title || typeof lessonObj.title !== 'string' || !lessonObj.title.trim()) {
      errors.push({
        path: 'lesson.title',
        message: 'Thiếu trường: lesson.title (Tên bài học không được để trống)'
      });
    }
  }

  // Check sections
  if (!record.sections || !Array.isArray(record.sections)) {
    errors.push({
      path: 'sections',
      message: 'Thiếu trường: sections (phải là một danh sách Mảng [ ... ])'
    });
  } else {
    const sectionsArray = record.sections as unknown[];

    if (sectionsArray.length === 0) {
      errors.push({
        path: 'sections',
        message: 'Danh sách sections không được để trống (cần ít nhất 1 section)'
      });
    }

    sectionsArray.forEach((section, sIndex) => {
      const sectionPath = `sections[${sIndex}]`;

      if (typeof section !== 'object' || section === null || Array.isArray(section)) {
        errors.push({
          path: sectionPath,
          message: `${sectionPath} phải là một đối tượng`
        });
        return;
      }

      const secObj = section as Record<string, unknown>;

      if (!secObj.items || !Array.isArray(secObj.items)) {
        errors.push({
          path: `${sectionPath}.items`,
          message: `Thiếu trường: ${sectionPath}.items (phải là mảng câu hỏi/mục học)`
        });
      } else {
        const itemsArray = secObj.items as unknown[];

        itemsArray.forEach((item, iIndex) => {
          const itemPath = `${sectionPath}.items[${iIndex}]`;

          if (typeof item !== 'object' || item === null || Array.isArray(item)) {
            errors.push({
              path: itemPath,
              message: `${itemPath} phải là một đối tượng câu hỏi/bài tập`
            });
            return;
          }

          const itemObj = item as Record<string, unknown>;

          // Check id
          if (itemObj.id === undefined || itemObj.id === null || String(itemObj.id).trim() === '') {
            errors.push({
              path: `${itemPath}.id`,
              message: `Thiếu trường: ${itemPath}.id`
            });
          }

          // Check type
          if (
            itemObj.type === undefined ||
            itemObj.type === null ||
            typeof itemObj.type !== 'string' ||
            !itemObj.type.trim()
          ) {
            errors.push({
              path: `${itemPath}.type`,
              message: `Thiếu trường: ${itemPath}.type`
            });
          }

          // Check data
          if (
            itemObj.data === undefined ||
            itemObj.data === null ||
            typeof itemObj.data !== 'object' ||
            Array.isArray(itemObj.data)
          ) {
            errors.push({
              path: `${itemPath}.data`,
              message: `Thiếu trường: ${itemPath}.data (phải là đối tượng chứa dữ liệu chi tiết bài tập)`
            });
          }
        });
      }
    });
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    parsedData: isValid ? (data as LessonData) : undefined
  };
}
