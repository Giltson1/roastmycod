import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import MessageBubble from './MessageBubble';

function ChatBox({ messages, isLoading }) {
  const endRef = useRef(null);

  // Scroll to the newest message whenever a message is added or the bot starts thinking
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return <div className="empty-state">What code can I help with?</div>;
  }

  return (
    <div className="chat">
      {messages.map((message, index) => (
        <MessageBubble
          key={`msg-${index}-${Date.now()}`}
          type={message.type}
          message={message.text}
        />
      ))}
      {isLoading && (
        <div className="loading-indicator">
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}

ChatBox.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.oneOf(['user', 'bot']).isRequired,
      text: PropTypes.string.isRequired
    })
  ).isRequired,
  isLoading: PropTypes.bool
};

ChatBox.defaultProps = {
  messages: [],
  isLoading: false
};

export default ChatBox;
