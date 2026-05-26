// src/server.js
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Inicializar o Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Função para gerar tema aleatório com IA
async function gerarTemaAleatorio() {
    // Prompts variados para gerar temas diferentes
    const prompts = [
        "Gere um tema de redação no estilo ENEM sobre um assunto atual e polêmico no Brasil. Responda APENAS com o tema, sem explicações.",
        
        "Crie um tema de redação dissertativa-argumentativa sobre um problema social pouco discutido. Responda APENAS com o tema.",
        
        "Pense em um tema criativo e original para redação sobre tecnologia e sociedade. Responda APENAS com o tema.",
        
        "Gere um tema de redação sobre meio ambiente e sustentabilidade com um enfoque inovador. Responda APENAS com o tema.",
        
        "Crie um tema de redação sobre educação no Brasil que gere reflexão. Responda APENAS com o tema.",
        
        "Gere um tema de redação sobre saúde pública e bem-estar social. Responda APENAS com o tema.",
        
        "Crie um tema de redação sobre cultura, arte e identidade brasileira. Responda APENAS com o tema.",
        
        "Gere um tema de redação sobre ética e cidadania na sociedade atual. Responda APENAS com o tema.",
        
        "Crie um tema de redação sobre desigualdade social e oportunidades. Responda APENAS com o tema.",
        
        "Gere um tema de redação sobre o futuro do trabalho e novas profissões. Responda APENAS com o tema."
    ];
    
    // Escolher um prompt aleatório
    const promptAleatorio = prompts[Math.floor(Math.random() * prompts.length)];
    
    try {
        const result = await model.generateContent(promptAleatorio);
        let tema = result.response.text().trim();
        
        // Remover aspas se tiver
        tema = tema.replace(/^["']|["']$/g, '');
        
        return tema;
    } catch (error) {
        console.error('Erro ao gerar tema:', error);
        throw error;
    }
}

// Endpoint para gerar tema aleatório
app.get('/api/redacao/tema', async (req, res) => {
    try {
        const tema = await gerarTemaAleatorio();
        res.json({
            sucesso: true,
            tema: tema,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            erro: error.message,
            tema: "Os desafios da educação brasileira no século XXI" // fallback
        });
    }
});

// Endpoint para gerar tema com categoria específica
app.get('/api/redacao/tema/:categoria', async (req, res) => {
    const { categoria } = req.params;
    
    const promptsPorCategoria = {
        tecnologia: "Gere um tema de redação ENEM sobre tecnologia e seus impactos na sociedade. Responda APENAS com o tema.",
        meioambiente: "Gere um tema de redação ENEM sobre meio ambiente, sustentabilidade e mudanças climáticas. Responda APENAS com o tema.",
        educacao: "Gere um tema de redação ENEM sobre educação, aprendizagem e formação de cidadãos. Responda APENAS com o tema.",
        saude: "Gere um tema de redação ENEM sobre saúde pública, bem-estar e qualidade de vida. Responda APENAS com o tema.",
        cultura: "Gere um tema de redação ENEM sobre cultura, arte e diversidade brasileira. Responda APENAS com o tema.",
        politica: "Gere um tema de redação ENEM sobre política, cidadania e participação social. Responda APENAS com o tema."
    };
    
    const prompt = promptsPorCategoria[categoria] || promptsPorCategoria.tecnologia;
    
    try {
        const result = await model.generateContent(prompt);
        let tema = result.response.text().trim();
        tema = tema.replace(/^["']|["']$/g, '');
        
        res.json({
            sucesso: true,
            tema: tema,
            categoria: categoria,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            erro: error.message
        });
    }
});

// Endpoint para gerar tema aleatório com botão de "surpresa"
app.get('/api/redacao/tema-surpresa', async (req, res) => {
    const promptSurpresa = `
        Você é um especialista em redação do ENEM.
        Pense em um tema SURPREENDENTE, INUSITADO e CRIATIVO.
        Algo que faça o aluno pensar fora da caixa.
        O tema deve ser atual e relevante.
        Responda APENAS com o tema, sem explicações.
        Exemplo de temas criativos: 
        - "Os impactos das redes sociais na polarização política brasileira"
        - "A gamificação como ferramenta de aprendizado nas escolas"
        - "O papel dos influenciadores digitais na formação de opinião"
    `;
    
    try {
        const result = await model.generateContent(promptSurpresa);
        let tema = result.response.text().trim();
        tema = tema.replace(/^["']|["']$/g, '');
        
        res.json({
            sucesso: true,
            tema: tema,
            tipo: "surpresa",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            erro: error.message
        });
    }
});

// Rota para gerar múltiplos temas de uma vez
app.get('/api/redacao/temas-multiplos/:quantidade', async (req, res) => {
    const quantidade = Math.min(parseInt(req.params.quantidade) || 3, 10);
    
    const prompt = `
        Gere ${quantidade} temas diferentes para redação no estilo ENEM.
        Cada tema deve ser único, atual e relevante.
        Responda APENAS com os temas, um por linha, numerados.
        Exemplo:
        1. Tema um
        2. Tema dois
    `;
    
    try {
        const result = await model.generateContent(prompt);
        const texto = result.response.text().trim();
        
        // Parsear os temas
        const linhas = texto.split('\n');
        const temas = [];
        
        for (const linha of linhas) {
            const match = linha.match(/^\d+\.\s*(.+)$/);
            if (match) {
                temas.push(match[1].trim());
            }
        }
        
        res.json({
            sucesso: true,
            temas: temas,
            quantidade: temas.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            erro: error.message
        });
    }
});

// Health check
app.get('/api/redacao/health', (req, res) => {
    res.json({
        status: 'online',
        servico: 'Microserviço ENEM - IA Generator',
        versao: '2.0.0',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Microserviço ENEM com IA rodando!`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🎲 Temas aleatórios: http://localhost:${PORT}/api/redacao/tema`);
    console.log(`🎯 Tema surpresa: http://localhost:${PORT}/api/redacao/tema-surpresa`);
    console.log(`📚 Múltiplos temas: http://localhost:${PORT}/api/redacao/temas-multiplos/5\n`);
});