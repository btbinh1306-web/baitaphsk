export function speakText(text: string, lang = 'zh-CN') {
  if (!('speechSynthesis' in window)) {
    alert('Trình duyệt của bạn không hỗ trợ đọc tự động Web Speech API.');
    return;
  }
  
  window.speechSynthesis.cancel(); // Stop any currently playing audio
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.85; // Slightly slower pace for language learners
  window.speechSynthesis.speak(utterance);
}
