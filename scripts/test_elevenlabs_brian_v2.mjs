process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';

const client = new ElevenLabsClient();

// النص مع ضبط الوقف والهاء الساكنة على التاء المربوطة والسكون في نهايات الكلمات
const textPaced = 'تَقِفُونَ الآنْ أَمَامَ صَرْحٍ رُوحِيٍّ مَهِيبْ، جَامِعِ لَالَّة عَزَّهْ العَتِيقْ. تَأَمَّلُوا هَذَا البَابَ الخَشَبِيَّ الأَثَرِيّْ، حَيْثُ نُقِشَتْ عِبَارَةٌ خَالِدَةْ: «بَادِرُوا بِالصَّلَاةْ قَبْلَ الفَوْتْ، وَبَادِرُوا بِالتَّوْبَهْ قَبْلَ المَوْتْ». فِي هَذَا المِحْرَابِ، كَانَ يَجْتَمِعُ اثْنَا عَشَرَ شَيْخاً مِنْ هَيْئَةِ العَزَّابَهْ، لِتَدْبِيرِ شُؤُونِ المَدِينَهْ، بِالشُّورَى وَالإِخَاءْ.';

async function run() {
  console.log('Generating Brian v2 with silent Haa and Sukun pauses...');
  const audioBrian = await client.textToSpeech.convert('nPczCjzI2devNBz1zQrb', {
    text: textPaced,
    modelId: 'eleven_multilingual_v2',
    voiceSettings: {
      stability: 0.55,
      similarityBoost: 0.85
    }
  });
  const streamB = Readable.fromWeb(audioBrian);
  const writeB = createWriteStream('public/audio/samples/lalla_azza_elevenlabs_brian_v2.mp3');
  await new Promise((res, rej) => {
    streamB.pipe(writeB).on('finish', res).on('error', rej);
  });
  console.log('Brian v2 done!');
}

run().catch(console.error);
