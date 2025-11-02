import 'dotenv/config';
import { Ollama } from 'ollama';

async function main() {
  try {
    const ollama = new Ollama({
      host: 'https://ollama.com',
      headers: {
        Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
      },
    });

    const response = await ollama.chat({
      model: 'gpt-oss:120b', 
      messages: [
        { role: 'user', content: 'How many tokens can I use the API from Ollama in free plan? ' },
      ],
      stream: false,
    });

    // The content is in response.message.content
    if (response.message && response.message.content) {
      console.log('Hallucinated Story:\n');
      console.log(response.message.content);
    } else {
      console.log('No content returned. Full response:\n', response);
    }

  } catch (err: any) {
    console.error('Error calling Ollama cloud API:', err.message || err);
  }
}

main();
