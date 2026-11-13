const PUNCTUATION = /[，。？！、；：,.?!;:]/gu;

const countChars = (chars: string[]) => chars.reduce<Map<string, number>>((counts, char) => {
  counts.set(char, (counts.get(char) || 0) + 1);
  return counts;
}, new Map());

/**
 * Sentence-arrangement questions are graded by joining the chips the student
 * placed, so every punctuation mark in the expected sentence (。，？！…) must be
 * a chip the student can place. Adds the missing punctuation chips from the
 * first accepted answer and drops accepted answers that could not be built
 * from the resulting chips.
 */
export const withPunctuationChips = (wordChips: string[], acceptableAnswers: string) => {
  const answers = acceptableAnswers.split('|').map((answer) => answer.trim()).filter(Boolean);
  const mainAnswer = answers[0] || '';
  const needed = countChars(mainAnswer.match(PUNCTUATION) || []);
  const present = countChars(wordChips.filter((chip) => PUNCTUATION.test(chip) && chip.replace(PUNCTUATION, '') === ''));
  PUNCTUATION.lastIndex = 0;

  const chips = [...wordChips];
  needed.forEach((count, mark) => {
    for (let index = present.get(mark) || 0; index < count; index += 1) chips.push(mark);
  });

  const available = countChars(chips.join('').match(PUNCTUATION) || []);
  const fitsChips = (answer: string) => {
    const used = countChars(answer.match(PUNCTUATION) || []);
    return [...used.entries()].every(([mark, count]) => (available.get(mark) || 0) >= count)
      && [...available.entries()].every(([mark, count]) => (used.get(mark) || 0) === count);
  };
  const usable = answers.filter(fitsChips);

  return {
    wordChips: chips,
    acceptableAnswers: (usable.length ? usable : [mainAnswer]).join('|')
  };
};
