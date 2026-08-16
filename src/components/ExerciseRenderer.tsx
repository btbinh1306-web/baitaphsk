import React from 'react';
import { LessonItem } from '../types/lesson';
import { MultipleChoice } from './exercises/MultipleChoice';
import { Flashcard } from './exercises/Flashcard';
import { Matching } from './exercises/Matching';
import { Dictation } from './exercises/Dictation';
import { ParagraphOrder } from './exercises/ParagraphOrder';
import { PictureWriting } from './exercises/PictureWriting';
import { SpeakingRecord } from './exercises/SpeakingRecord';
import { ListeningExercise } from './exercises/ListeningExercise';
import { HandwritingExerciseView } from './exercises/HandwritingExerciseView';
import { UnsupportedExercise } from './exercises/UnsupportedExercise';

export const exerciseTypes = {
  multiple_choice: MultipleChoice,
  mc: MultipleChoice,
  flashcard: Flashcard,
  vocab: Flashcard,
  matching: Matching,
  dictation: Dictation,
  paragraph_order: ParagraphOrder,
  picture_writing: PictureWriting,
  speaking_record: SpeakingRecord,
  listening_multiple_choice: ListeningExercise,
  listening_true_false: ListeningExercise,
  listening_fill: ListeningExercise,
  listening_fill_in_blank: ListeningExercise,
  listening_mc: ListeningExercise,
  listening_tf: ListeningExercise,
  handwriting_submission: HandwritingExerciseView
};

interface ExerciseRendererProps {
  item: LessonItem;
}

export const ExerciseRenderer: React.FC<ExerciseRendererProps> = ({ item }) => {
  switch (item.type) {
    case 'multiple_choice':
    case 'mc':
      return <MultipleChoice data={item.data} />;

    case 'flashcard':
    case 'vocab':
      return <Flashcard data={item.data} />;

    case 'matching':
      return <Matching data={item.data} />;

    case 'dictation':
      return <Dictation data={item.data} />;

    case 'paragraph_order':
      return <ParagraphOrder data={item.data} />;

    case 'picture_writing':
      return <PictureWriting data={item.data} />;

    case 'speaking_record':
      return <SpeakingRecord data={item.data} />;

    case 'listening_multiple_choice':
    case 'listening_true_false':
    case 'listening_fill':
    case 'listening_fill_in_blank':
    case 'listening_mc':
    case 'listening_tf':
      return <ListeningExercise data={item.data} />;

    case 'handwriting_submission':
      return (
        <HandwritingExerciseView
          exercise={{
            id: item.id || 'hw_item',
            type: 'handwriting_submission',
            title:
              (item.data.title as string) ||
              (item.data.prompt as string) ||
              'Bài chép từ mới / Nộp ảnh bài viết',
            instruction: (item.data.instruction as string) || undefined,
            referenceImages: (item.data.referenceImages as string[]) || [],
            createdAt: new Date().toISOString()
          }}
        />
      );

    default:
      return <UnsupportedExercise type={item.type} />;
  }
};
