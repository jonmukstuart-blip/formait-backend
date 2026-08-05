import Lead from "../models/Lead.js";
import WhatsAppConversation from "../models/WhatsAppConversation.js";
import WhatsAppMessage from "../models/WhatsAppMessage.js";
import { sendWhatsAppText } from "./whatsappService.js";
import { generateBusinessReply } from "./openaiChatService.js";

function extractIncomingMessage(payload) {
    const value =
        payload?.entry?.[0]?.changes?.[0]?.value;

    const message = value?.messages?.[0];

    if (!message) return null;

    return {
        whatsappUserId: message.from,
        whatsappMessageId: message.id,
        text:
            message?.text?.body ||
            message?.button?.text ||
            message?.interactive?.button_reply?.title ||
            message?.interactive?.list_reply?.title ||
            "",
        customerName:
            value?.contacts?.[0]?.profile?.name ||
            "WhatsApp Customer"
    };
}

function wait(milliseconds) {
    return new Promise(resolve =>
        setTimeout(resolve, milliseconds)
    );
}

function getNaturalDelay(tenant) {
    const minimum =
        tenant.chatbot?.minimumReplyDelay || 4000;

    const maximum =
        tenant.chatbot?.maximumReplyDelay || 6000;

    return Math.floor(
        Math.random() * (maximum - minimum + 1)
    ) + minimum;
}

function buildMainMenu() {
    return `What would you like help with?

1. Website development
2. Custom software
3. Business automation
4. AI integration
5. WhatsApp chatbot
6. Mobile app development
7. UI/UX and branding
8. Pricing or quotation
9. Speak with our team

Reply with a number or simply describe what you need.`;
}

async function saveMessage({
    tenant,
    conversation,
    whatsappMessageId = "",
    direction,
    senderType,
    text,
    status
}) {
    return WhatsAppMessage.create({
        tenantId: tenant._id,
        conversationId: conversation._id,
        whatsappMessageId,
        direction,
        senderType,
        text,
        status
    });
}

async function reply({
    tenant,
    conversation,
    recipient,
    text
}) {
    let finalText = text;

    const hasPreviousReply = await WhatsAppMessage.exists({
        tenantId: tenant._id,
        conversationId: conversation._id,
        direction: "outgoing"
    });

    const introductionClaim =
        await WhatsAppConversation.updateOne(
            {
                _id: conversation._id,
                tenantId: tenant._id,
                hasIntroduced: { $ne: true }
            },
            {
                $set: {
                    hasIntroduced: true
                }
            }
        );

    if (
        !hasPreviousReply &&
        introductionClaim.modifiedCount === 1
    ) {
        const assistantName =
            tenant.chatbot?.name || "FORMA";

        finalText = `Hi 👋 I’m ${assistantName}, the virtual assistant for ${tenant.businessName}. You can request a human team member whenever you need one.

${text}

${buildMainMenu()}`;
    }

    const targetReplyTime =
    conversation.$locals.replyTargetTime ||
    Date.now();

await wait(
    Math.max(0, targetReplyTime - Date.now())
);

    const result = await sendWhatsAppText({
        tenant,
        recipient,
        text: finalText
    });

    await saveMessage({
        tenant,
        conversation,
        whatsappMessageId:
            result?.messages?.[0]?.id || "",
        direction: "outgoing",
        senderType: "assistant",
        text: finalText,
        status: "sent"
    });
}

