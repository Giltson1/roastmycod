# Code Roast

Code Roast reviews your code by roasting it. Each joke points at a real problem: bugs, naming, style, performance, or bad practice.

Paste your code or speak it, pick a roast mode, and get feedback in the chat.

## Roast modes

Code Roast has three modes:

- **Friend:** playful teasing from your best friend. It ends with encouragement and a fix.
- **Teacher:** a disappointed CS professor. Each roast is also a short lesson on why the mistake matters, and it includes a fix.
- **Evil:** brutal, uncensored, and full of profanity. You get no fix and no sympathy.

## Local setup

Clone the repository:

```bash
git clone https://github.com/Giltson1/Talk-with-me-.git
cd Talk-with-me-
```

Install the required Python packages:

```bash
pip install -r requirements.txt
```

Install the frontend packages:

```bash
cd voice-code-bot
npm install
```

Create a `.env` file in the project root (`Talk-with-me-/`). Add your LLM API key there:

```
LLM_API_KEY=your_key_here
```

To get a free Groq API key:

1. Sign up or log in at [console.groq.com](https://console.groq.com).
2. Go to **API Keys** ([console.groq.com/keys](https://console.groq.com/keys)).
3. Click **Create API Key**, give it a name, and copy it. Groq shows the key only once.
4. Paste it into `.env` as `LLM_API_KEY`.

On same env file add this:

```
LLM_URL=https://api.groq.com/openai/v1/chat/completions
LLM_MODEL=openai/gpt-oss-120b
-```

## Run

Start the backend. It runs on port 5000:

```bash
python voice-code-bot/app.py
```

In a second terminal, start the frontend. It runs on port 3000:

```bash
cd voice-code-bot
npm start
```

Open http://localhost:3000. If the backend runs somewhere else, set `REACT_APP_API_URL` before you start the frontend.

## How it works

1. You type or paste code, or click the mic and speak. Voice input uses the browser's Web Speech API.
2. The React frontend sends the code and the selected mode to the Flask backend at `/analyze-code`.
3. The backend builds a prompt for that mode and sends it to an OpenAI-compatible LLM API (Groq by default).
4. The roast comes back as Markdown, and the chat displays it.

## Deployment

`render.yaml` deploys two services on Render:

- the Flask API, run with gunicorn
- the React app, as a static site

On Render, set `LLM_API_KEY`, `CORS_ORIGINS`, and `REACT_APP_API_URL`.

## Testing

Voice input only works in browsers that support speech recognition, such as Chrome and Edge. Firefox doesn't support it.
