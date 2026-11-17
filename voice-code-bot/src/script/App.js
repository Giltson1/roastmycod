import React, { useState, useEffect, useRef } from 'react';
import VoiceButton from './VoiceButton';
import CodeInput from './CodeInput';
import ChatBox from './ChatBox';
import ModePicker from './ModePicker';
import '../style/App.css';

function App() {
  const [code, setCode] = useState('');
  const [mode, setMode] = useState('friend');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const handleAnalyze = async () => {
    if (!code.trim()) {
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: 'Please enter some code to analyze' 
      }]);
      return;
    }

    setIsLoading(true);
    
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${API_BASE_URL}/analyze-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, mode }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const newMessages = [
        ...messages,
        { type: 'user', text: code },
        { type: 'bot', text: data.feedback || 'No feedback received' },
      ];
      
      setMessages(newMessages);
      setCode(''); // Clear input after successful submission
      
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error:', err);
        setMessages(prev => [...prev, { 
          type: 'bot', 
          text: `Error: ${err.message || 'Connection failed'}` 
        }]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleVoiceInput = (transcript) => {
    setCode(transcript);
  };

  return (
    <div className={`app mode-${mode}`}>
      <header className="app-header">Code Roast</header>
      <main className="chat-scroll">
        <div className="column">
          <ChatBox messages={messages} isLoading={isLoading} />
        </div>
      </main>
      <div className="composer-wrap">
        <div className="column">
          <ModePicker mode={mode} setMode={setMode} disabled={isLoading} />
          <CodeInput
            code={code}
            setCode={setCode}
            onSubmit={handleAnalyze}
            disabled={isLoading}
          >
            <VoiceButton onVoiceInput={handleVoiceInput} disabled={isLoading} />
          </CodeInput>
        </div>
      </div>
    </div>
  );
}

export default App;
