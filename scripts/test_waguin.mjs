process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';

const client = new ElevenLabsClient();

const testText1 = 'هُنَا تَلَاحَمَتْ أَحْيَاءُ بْنِي سِيسِينْ، وَبْنِي واڨِينْ، وَبْنِي إِبْرَاهِيمْ.';
const testText2 = 'هُنَا تَلَاحَمَتْ أَحْيَاءُ بْنِي سِيسِينْ، وَبْنِي واگِينْ، وَبْنِي إِبْرَاهِيمْ.';

async function test() {
  console.log('Testing Gaf (ڨ) vs Kaf with stroke (گ)...');

  // Test 1: with ڨ
  const audio1 = await client.textToSpeech.convert('JBFqnCBsd6RMkjVDRZzb', {
    text: testText1,
    modelId: 'eleven_multilingual_v2',
  });
  const stream1 = Readable.fromWeb(audio1);
  const write1 = createWriteStream('public/audio/samples/test_bni_waguin_gaf.mp3');
  await new Promise((res, rej) => stream1.pipe(write1).on('finish', res).on('error', rej));
  console.log('Test 1 (ڨ) done!');

  // Test 2: with گ
  const audio2 = await client.textToSpeech.convert('JBFqnCBsd6RMkjVDRZzb', {
    text: testText2,
    modelId: 'eleven_multilingual_v2',
  });
  const stream2 = Readable.fromWeb(audio2);
  const write2 = createWriteStream('public/audio/samples/test_bni_waguin_persian_gaf.mp3');
  await new Promise((res, rej) => stream2.pipe(write2).on('finish', res).on('error', rej));
  console.log('Test 2 (گ) done!');
}

test().catch(console.error);
