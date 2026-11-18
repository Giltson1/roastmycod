import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import MessageBubble from './MessageBubble';

const LOADING_LINES = [
  'Sharpening insults…',
  'Reading your code (sorry)…',
  'Consulting the roast committee…',
  'Trying not to laugh…',
];

// Loading line that switches to the next joke every 1.8 seconds while the roast is being written
function RoastingIndicator() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % LOADING_LINES.length), 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="loading-indicator">
      <div className="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span className="loading-text">{LOADING_LINES[index]}</span>
    </div>
  );
}

function ChatBox({ messages, isLoading }) {
  const endRef = useRef(null);

  // Scroll to the newest message whenever a message is added or the bot starts thinking
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="empty-state">
        <h1>Drop your code.</h1>
        <p>I'll tell you what's wrong with it.</p>
      </div>
    );
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
      {isLoading && <RoastingIndicator />}
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
