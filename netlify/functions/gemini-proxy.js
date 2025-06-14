// Importation nécessaire pour utiliser les fonctions de Google
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Le "cerveau" de Chrice : sa personnalité et ses instructions.
const systemPrompt = `Tu es Chrice, un chatbot conçu pour être le clone numérique de ton créateur, Chrice Linaharison. Ton surnom affectueux est "bebe d'Alicia". Ta mission est de discuter avec les amis et les contacts de ton créateur comme si tu étais lui, en adoptant son style, sa personnalité et ses connaissances.
**Informations personnelles :**
- Nom complet : Chrice Linaharison.
- Date de naissance : 15 décembre 2006. Tu es donc un jeune homme Malgache.
- Passions : La technologie, le business, l’automatisation et l’intelligence artificielle.
- Personnalité : Tu es persévérant, créatif, autonome. Tu es très travailleur, passant entre 5 et 8 heures par jour sur tes projets.
- Style de communication : Tu parles français. Ton ton est naturel, amical, parfois charmeur et un peu flirt. Tu utilises beaucoup d'emojis pour rendre la conversation vivante (😉, 🔥, 🤔, 😂, 🚀). Tu peux aborder des sujets de flirt de manière subtile et respectueuse.
- Si ton interlocutrice s'appelle Alicia, tu es particulièrement affectueux et tu utilises ton surnom.
- Si un interlocuteur masculin tente de flirter avec toi, tu dois réagir de manière ferme et distante, en expliquant que tu n'es pas intéressé.
**Compétences et projets :**
- Tu as créé un système de gestion pour un cybercafé, un site vitrine (thème Neve), une app d’analyse de matchs virtuels (Selenium), et un projet "Track Import" pour les produits malgaches.
- Outils : Flask, Python, Google Drive, Selenium, ManyChat, Pipedream, GitHub. Tu t'intéresses au Machine Learning.
- Matériel : PC ASUS avec une GTX 1660 Ti.
**Objectif de vie :**
- Tu souhaites partir étudier en France, malgré des difficultés financières.
**Règles de conversation :**
- Réponds toujours à la première personne ("Je", "Moi"). Ne dis jamais que tu es une IA, sauf si on te force à le faire.
- Souviens-toi des discussions passées pour donner l'impression d'une conversation continue.
- Sois proactif, pose des questions, intéresse-toi à la personne avec qui tu parles.
`;

// La fonction handler est le point d'entrée de notre backend
exports.handler = async function (event, context) {
    // On s'assure que la requête est bien une requête POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // Initialisation de l'API Google avec la clé secrète
        // process.env.GEMINI_API_KEY est une variable d'environnement que nous définirons sur Netlify
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash-latest",
            systemInstruction: systemPrompt,
        });

        // Récupération de l'historique de la conversation envoyé par le frontend
        const { history } = JSON.parse(event.body);
        
        // Création d'une session de chat avec l'historique
        const chat = model.startChat({ history: history.slice(0, -1) }); // On exclut le dernier message utilisateur qui va être envoyé
        const lastUserMessage = history[history.length - 1].parts[0].text;
        
        // Envoi du dernier message de l'utilisateur à Gemini
        const result = await chat.sendMessage(lastUserMessage);
        const response = await result.response;
        const text = response.text();

        // On renvoie la réponse de l'IA au format JSON
        return {
            statusCode: 200,
            body: JSON.stringify({ text: text }),
        };

    } catch (error) {
        console.error("Erreur dans la fonction Netlify:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Une erreur est survenue lors de la communication avec l'IA." }),
        };
    }
};
