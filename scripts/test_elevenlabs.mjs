import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';

const client = new ElevenLabsClient();
const text = 'تَقِفُونَ الآنَ أَمَامَ صَرْحٍ رُوحِيٍّ مَهِيبٍ، جَامِعِ لَالَّة عَزَّة العَتِيقِ. تَأَمَّلُوا هَذَا البَابَ الخَشَبِيَّ الأَثَرِيَّ، حَيْثُ حُفِرَتْ عِبَارَةٌ خَالِدَةٌ: بَادِرُوا بِالصَّلَاةِ قَبْلَ الفَوْتِ، وَبَادِرُوا بِالتَّوْبَةِ قَبْلَ المَوْتِ.';

async function run() {
  console.log('Generating George sample...');
  const audioGeorge = await client.textToSpeech.convert('JBFqnCBsd6RMkjVDRZzb', {
    text,
    modelId: 'eleven_multilingual_v2',
  });
  const streamG = Readable.fromWeb(audioGeorge);
  const writeG = createWriteStream('public/audio/samples/lalla_azza_elevenlabs_george.mp3');
  await new Promise((res, rej) => {
    streamG.pipe(writeG).on('finish', res).on('error', rej);
  });
  console.log('George done!');

  console.log('Generating Brian sample...');
  const audioBrian = await client.textToSpeech.convert('nPczCjzI2devNBz1zQrb', {
    text,
    modelId: 'eleven_multilingual_v2',
  });
  const streamB = Readable.fromWeb(audioBrian);
  const writeB = createWriteStream('public/audio/samples/lalla_azza_elevenlabs_brian.mp3');
  await new Promise((res, rej) => {
    streamB.pipe(writeB).on('finish', res).on('error', rej);
  });
  console.log('Brian done!');
}

run().catch(console.error);
