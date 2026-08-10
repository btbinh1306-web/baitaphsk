import React from 'react';

interface UnsupportedExerciseProps {
  type: string;
}

export const UnsupportedExercise: React.FC<UnsupportedExerciseProps> = ({ type }) => {
  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-mono flex items-center justify-between shadow-2xs">
      <div>
        <span className="font-bold text-amber-800">Unsupported Exercise Type: </span>
        <span className="font-mono bg-amber-100 px-2 py-0.5 rounded text-amber-950">{type}</span>
      </div>
      <span className="text-[11px] text-amber-700 italic font-sans">Vẫn lưu trữ & giữ nguyên item</span>
    </div>
  );
};
