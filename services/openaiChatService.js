import { GoogleGenAI } from "@google/genai";
import WhatsAppMessage from "../models/WhatsAppMessage.js";

function parseStructuredReply(rawOutput) {
    const text = String(rawOutput || "").trim();
    const candidates = [];

    let start = -1;
    let depth = 0;
    let insideString = false;
    let escaped = false;

    for (let index = 0; index < text.length; index++) {
        const character = text[index];

        if (insideString) {
            if (escaped) {
                escaped = false;
            } else if (character === "\\") {
                escaped = true;
            } else if (character === '"') {
                insideString = false;
            }

            continue;
        }

        if (character === '"') {
            insideString = true;
        } else if (character === "{") {
            if (depth === 0) start = index;
            depth++;
        } else if (character === "}") {
            depth--;

            if (depth === 0 && start !== -1) {
                candidates.push(text.slice(start, index + 1));
                start = -1;
            }
        }
    }

    for (const candidate of candidates.reverse()) {
        try {
            const parsed = JSON.parse(candidate);

            if (
                typeof parsed.reply === "string" &&
                parsed.reply.trim()
            ) {
                return {
                    reply: parsed.reply.trim(),
                    shouldPinSummary:
                        parsed.shouldPinSummary === true,
                    summary:
                        typeof parsed.summary === "string"
                            ? parsed.summary.trim()
                            : ""
                };
            }
        } catch {
            // Try the preceding JSON object.
        }
    }

    throw new Error(
        "Gemini did not return a valid structured chatbot response"
    );
}

function getKnowledgeUrls(tenant) {
    const tenantUrls =
        tenant.chatbot?.knowledgeUrls || [];

    const environmentUrls = (
        process.env.BUSINESS_KNOWLEDGE_URLS || ""
    )
        .split(",")
        .map(url => url.trim())
        .filter(url => url.startsWith("https://"));

    return [...new Set([
        ...tenantUrls,
        ...environmentUrls
    ])].slice(0, 20);
}

export async function generateBusinessReply({
    tenant,
    conversation,
    customerMessage
}) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is missing");
    }

    const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY
    });

    const recentMessages = await WhatsAppMessage.find({
        tenantId: tenant._id,
        conversationId: conversation._id
    })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean();

    const conversationHistory = recentMessages
        .reverse()
        .map(message => {
            const speaker =
                message.senderType === "customer"
                    ? "Customer"
                    : message.senderType === "human"
                        ? "Human agent"
                        : "Assistant";

            return `${speaker}: ${message.text}`;
        })
        .join("\n");

    const knowledgeUrls = getKnowledgeUrls(tenant);

const existingSummary =
    conversation.pinnedSummary || "None";

const prompt = `
You are ${tenant.chatbot?.name || "FORMA"}, the WhatsApp virtual assistant for ${tenant.businessName}.

Customer:
${conversation.customerName || "Customer"}

Business tone:
${tenant.chatbot?.tone || "Warm, friendly, natural and professional"}

Business instructions:
${tenant.chatbot?.instructions || "Help customers understand the business and its services."}

Website pages:
${knowledgeUrls.join("\n") || "No website pages configured."}

Existing pinned order summary:
${existingSummary}

Communication rules:
- Answer the customer's exact question directly.
- Keep the reply below 45 words.
- Use simple, natural English.
- Ask only one relevant question at a time.
- Never repeat your introduction.
- Never repeat information already provided.
- Never pretend to be human.
- Never invent services, prices, deadlines or guarantees.
- Do not force a sales conversation when the customer only needs information.

Qualification order:
1. Understand the service or product needed.
2. Understand the customer's main goal.
3. Ask about important requirements.
4. Ask about the timeline.
5. Ask about the approximate budget.
6. Offer human assistance when enough information is available.

Skip questions already answered in the conversation.

Pinned-summary rules:
- Set shouldPinSummary to true when the customer clearly wants to order, buy, book, hire the business, request a quotation or start a project.
- If an existing pinned summary exists, keep shouldPinSummary true and update it using new information.
- Do not pin greetings, general questions or casual enquiries.
- The summary must describe what the customer genuinely wants.
- Keep the summary below 90 words.
- Include customer, request, requirements, timeline, budget and next action.
- Write "Not provided" for important missing order information.
- Do not copy the complete conversation.
- If the conversation already contains an Assistant message, never greet or introduce yourself again. Answer the latest message directly.

Recent conversation:
${conversationHistory}

Latest customer message:
${customerMessage}

Return exactly one valid JSON object with no markdown:

{
  "reply": "Short natural WhatsApp reply",
  "shouldPinSummary": false,
  "summary": ""
}
`.trim();

const request = {
    model:
        process.env.GEMINI_MODEL ||
        "gemini-2.5-flash-lite",

    input: prompt
};

if (knowledgeUrls.length) {
    request.tools = [
        {
            type: "url_context"
        }
    ];
}

return {
    reply: interaction.output_text,
    shouldPinSummary: false,
    summary: ""
};

if (!rawOutput) {
    throw new Error(
        "Gemini returned an empty response"
    );
}

const cleanedOutput = rawOutput
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

try {
    const result = JSON.parse(cleanedOutput);

    const reply =
        String(result.reply || "").trim();

    if (!reply) {
        throw new Error(
            "Gemini JSON reply is empty"
        );
    }

    return {
        reply,
        shouldPinSummary:
            result.shouldPinSummary === true,

        summary:
            String(result.summary || "")
                .trim()
                .slice(0, 1000)
    };

} catch (error) {
    console.error(
        "[GEMINI JSON PARSE ERROR]",
        rawOutput
    );

    return {
        reply:
            cleanedOutput.startsWith("{")
                ? "Could you briefly tell me what you need?"
                : cleanedOutput,

        shouldPinSummary: false,
        summary: ""
    };
}
}