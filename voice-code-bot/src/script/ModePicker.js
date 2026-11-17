import React from 'react';
import PropTypes from 'prop-types';

export const MODES = [
  { id: 'friend', emoji: '😄', label: 'Friend' },
  { id: 'teacher', emoji: '🧑‍🏫', label: 'Teacher' },
  { id: 'evil', emoji: '😈', label: 'Evil' },
];

// Row of buttons for choosing the roast mode (friend, teacher, evil)
function ModePicker({ mode, setMode, disabled }) {
  return (
    <div className="mode-picker" role="radiogroup" aria-label="Roast mode">
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          role="radio"
          aria-checked={mode === m.id}
          className={`mode-button mode-${m.id}${mode === m.id ? ' active' : ''}`}
          onClick={() => setMode(m.id)}
          disabled={disabled}
        >
          <span aria-hidden="true">{m.emoji}</span> {m.label}
        </button>
      ))}
    </div>
  );
}

ModePicker.propTypes = {
  mode: PropTypes.oneOf(MODES.map((m) => m.id)).isRequired,
  setMode: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default ModePicker;
