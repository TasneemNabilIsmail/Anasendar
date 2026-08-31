import { Injectable } from '@angular/core';

/**
 * Speaks text aloud via the browser's Web Speech API. This only works while
 * the page is open/foregrounded — no browser can synthesize speech for a
 * backgrounded or closed tab. When mobile packaging is added later, a
 * Capacitor branch (@capacitor-community/text-to-speech) slots in here
 * behind the same speak() method.
 */
@Injectable({ providedIn: 'root' })
export class TtsService {
  speak(text: string): void {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }
}