export async function processIncomingWhatsAppMessage({
    payload,
    tenant,
    io
}) {
    const incoming = extractIncomingMessage(payload);

    // Ignore delivery reports and non-message events
    if (!incoming || !incoming.text.trim()) {
        return;
    }

    // Prevent duplicate processing
    const duplicate = await WhatsAppMessage.findOne({
        tenantId: tenant._id,
        whatsappMessageId: incoming.whatsappMessageId
    });

    if (duplicate) return;

    const conversation =
        await WhatsAppConversation.findOneAndUpdate(
            {
                tenantId: tenant._id,
                whatsappUserId: incoming.whatsappUserId
            },
            {
                $set: {
                    customerName: incoming.customerName,
                    lastMessageAt: new Date()
                },

                $setOnInsert: {
                    state: "main_menu",
                    humanHandover: false,
                    status: "active",
                    collectedData: {}
                }
            },
            {
                new: true,
                upsert: true
            }
        );

         conversation.$locals.replyTargetTime =
         Date.now() + getNaturalDelay(tenant);

    await saveMessage({
        tenant,
        conversation,
        whatsappMessageId: incoming.whatsappMessageId,
        direction: "incoming",
        senderType: "customer",
        text: incoming.text,
        status: "received"
    });

    // Do not let the bot interrupt a human conversation
    if (conversation.humanHandover) {
        return;
    }

    const normalized =
        incoming.text.trim().toLowerCase();

        if (
    normalized === "menu" ||
    normalized === "services" ||
    normalized === "options"
) {
    await reply({
        tenant,
        conversation,
        recipient: incoming.whatsappUserId,
        text: buildMainMenu()
    });

    return;
}

const wantsHuman =
    normalized === "9" ||
    normalized === "human" ||
    normalized === "agent" ||
    [
        "speak to a human",
        "talk to a human",
        "human agent",
        "real person",
        "team member",
        "speak to someone",
        "talk to someone"
    ].some(phrase => normalized.includes(phrase));

    if (wantsHuman) {
        conversation.humanHandover = true;
        conversation.status = "waiting_for_human";

        await conversation.save();

        const notificationPayload = {
    conversationId: conversation._id,
    customerName: incoming.customerName,
    phone: incoming.whatsappUserId,
    message: incoming.text
};

io?.to(`tenant:${tenant._id.toString()}`)
    .emit(
        "whatsappHumanRequested",
        notificationPayload
    );

io?.to(`tenant:${tenant._id.toString()}`)
    .emit("globalWorkspaceSyncRequest", {
        action: "DATABASE_WHATSAPP_SYNC",
        tab: "whatsapp inbox"
    });

        await Lead.create({
            tenantId: tenant._id,
            name: incoming.customerName,
            phone: incoming.whatsappUserId,
            message: incoming.text,
            details: "Customer requested WhatsApp human support",
            source: "WhatsApp Chatbot",
            status: "new"
        });

        await reply({
            tenant,
            conversation,
            recipient: incoming.whatsappUserId,
            text: `Certainly. I’ve notified the ${tenant.businessName} team. A human team member will continue with you here shortly.`
        });

        return;
    }

if (process.env.AI_ENABLED !== "true") {
    await reply({
        tenant,
        conversation,
        recipient: incoming.whatsappUserId,
        text: `I’m unable to answer automatically right now. Would you like me to connect you with our team?`
    });

    return;
}

try {
const aiResult =
    await generateBusinessReply({
        tenant,
        conversation,
        customerMessage: incoming.text
    });

    if (
    !aiResult ||
    typeof aiResult.reply !== "string" ||
    !aiResult.reply.trim()
) {
    throw new Error(
        "AI response does not contain a valid customer reply"
    );
}

if (
    aiResult.shouldPinSummary &&
    aiResult.summary
) {
    await WhatsAppConversation.findOneAndUpdate(
        {
            _id: conversation._id,
            tenantId: tenant._id
        },
        {
            $set: {
                isPinned: true,
                pinnedSummary: aiResult.summary,
                summaryUpdatedAt: new Date()
            }
        }
    );
}

await reply({
    tenant,
    conversation,
    recipient: incoming.whatsappUserId,
    text: aiResult.reply
});

} catch (error) {
    console.error(
        "[AI CHATBOT ERROR]",
        error.message
    );

    await reply({
        tenant,
        conversation,
        recipient: incoming.whatsappUserId,
        text: `Sorry, I’m having trouble checking that just now. Would you like me to connect you with someone from our team?` });
}
}