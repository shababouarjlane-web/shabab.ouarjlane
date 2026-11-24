process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';

const client = new ElevenLabsClient();

// تطبيق الملاحظة الجوهرية: كتابة «لَالَّا» بالألف أو الهاء لمنع نطق تاء الوصل نهائياً
// والوقف بالهاء الساكنة على جميع الأسماء المؤنثة
const textPaced = 'تَقِفُونَ الآنْ أَمَامَ صَرْحٍ رُوحِيٍّ مَهِيبْ، جَامِعِ لَالَّا عَزَّهْ العَتِيقْ. تَأَمَّلُوا هَذَا البَابَ الخَشَبِيَّ الأَثَرِيّْ، حَيْثُ نُقِشَتْ عِبَارَةٌ خَالِدَةْ: «بَادِرُوا بِالصَّلَاةْ قَبْلَ الفَوْتِ، وَبَادِرُوا بِالتَّوْبَهْ قَبْلَ المَوْتِ». فِي هَذَا المِحْرَابِ، كَانَ يَجْتَمِعُ اثْنَا عَشَرَ شَيْخاً مِنْ هَيْئَةِ العَزَّابَهْ، لِتَدْبِيرِ شُؤُونِ المَدِينَهْ، بِالشُّورَى وَالإِخَاءْ.';

async function run() {
  console.log('Generating George v3 with Lalla (no Ta) and pure silent Haa...');
  const audio = await client.textToSpeech.convert('JBFqnCBsd6RMkjVDRZzb', {
    text: textPaced,
    modelId: 'eleven_multilingual_v2',
    voiceSettings: {
      stability: 0.55,
      similarityBoost: 0.85
    }
  });
  const stream = Readable.fromWeb(audio);
  const write = createWriteStream('public/audio/samples/lalla_azza_elevenlabs_george_v3.mp3');
  await new Promise((res, rej) => {
    stream.pipe(write).on('finish', res).on('error', rej);
  });
  console.log('George v3 done!');
}

run().catch(console.error);
