import os
from pathlib import Path

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

# Load the .env at the repo root (Talk-with-me-/.env), from voice-code-bot/app.py, regardless of where the server is started from.
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

app = Flask(__name__)

CORS(app, origins=[
    "http://localhost:3000",
    "https://giltson1.github.io",
])

LLM_URL = os.environ.get("LLM_URL", "https://api.groq.com/openai/v1/chat/completions")
LLM_API_KEY = os.environ.get("LLM_API_KEY")
LLM_MODEL = os.environ.get("LLM_MODEL", "openai/gpt-oss-120b")
REQUEST_TIMEOUT = 60  # seconds

if not LLM_API_KEY:
    print("Warning: LLM_API_KEY is not set. /analyze-code will return an error.")

SYSTEM_PROMPT = (
    "You are a friendly code reviewer. The user sends code, a question about code, or both. "
    "Explain what the code does, point out bugs or risky parts, and suggest concrete fixes. "
    "Be concise and use plain language."
)


@app.route("/analyze-code", methods=["POST"])
def analyze_code():
    data = request.get_json(silent=True) or {}
    code = data.get("code", "")
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
            json={
                "model": LLM_MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": code},
                ],
            },
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


@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "key_configured": bool(LLM_API_KEY), "model": LLM_MODEL})


if __name__ == "__main__":
    app.run(debug=os.environ.get("FLASK_DEBUG") == "1", port=5000)
