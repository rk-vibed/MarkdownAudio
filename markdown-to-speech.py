import os
import re
import subprocess
import sys

def clean_markdown(md_text):
    """Strips Markdown syntax to make the text sound natural when spoken."""
    # 1. Remove Markdown headers (#, ##, etc.) but keep the text
    text = re.sub(r'\n+', ' [[slnc 500]] ', md_text)
    text = re.sub(r'#+\s+(.*)', r'\1.', text)
    
    # 2. Remove bold and italics markings (**text**, *text*, __text__, _text_)
    text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)
    text = re.sub(r'\*([^*]+)\*', r'\1', text)
    text = re.sub(r'__([^_]+)__', r'\1', text)
    text = re.sub(r'_([^_]+)_', r'\1', text)
    
    # 3. Clean up links [Text](URL) -> just speak the text, ignore the URL
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    
    # 4. Clean up inline code blocks (`code`)
    text = re.sub(r'`([^`]+)`', r'\1', text)
    
    # 5. Clean up list bullet marks (- item, * item, 1. item)
    text = re.sub(r'^\s*[\-\*+]\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*\d+\.\s+', '', text, flags=re.MULTILINE)
    
    return text.strip()

def speak_text(text, voice="Alex", output_file=None):
    """Generates speech via macOS 'say' (to a temp file), then plays with ffplay.

    macOS 'say' cannot stream audio to stdout/pipes, so we write to a temp
    AIFF file first, then hand it off to ffplay for interactive playback with
    a built-in waveform visualisation (-showmode 2).
    """
    import tempfile

    # Write speech to a temporary AIFF file
    with tempfile.NamedTemporaryFile(suffix=".aiff", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        print("🎙️  Generating speech...")
        subprocess.run(["say", "-v", voice, "-o", tmp_path, text], check=True)

        if output_file:
            # Convert/copy to the requested output path via ffmpeg
            subprocess.run(["ffmpeg", "-y", "-i", tmp_path, output_file], check=True)
            print(f"🎙️ Audio saved to: {output_file}")
        else:
            # Play interactively; -showmode 2 shows a live waveform in the window
            # Note: on macOS the red ✕ button doesn't kill ffplay — press q/Esc
            # in the window, or Ctrl+C in the terminal to stop early.
            print("🗣️ Interactive player open. Press [q] or [Esc] to quit, [Space] to pause.")
            proc = subprocess.Popen([
                "ffplay", tmp_path,
                "-window_title", "Markdown Voice Preview",
                "-x", "200", "-y", "50",
                "-showmode", "2",   # built-in waveform visualisation
                "-autoexit"         # close window automatically when done
            ])
            try:
                proc.wait()          # block until ffplay exits normally
            except KeyboardInterrupt:
                proc.terminate()     # Ctrl+C → kill ffplay, then fall through to finally
                proc.wait()
    finally:
        os.unlink(tmp_path)  # always clean up the temp file

example_markdown = """
    # Introduction to Python
    
    Welcome! Python is a **powerful** and *easy to learn* language.
    
    ## Key Features:
    - Clean syntax
    - Massive library ecosystem
    
    For more details, visit the [Python Website](https://python.org). Happy coding!
    """

if __name__ == "__main__":
    # Read markdown from a file passed as a CLI argument, or fall back to the inline sample
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
        if not os.path.isfile(input_file):
            print(f"Error: file '{input_file}' not found.", file=sys.stderr)
            sys.exit(1)
        with open(input_file, "r", encoding="utf-8") as f:
            sample_markdown = f.read()
        print(f"📄 Reading from: {input_file}")
    else:
        # Fallback sample
        sample_markdown = example_markdown

    # Step 1 & 2: Clean the text
    cleaned = clean_markdown(sample_markdown)
    # print("--- Cleaned Text Preview ---")
    # print(cleaned)
    # print("----------------------------\n")

    # Step 3: Speak with interactive waveform player
    speak_text(cleaned, voice="Samantha")

    # Option B: Save it as an audio file instead (uncomment to use)
    # speak_text(cleaned, voice="Alex", output_file="markdown_podcast.aiff")
