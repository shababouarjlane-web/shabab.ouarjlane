process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';
import path from 'path';

const client = new ElevenLabsClient();

// نص القصر العتيق مع:
// 1. «بْنِي» بسكون الباء
// 2. «واڨِينْ» بالقاف المعقودة [ɡ]
// 3. «بْنِي بْرَاهِيمْ» بإسقاط الهمزة وتسكين الباء
// 4. سكون نهايات الجمل والوقف بالهاء الساكنة
const text = 'أَهْلاً بِكُمْ فِي رِحَابِ القَصْرِ العَتِيقْ بِوَارْجْلَانْ... أَعْرَقِ التَّجَمُّعَاتِ العُمْرَانِيَّهْ فِي قَلْبِ الصَّحْرَاءِ الجَزَائِرِيَّهْ. تَأَمَّلُوا هَذِهِ السَّقَائِفَ المُظَلَّلَهْ... فَهِيَ لَيْسَتْ مُجَرَّدَ مَمَرَّاتٍ طِينِيَّهْ، بَلْ هَنْدَسَةٌ مَنَاخِيَّهْ عَبْقَرِيَّهْ ابْتَكَرَهَا الأَجْدَادْ، لِكَسْرِ حِدَّةِ الشَّمْسِ، وَخَلْقِ تَيَّارٍ هَوَائِيٍّ يُلَطِّفُ حَرَارَةَ المَنَازِلْ. هُنَا تَلَاحَمَتْ أَحْيَاءُ بْنِي سِيسِينْ، وَبْنِي واڨِينْ، وَبْنِي بْرَاهِيمْ، وَسَادَ مَجْلِسُ العَزَّابَهْ لِيُدِيرَ شُؤُونَ الوَاحَهْ بِعَدْلٍ وَحِكْمَهْ.';

async function run() {
  const dest = path.resolve(process.cwd(), 'public', 'audio', 'tour', 'ksar_atiq.mp3');
  console.log('Generating updated ksar_atiq.mp3 with Bni Brahim (no hamza)...');

  const audioStream = await client.textToSpeech.convert('JBFqnCBsd6RMkjVDRZzb', {
    text,
    modelId: 'eleven_multilingual_v2',
    voiceSettings: {
      stability: 0.55,
      similarityBoost: 0.85
    }
  });

  const stream = Readable.fromWeb(audioStream);
  const writeStream = createWriteStream(dest);
  await new Promise((resolve, reject) => {
    stream.pipe(writeStream).on('finish', resolve).on('error', reject);
  });

  console.log('ksar_atiq.mp3 regenerated successfully with Bni Brahim!');
}

run().catch(console.error);
