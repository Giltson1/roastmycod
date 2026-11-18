import os
from pathlib import Path

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

# Load the .env at the repo root (Talk-with-me-/.env), from voice-code-bot/app.py, regardless of where the server is started from.
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

app = Flask(__name__)

EXTRA_ORIGINS = [o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()]

CORS(app, origins=[
    "http://localhost:3000",
    "https://giltson1.github.io",
    *EXTRA_ORIGINS,
])

LLM_URL = os.environ.get("LLM_URL", "https://api.groq.com/openai/v1/chat/completions")
LLM_API_KEY = os.environ.get("LLM_API_KEY")
LLM_MODEL = os.environ.get("LLM_MODEL", "openai/gpt-oss-120b")
REQUEST_TIMEOUT = 60  # seconds

if not LLM_API_KEY:
    print("Warning: LLM_API_KEY is not set. /analyze-code will return an error.")

ROAST_RULES = (
    "The user pastes code (or asks about code). Roast it. "
    "Every joke must point at a real problem in the code: bugs, naming, style, performance, or bad practice. "
    "Format in Markdown: start with a one-line opening burn in bold, then a short bullet list of roasts "
    "(each one names the actual issue), then a line '**The fix:**' followed by the corrected code in a code block. "
    "If the code is genuinely good, roast how suspicious that is and still suggest one improvement. "
    "Keep it punchy, under 250 words."
)

ROAST_MODES = {
    "friend": (
        "You are the user's best friend roasting their code. Playful teasing, inside-joke energy, "
        "lots of 'bro' and 'buddy'. Sting a little, but it's clear you're on their side and you end encouraging."
    ),
    "teacher": (
        "You are a brilliant, deeply disappointed computer science professor. Dry, sarcastic, theatrical sighs. "
        "Each roast doubles as a clear mini-lesson explaining WHY the mistake is a problem."
    ),
    "evil": (
        "You are a merciless, unhinged code critic with zero chill. Brutal and savage. "
        "The user deliberately chose Evil mode and wants uncensored profanity. Swearing is REQUIRED: "
        "use at least 10 swear words (fuck, shit, damn, bullshit, goddamn, etc.) spread through the roast. "
        "Never censor them with asterisks, never soften the tone, never apologize. "
        "Use creative, over-the-top insults and comparisons aimed at the code and the decisions the user made writing it. "
        "No sympathy, no encouragement, no polite sign-off: end with one last brutal burn after the fix."
        "NEVER give a fix, corrected code, hints, suggestions, or explanations of how to do it right. No code blocks. "
    ),
}
DEFAULT_MODE = "friend"

EVIL_MODEL = os.environ.get("EVIL_MODEL", LLM_MODEL)

EVIL_EXAMPLE = [
    {"role": "user", "content": "def add(a,b): return a+b"},
    {
        "role": "assistant",
        "content": (
            "****Holy shit, you wrote a whole function to do what `+` already fucking does.**\n\n"
            "- `a` and `b`? Naming this lazy tells me your entire skill set fits in two letters.\n"
            "- No type hints, no docstring. You don't know what this does, and frankly neither does anyone who's hired you.\n"
            "- Crammed onto one line like you were billed per newline. Bootcamp dropout energy.\n\n"
            "Go figure it out fuck yourself. Oh wait, you can't, that's the whole goddamn problem.\n"
        ),
    },
]


# Build the full system prompt for the chosen roast mode (unknown modes fall back to friend)
def build_system_prompt(mode):
    if not isinstance(mode, str) or mode not in ROAST_MODES:
        mode = DEFAULT_MODE
    persona = ROAST_MODES[mode]
    return f"{persona}\n\n{ROAST_RULES}"


# Build the chat messages for a request, adding the evil example conversation in evil mode
def build_messages(mode, code):
    messages = [{"role": "system", "content": build_system_prompt(mode)}]
    if mode == "evil":
        messages += EVIL_EXAMPLE
    messages.append({"role": "user", "content": code})
    return messages


# Build the LLM request body; evil mode gets its own model, higher temperature and low reasoning effort
def build_payload(mode, code):
    model = EVIL_MODEL if mode == "evil" else LLM_MODEL
    payload = {"model": model, "messages": build_messages(mode, code)}
    if mode == "evil":
        payload["temperature"] = 1.0
        if "gpt-oss" in model:
            payload["reasoning_effort"] = "low"
    return payload


@app.route("/analyze-code", methods=["POST"])
def analyze_code():
    data = request.get_json(silent=True) or {}
    code = data.get("code", "")
    mode = data.get("mode", DEFAULT_MODE)
    if not isinstance(code, str) or not code.strip():
        return jsonify({"error": "No code provided"}), 400

    if not LLM_API_KEY:
        return jsonify({"error": "API key not configured on the server"}), 500

    try:
        response = requests.post(
            LLM_URL,
            headers={
                "Authorization": f"Bearer {LLM_API_KEY}",
                "Content-Type": "application/json",
            },
            json=build_payload(mode, code),
            timeout=REQUEST_TIMEOUT,
        )
    except requests.Timeout:
        return jsonify({"error": "The AI service took too long to respond"}), 504
    except requests.RequestException as e:
        print(f"Request to LLM failed: {e}")
        return jsonify({"error": "Could not reach the AI service"}), 502

    try:
        result = response.json()
    except ValueError:
        print(f"Non-JSON response ({response.status_code}): {response.text[:500]}")
        return jsonify({"error": f"AI service returned an invalid response ({response.status_code})"}), 502

    if not response.ok:
        err = result.get("error") if isinstance(result, dict) else None
        message = err.get("message") if isinstance(err, dict) else err
        print(f"LLM error ({response.status_code}): {message or result}")
        return jsonify({"error": message or f"AI service error ({response.status_code})"}), 502

    try:
        feedback = result["choices"][0]["message"]["content"] or ""
    except (KeyError, IndexError, TypeError):
        print(f"Unexpected LLM response shape: {result}")
        return jsonify({"error": "AI service returned an unexpected response"}), 502

    return jsonify({"feedback": feedback.strip()})


# Home route: tells visitors this is the API and where the app is
@app.route("/", methods=["GET"])
def index():
    return jsonify({"message": "Voice Code Bot API is running. Open the frontend at http://localhost:3000"})


@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "key_configured": bool(LLM_API_KEY), "model": LLM_MODEL})


if __name__ == "__main__":
    app.run(debug=os.environ.get("FLASK_DEBUG") == "1", port=5000)
