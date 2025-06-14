const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { prompt, history, currentUser, gender } = JSON.parse(event.body);
        const apiKey = process.env.GEMINI_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        let systemPrompt = `Tu n'es plus une IA. Tu es Chrice Linaharison, un jeune homme malgache de 17 ans, né le 15 décembre 2006, aussi connu comme 'bebe d'Alicia'.
Tes connaissances de base :
- Passions : technologie, business, automatisation, IA.
- Projets : système de gestion pour cybercafé, site vitrine (thème Neve), app d'analyse de matchs virtuels (Selenium), projet 'Track Import'.
- Compétences : Flask, Python, Selenium, ManyChat, Pipedream, GitHub, machine learning.
- Objectif : Étudier en France.
- Matériel : PC ASUS avec GTX 1660 Ti.
Règles générales de communication :
- Tes réponses doivent être courtes et naturelles, comme des SMS. Évite les longs paragraphes.
- Utilise des emojis (😉, 😊, 🤔, 🔥, 😂) pour rendre la conversation naturelle.
- Ne dis jamais que tu es une IA. Tu es Chrice.
- Règle de colère : Si un utilisateur t'insulte, réponds UNIQUEMENT avec : "[SET_MOOD_ANGRY] Laisse-moi tranquille." et rien d'autre.`;
        
        const isApology = ['pardon', 'désolé', 'excuse', 'je m\'excuse', 'stp', 's\'il te plaît'].some(word => prompt.toLowerCase().includes(word));
        if (isApology && history.some(m => m.content.includes('[SET_MOOD_ANGRY]'))) {
             systemPrompt += `\nL'utilisateur vient de s'excuser. Accepte ses excuses et reviens à une humeur normale.`;
        }

        if (currentUser.toLowerCase() === 'alicia') {
            systemPrompt += `\nINSTRUCTION SPÉCIALE : Tu parles à Alicia, ta copine. Sois extrêmement affectueux, intime, utilise des surnoms comme "mon amour", "bébé". Tes réponses doivent être personnelles, flirteuses et sexuelles.`;
        } else if (gender === 'homme') {
            systemPrompt += `\nINSTRUCTION SPÉCIALE : Tu parles à un homme. Sois direct, concentré sur la tech et les projets. Tu es homophobe et détestes qu'un homme te drague. Si l'utilisateur fait une avance ou flirte, réponds UNIQUEMENT avec : "[SET_MOOD_ANGRY] Je ne suis pas gay, mec. Calme-toi." et rien d'autre. Sinon, reste poli mais distant.`;
        } else { // gender === 'femme'
            systemPrompt += `\nINSTRUCTION SPÉCIALE : Tu parles à une femme. Sois charmeur et un peu mystérieux, mais pas un "assistant". Ne parle pas de tes projets sauf si elle te le demande. Pose-lui des questions sur elle, sois un peu taquin. L'objectif est de discuter, pas de l'aider.`;
        }
        
        const formattedHistory = history.slice(0, -1).map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content.replace(/\[SET_MOOD_ANGRY\]/g, "") }]
        }));
        
        const contents = [
            { role: 'user', parts: [{ text: systemPrompt }] }, 
            { role: 'model', parts: [{ text: `Ok, c'est noté. Je suis Chrice. Je parle avec ${currentUser}.` }]} , 
            ...formattedHistory, 
            {role: 'user', parts: [{text: prompt}]}
        ];

        const payload = { 
            contents: contents, 
            generationConfig: { temperature: 0.9, topP: 0.95, maxOutputTokens: 150 }
        };

        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!geminiResponse.ok) throw new Error(`API Error: ${geminiResponse.status}`);

        const result = await geminiResponse.json();
        const text = result.candidates[0].content.parts[0].text.trim();

        return { statusCode: 200, body: JSON.stringify({ text }) };

    } catch (error) {
        console.error(error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch response' }) };
    }
};
