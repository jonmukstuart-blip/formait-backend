// backend/routes/aiAgent.js
import express from 'express';
import { promises as fs } from 'fs'; 
import path from 'path';
import axios from 'axios';

const router = express.Router();

// Resolves file relative to your execution folder safely
const getWorkspaceRootPath = (targetRelativePath) => {
    return path.resolve(process.cwd(), targetRelativePath);
};

const getIo = async () => {
    try {
        const serverModule = await import('../server.js');
        return serverModule.io;
    } catch(e) {
        return null;
    }
};

async function readFileTool(filePath) {
    const fullPath = getWorkspaceRootPath(filePath);
    return await fs.readFile(fullPath, 'utf-8');
}

async function writeFileTool(filePath, content) {
    const fullPath = getWorkspaceRootPath(filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
    
    const io = await getIo();
    if (io) {
        io.emit('globalWorkspaceSyncRequest', {
            type: 'FILE_MUTATION',
            target: filePath,
            timestamp: new Date()
        });
    }
    return `Successfully updated ${filePath}`;
}

router.post('/execute-loop', async (req, res) => {
    const { userGoal } = req.body;
    let executionLogs = [];
    
    // File targeted for agent mutation updates
    const targetFile = 'routes/admin.js';

    try {
        executionLogs.push(`<div class="text-blue-400">[PLAN] Reading target module: ${targetFile}...</div>`);
        const currentCode = await readFileTool(targetFile);

        executionLogs.push(`<div class="text-amber-400">[LLM] Dispatching prompt pipeline...</div>`);
        
        // --- Live API Call Pipeline Execution ---
        const response = await axios.post('https://openai.com', {
            model: 'gpt-4o', 
            messages: [
                {
                    role: 'system',
                    content: `You are an automated backend engineer tool engine. You receive code files and objective instructions. You MUST analyze the goal, perform the requested updates, and output ONLY the raw, completely updated JavaScript string without code block wrapper markers like \`\`\`javascript.`
                },
                {
                    role: 'user',
                    content: `Goal: ${userGoal}\n\nExisting Code:\n${currentCode}`
                }
            ],
            temperature: 0.2
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // 🎯 SYNTAX CORRECTION FIX: Clean parsing mapping matrix check
        const choices = response.data?.choices;
        if (!choices || !Array.isArray(choices) || choices.length === 0) {
            throw new Error("OpenAI responded with empty or missing payload selections.");
        }

        const updatedCodeRaw = choices[0]?.message?.content?.trim();
        if (!updatedCodeRaw) {
            throw new Error("The AI response payload stream block content was empty.");
        }
        
        const cleanedCode = updatedCodeRaw.replace(/^```javascript\n|```js\n|```\n/g, '').replace(/\n```$/g, '');

        executionLogs.push(`<div class="text-purple-400">[EXECUTE] Rewriting atomic codebase block layers...</div>`);
        const writeStatus = await writeFileTool(targetFile, cleanedCode);
        
        executionLogs.push(`<div class="text-emerald-400">[VERIFY] ${writeStatus}</div>`);
        executionLogs.push(`<div class="text-emerald-500 font-bold">[SUCCESS] State synchronized across active channels.</div>`);

        return res.status(200).json({
            success: true,
            logs: executionLogs
        });

    } catch (error) {
        console.error("❌ [AI AGENT ENDPOINT CRASHED]:", error.message);
        if (error.response?.data) {
            console.error("📋 Contextual Error Envelope Details:", JSON.stringify(error.response.data));
        }
        
        const errorMsg = error.response?.data?.error?.message || error.message;
        executionLogs.push(`<div class="text-rose-500">[FAILED] Execution error: ${errorMsg}</div>`);
        
        return res.status(500).json({
            success: false,
            error: errorMsg,
            logs: executionLogs
        });
    }
});

export default router;
