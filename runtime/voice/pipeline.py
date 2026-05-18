import asyncio
import structlog
from typing import AsyncGenerator
import speech_recognition as sr
import threading
import queue
import time

logger = structlog.get_logger()

class VoicePipeline:
    def __init__(self):
        self.is_listening = False
        self.recognizer = sr.Recognizer()
        self.audio_queue = queue.Queue()
        self.listen_thread = None

    async def initialize(self):
        """Lazy load models."""
        logger.info("Initializing voice models")
        # Pre-adjust for ambient noise if mic is available
        try:
            with sr.Microphone() as source:
                self.recognizer.adjust_for_ambient_noise(source, duration=1)
                logger.info("Microphone initialized and calibrated.")
        except Exception as e:
            logger.warning(f"Could not initialize microphone: {e}")

    def _listen_worker(self):
        with sr.Microphone() as source:
            while self.is_listening:
                try:
                    # Listen for phrases
                    audio = self.recognizer.listen(source, timeout=1, phrase_time_limit=5)
                    self.audio_queue.put(audio)
                except sr.WaitTimeoutError:
                    continue
                except Exception as e:
                    logger.error(f"Mic error: {e}")
                    time.sleep(1)

    async def start_listening(self) -> AsyncGenerator[str, None]:
        self.is_listening = True
        logger.info("Started native Python listening")
        
        # Start background listening thread
        self.listen_thread = threading.Thread(target=self._listen_worker, daemon=True)
        self.listen_thread.start()
        
        try:
            while self.is_listening:
                # Process audio queue asynchronously
                while not self.audio_queue.empty():
                    audio = self.audio_queue.get()
                    try:
                        # Use Google Web Speech API for fast, free recognition
                        text = self.recognizer.recognize_google(audio, language="en-IN")
                        if text:
                            logger.info(f"Transcribed: {text}")
                            yield text
                    except sr.UnknownValueError:
                        # Could not understand audio
                        pass
                    except sr.RequestError as e:
                        logger.error(f"STT API Error: {e}")
                
                await asyncio.sleep(0.1)
        except asyncio.CancelledError:
            pass
        finally:
            self.stop_listening()

    def stop_listening(self):
        self.is_listening = False
        if self.listen_thread:
            self.listen_thread = None
        logger.info("Stopped native Python listening")

    async def speak(self, text: str) -> str:
        """Synthesize text to speech."""
        return "/tmp/opensarthi_speech.wav"
