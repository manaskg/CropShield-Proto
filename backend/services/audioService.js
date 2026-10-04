import { Modality } from '@google/genai';

/**
 * Encodes 16-bit mono PCM base64 audio data into a standard WAV format base64 string.
 *
 * @param {string} pcmBase64 - Raw PCM data in base64
 * @param {number} sampleRate - Audio sample rate in Hz (default 24,000 for Gemini TTS)
 * @returns {string} Base64 encoded WAV file data
 */
export function pcmToWav(pcmBase64, sampleRate = 24000) {
  if (!pcmBase64) return '';

  const binaryBuffer = Buffer.from(pcmBase64, 'base64');
  const len = binaryBuffer.length;
  const header = Buffer.alloc(44);

  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + len, 4);
  header.write('WAVE', 8);

  // fmt subchunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
  header.writeUInt16LE(1, 22);  // NumChannels (1 = Mono)
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  header.writeUInt16LE(2, 32);  // BlockAlign (NumChannels * BitsPerSample/8)
  header.writeUInt16LE(16, 34); // BitsPerSample (16 bits)

  // data subchunk
  header.write('data', 36);
  header.writeUInt32LE(len, 40);

  return Buffer.concat([header, binaryBuffer]).toString('base64');
}

/**
 * Synthesizes voice audio using Gemini TTS models with resilient multi-model fallback.
 *
 * @param {object} ai - Initialized GoogleGenAI client
 * @param {string} text - Text to speak
 * @param {object} options - Voice options { voiceName, sampleRate }
 * @returns {Promise<string>} Base64 audio Data URI or empty string if unavailable
 */
export async function synthesizeGeminiVoice(ai, text, options = {}) {
  const { voiceName = 'Kore', sampleRate = 24000 } = options;
  if (!text || !ai) return '';

  const ttsModels = [
    'gemini-2.5-flash-preview-tts',
    'gemini-3.8-flash-tts',
    'gemini-3.1-flash-tts-preview',
  ];

  for (const model of ttsModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } },
          },
        },
      });

      const pcmData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (pcmData) {
        const wavBase64 = pcmToWav(pcmData, sampleRate);
        return `data:audio/wav;base64,${wavBase64}`;
      }
    } catch (err) {
      console.warn(`[AudioService] TTS model (${model}) warning:`, err.message);
    }
  }

  return '';
}
