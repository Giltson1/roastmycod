import React from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function MessageBubble({ type, message }) {
  if (type === 'user') {
    return (
      <div className="message user">
        <div className="bubble">{message}</div>
      </div>
    );
  }

  return (
    <div className="message bot markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message}</ReactMarkdown>
    </div>
  );
}

MessageBubble.propTypes = {
  type: PropTypes.oneOf(['user', 'bot']).isRequired,
  message: PropTypes.string.isRequired
};

export default MessageBubble;
