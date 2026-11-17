import React from 'react';
import PropTypes from 'prop-types';
import TextareaAutosize from 'react-textarea-autosize';

// Up-arrow icon used on the send button
function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </svg>
  );
}

function CodeInput({ code, setCode, onSubmit, disabled, children }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey && !disabled) {
      onSubmit();
    }
  };

  return (
    <div className="composer">
      <TextareaAutosize
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Paste the code you're proud of…"
        minRows={1}
        maxRows={12}
        disabled={disabled}
      />
      <div className="composer-actions">
        <span className="hint">Ctrl+Enter to send</span>
        {children}
        <button
          className="icon-button send-button"
          onClick={onSubmit}
          disabled={disabled || !code.trim()}
          aria-label={disabled ? 'Roasting…' : 'Roast it'}
          title={disabled ? 'Roasting…' : 'Roast it'}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

CodeInput.propTypes = {
  code: PropTypes.string.isRequired,
  setCode: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  children: PropTypes.node
};

CodeInput.defaultProps = {
  disabled: false
};

export default CodeInput;
