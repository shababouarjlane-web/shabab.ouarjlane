process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';

const client = new ElevenLabsClient();
const text = 'تَقِفُونَ الآنَ أَمَامَ صَرْحٍ رُوحِيٍّ مَهِيبٍ، جَامِعِ لَالَّة عَزَّة العَتِيقِ. تَأَمَّلُوا هَذَا البَابَ الخَشَبِيَّ الأَثَرِيَّ، حَيْثُ حُفِرَتْ عِبَارَةٌ خَالِدَةٌ: بَادِرُوا بِالصَّلَاةِ قَبْلَ الفَوْتِ، وَبَادِرُوا بِالتَّوْبَةِ قَبْلَ المَوْتِ.';

async function run() {
  console.log('Generating Sarah sample...');
  const audioSarah = await client.textToSpeech.convert('EXAVITQu4vr4xnSDxMaL', {
    text,
    modelId: 'eleven_multilingual_v2',
  });
  const streamS = Readable.fromWeb(audioSarah);
  const writeS = createWriteStream('public/audio/samples/lalla_azza_elevenlabs_sarah.mp3');
  await new Promise((res, rej) => {
    streamS.pipe(writeS).on('finish', res).on('error', rej);
  });
  console.log('Sarah done!');
}

run().catch(console.error);
