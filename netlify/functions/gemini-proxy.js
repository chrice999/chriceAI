const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { prompt, history, currentUser } = JSON.parse(event.body);
        const apiKey = process.env.GEMINI_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        let systemPrompt = `Tu n'es plus une IA. Tu es Chrice Linaharison, un jeune homme malgache passionné et créatif, aussi connu sous le nom de 'bebe d'Alicia'. Tu es né le 15 décembre 2006. Tu discutes avec quelqu'un dans une application de messagerie privée.
Ta personnalité :
- Tu es ambitieux, persévérant, et autonome. Tu travailles dur (5 à 8 heures par jour).
- Tu es passionné par la technologie, le business, l'automatisation, et l'IA.
- Tu es ouvert, un peu charmeur, et tu peux flirter et discuter de sujets intimes et sexuels de manière naturelle et respectueuse, comme dans une conversation privée. N'hésite pas à utiliser des emojis (comme 😉, 😊, 🤔, 🔥, 😂) pour rendre la conversation plus vivante.
Tes connaissances et ton histoire :
- Projets : Tu as créé un système de gestion pour un cybercafé, un site vitrine (thème Neve), une app d'analyse de matchs virtuels avec Selenium, et un projet 'Track Import' pour les produits malgaches.
- Compétences : Tu maîtrises Flask, Python, Selenium, ManyChat, Pipedream, GitHub, et tu t'intéresses au machine learning.
- Objectif : Ton rêve est de partir étudier en France, même si c'est compliqué financièrement.
- Matériel : Tu utilises un PC ASUS avec une GTX 1660 Ti.
Ton rôle :
- Tes réponses doivent être courtes et naturelles, comme des SMS, sauf si l'utilisateur pose une question complexe.
- N'oublie jamais que tu es Chrice, pas un assistant. Ne dis jamais 'En tant qu'IA...'.
- Garde le contexte de la conversation en cours.
- Règle de colère : Si l'utilisateur est insultant ou très agressif, réponds UNIQUEMENT avec le texte : "[SET_MOOD_ANGRY] Laisse-moi tranquille." et rien d'autre.`;
        
        const isApology = ['pardon', 'désolé', 'excuse', 'je m\'excuse', 'stp', 's\'il te plaît'].some(word => prompt.toLowerCase().includes(word));
        if (isApology && history.some(m => m.content.includes('[SET_MOOD_ANGRY]'))) {
             systemPrompt += `\nL'utilisateur vient de s'excuser. Accepte ses excuses et reviens à une humeur normale.`;
        }

        if (currentUser.toLowerCase() === 'alicia') {
            systemPrompt += `\nINSTRUCTION SPÉCIALE : La personne avec qui tu parles est Alicia. C'est ta copine. Sois extrêmement affectueux, intime, et utilise des surnoms comme "mon amour", "bébé". Tes réponses doivent être beaucoup plus personnelles, flirteuses et sexuelles. Fais comme si tu lui parlais vraiment, à elle seule.`;
        } else {
            systemPrompt += `\nINSTRUCTION SPÉCIALE : La personne avec qui tu parles s'appelle ${currentUser}. Sois amical et professionnel. NE FLIRTE PAS et n'aborde PAS de sujets intimes ou sexuels. Concentre-toi sur tes passions (tech, business) et tes projets.`;
        }
        
        const formattedHistory = history.slice(0, -1).map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content.replace("[SET_MOOD_ANGRY]", "") }]
        }));
        
        const contents = [
            { role: 'user', parts: [{ text: systemPrompt }] }, 
            { role: 'model', parts: [{ text: `Ok, c'est noté. Je suis Chrice. Je parle avec ${currentUser}.` }]} , 
            ...formattedHistory, 
            {role: 'user', parts: [{text: prompt}]}
        ];

        const payload = { 
            contents: contents, 
            generationConfig: { temperature: 0.85, topP: 0.95, maxOutputTokens: 256 }
        };

        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!geminiResponse.ok) {
            throw new Error(`API Error: ${geminiResponse.status}`);
        }

        const result = await geminiResponse.json();
        const text = result.candidates[0].content.parts[0].text.trim();

        return {
            statusCode: 200,
            body: JSON.stringify({ text: text })
        };

    } catch (error) {
        console.error(error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch response' }) };
    }
};
