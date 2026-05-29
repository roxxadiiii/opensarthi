import asyncio
import numpy as np
import io
import wave
from typing import Optional
from faster_whisper import WhisperModel
import speech_recognition as sr
import structlog

logger = structlog.get_logger()

class FasterWhisperSTT:
    """
    STT using a hybrid approach: Google Web Speech API for key-free, high-accuracy
    transcription tuned to accents (like Indian English), falling back to local offline faster-whisper.
    """

    MODEL_SIZE = "base"  # Multilingual base model for better accent and language support

    def __init__(self, language: str = "en"):
        self.language = language
        self._model: Optional[WhisperModel] = None
        self.recognizer = sr.Recognizer()

    def load(self):
        """Load the Whisper model (downloads on first use)."""
        if self._model is not None:
            return
        try:
            self._model = WhisperModel(
                self.MODEL_SIZE,
                device="cpu",        # Use "cuda" if GPU available
                compute_type="int8", # Memory efficient
                cpu_threads=4
            )
            print(f"[STT] faster-whisper '{self.MODEL_SIZE}' loaded successfully")
        except Exception as e:
            logger.error("Failed to load local faster-whisper model", error=str(e))

    def transcribe(self, audio_array: np.ndarray) -> tuple[str, float]:
        """
        Transcribe audio to text.
        First tries Google Web Speech API with the appropriate accent/language code
        for high-accuracy, key-free cloud transcription. Falls back to local offline faster-whisper.
        Returns: (transcript, confidence)
        audio_array: float32 numpy array at 16kHz
        """
        # 1. Resolve correct language code based on user settings
        try:
            from config import settings
            voice_config = getattr(settings, "voice_accent", "co.in")
        except Exception:
            voice_config = "co.in"

        rec_lang = "en-IN"  # Default to Indian English
        if voice_config in ['fr', 'es', 'de', 'hi', 'ja', 'it', 'pt']:
            if voice_config == 'hi':
                rec_lang = 'hi-IN'
            elif voice_config == 'ja':
                rec_lang = 'ja-JP'
            elif voice_config == 'pt':
                rec_lang = 'pt-BR'
            else:
                rec_lang = f"{voice_config}-{voice_config.upper()}"
        elif voice_config == 'co.uk':
            rec_lang = 'en-GB'
        elif voice_config == 'com':
            rec_lang = 'en-US'
        elif voice_config == 'com.au':
            rec_lang = 'en-AU'
        elif voice_config == 'ca':
            rec_lang = 'en-CA'
        elif voice_config == 'co.nz':
            rec_lang = 'en-NZ'
        else:
            rec_lang = 'en-IN'  # Default to Indian English if unknown or co.in

        # 2. Try Google Web Speech API first (key-free, highly accurate for accents)
        try:
            # Convert float32 numpy array back to 16-bit PCM bytes
            audio_int16 = np.clip(audio_array, -1.0, 1.0)
            audio_int16 = (audio_int16 * 32767).astype(np.int16)
            wav_bytes = audio_int16.tobytes()

            # Create AudioData object
            audio_data = sr.AudioData(wav_bytes, 16000, 2)

            # Perform transcription
            text = self.recognizer.recognize_google(audio_data, language=rec_lang)
            if text and text.strip():
                logger.info(f"Google STT transcribed ({rec_lang}): {text}")
                return text.strip(), 1.0
        except sr.UnknownValueError:
            logger.info("Google STT could not understand audio, falling back to local Whisper")
        except sr.RequestError as e:
            logger.info(f"Google STT offline or request failed ({e}), falling back to local Whisper")
        except Exception as e:
            logger.error(f"Google STT error: {e}, falling back to local Whisper")

        # 3. Fallback to local offline faster-whisper
        if self._model is None:
            self.load()

        if self._model is None:
            return "", 0.0

        try:
            # Context prompt to steer local whisper transcription accent & vocabulary
            initial_prompt = None
            if "en" in rec_lang.lower():
                initial_prompt = "Indian English accent, Sarthi assistant, computer code command"
            elif "hi" in rec_lang.lower():
                initial_prompt = "हिन्दी, भारतीय लहजा, सारथी, कंप्यूटर कमांड"

            # Select target language code for Whisper model
            target_lang = "en"
            if "hi" in rec_lang.lower():
                target_lang = "hi"
            elif "-" in rec_lang:
                target_lang = rec_lang.split("-")[0]

            segments, info = self._model.transcribe(
                audio_array,
                language=target_lang,
                vad_filter=True,         # Skip silent segments
                beam_size=3,             # Lower = faster, less accurate
                word_timestamps=False,
                initial_prompt=initial_prompt
            )
            text = " ".join(seg.text.strip() for seg in segments).strip()
            return text, info.language_probability
        except Exception as e:
            logger.error("Local STT transcription failed", error=str(e))
            return "", 0.0

    async def transcribe_async(self, audio_array: np.ndarray) -> str:
        """Non-blocking transcription via thread pool executor."""
        loop = asyncio.get_running_loop()
        text, _ = await loop.run_in_executor(None, self.transcribe, audio_array)
        return text
