process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';

const client = new ElevenLabsClient();

// مقارنة: بْنِي بْرَاهِيمْ مقابل بْنِي ابْرَاهِيمْ
const test1 = 'هُنَا تَلَاحَمَتْ أَحْيَاءُ بْنِي سِيسِينْ، وَبْنِي واڨِينْ، وَبْنِي بْرَاهِيمْ.';
const test2 = 'هُنَا تَلَاحَمَتْ أَحْيَاءُ بْنِي سِيسِينْ، وَبْنِي واڨِينْ، وَبْنِي ابْرَاهِيمْ.';

async function run() {
  console.log('Testing Brahim without hamza...');
  const a1 = await client.textToSpeech.convert('JBFqnCBsd6RMkjVDRZzb', {
    text: test1,
    modelId: 'eleven_multilingual_v2',
  });
  const s1 = Readable.fromWeb(a1);
  const w1 = createWriteStream('public/audio/samples/test_bni_brahim_1.mp3');
  await new Promise((res, rej) => s1.pipe(w1).on('finish', res).on('error', rej));
  console.log('Test 1 (بني براهيم) done!');

  const a2 = await client.textToSpeech.convert('JBFqnCBsd6RMkjVDRZzb', {
    text: test2,
    modelId: 'eleven_multilingual_v2',
  });
  const s2 = Readable.fromWeb(a2);
  const w2 = createWriteStream('public/audio/samples/test_bni_brahim_2.mp3');
  await new Promise((res, rej) => s2.pipe(w2).on('finish', res).on('error', rej));
  console.log('Test 2 (بني ابراهيم وصل) done!');
}

run().catch(console.error);
