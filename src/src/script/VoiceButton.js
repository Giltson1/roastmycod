import React, { useState } from 'react';
import PropTypes from 'prop-types';

function VoiceButton({ onVoiceInput, disabled }) {
  const [isListening, setIsListening] = useState(false);

  const handleVoiceClick = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (onVoiceInput) {
        onVoiceInput(transcript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <button
      className={`icon-button voice-button${isListening ? ' listening' : ''}`}
      onClick={handleVoiceClick}
      disabled={disabled || isListening}
      aria-label={isListening ? 'Listening…' : 'Speak your question'}
      title={isListening ? 'Listening…' : 'Speak your question'}
    >
      <MicIcon />
    </button>
  );
}

// Microphone icon used on the voice button
function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </svg>
  );
}

VoiceButton.propTypes = {
  onVoiceInput: PropTypes.func,
  disabled: PropTypes.bool
};

VoiceButton.defaultProps = {
  onVoiceInput: null,
  disabled: false
};

export default VoiceButton;
