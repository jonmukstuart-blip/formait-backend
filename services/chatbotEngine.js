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
    return `How may I help you?

1. Explore our services
2. View pricing
3. Request a quotation
4. Speak with our team`;
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

if (!conversation.hasIntroduced) {
    const assistantName =
        tenant.chatbot?.name || "Virtual Assistant";

    finalText = `Hello 👋 I’m ${assistantName}, the virtual assistant for ${tenant.businessName}. You can ask to speak with a human at any time.

${text}`;

    conversation.hasIntroduced = true;
    await conversation.save();
}

    await wait(getNaturalDelay(tenant));

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
    tenant
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

    const wantsHuman = [
        "4",
        "human",
        "person",
        "agent",
        "support",
        "team member",
        "real person"
    ].some(keyword => normalized.includes(keyword));

    if (wantsHuman) {
        conversation.humanHandover = true;
        conversation.status = "waiting_for_human";

        await conversation.save();

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

    if (
        normalized === "hello" ||
        normalized === "hi" ||
        normalized === "hey" ||
        normalized === "menu" ||
        normalized === "start"
    ) {
        await reply({
            tenant,
            conversation,
            recipient: incoming.whatsappUserId,
            text: buildMainMenu(tenant)
        });

        return;
    }

    if (normalized === "1") {
        await reply({
            tenant,
            conversation,
            recipient: incoming.whatsappUserId,
            text: `Here are the services offered by ${tenant.businessName}.

Please tell me the service you are interested in, or type “human” to speak with our team.`
        });

        return;
    }

if (normalized === "2") {
    conversation.state = "collecting_pricing_request";
    await conversation.save();

    await reply({
        tenant,
        conversation,
        recipient: incoming.whatsappUserId,
        text: `Pricing depends on the service and what your business needs.

Tell me briefly what you would like built, and I’ll help you request an accurate quotation.`
    });

    return;
}

if (conversation.state === "collecting_pricing_request") {
    conversation.collectedData = {
        ...conversation.collectedData,
        requestedService: incoming.text
    };

    conversation.state = "collecting_quotation";
    await conversation.save();

    await reply({
        tenant,
        conversation,
        recipient: incoming.whatsappUserId,
        text: `A web application sounds good. Please share the main features you need, your preferred timeline and approximate budget.`
    });

    return;
}

    if (normalized === "3") {
        conversation.state = "collecting_quotation";
        await conversation.save();

        await reply({
            tenant,
            conversation,
            recipient: incoming.whatsappUserId,
            text: `Great. Please briefly describe what you need, your preferred timeline and your approximate budget.`
        });

        return;
    }

    if (conversation.state === "collecting_quotation") {
        await Lead.create({
            tenantId: tenant._id,
            name: incoming.customerName,
            phone: incoming.whatsappUserId,
            message: incoming.text,
            details: "Quotation requested through WhatsApp",
            source: "WhatsApp Chatbot",
            status: "new"
        });

        conversation.state = "main_menu";
        await conversation.save();

        await reply({
            tenant,
            conversation,
            recipient: incoming.whatsappUserId,
            text: `Thank you. Your quotation request has been shared with the ${tenant.businessName} team. They will contact you shortly.

Type “menu” if you need anything else.`
        });

        return;
    }

    if (process.env.AI_ENABLED !== "true") {
    await reply({
        tenant,
        conversation,
        recipient: incoming.whatsappUserId,
        text: `I didn’t quite understand that.

${buildMainMenu(tenant)}

You can also type “human” at any time to speak with our team.`
    });

    return;
}

try {
    const intelligentReply =
        await generateBusinessReply({
            tenant,
            conversation,
            customerMessage: incoming.text
        });

    await reply({
        tenant,
        conversation,
        recipient: incoming.whatsappUserId,
        text: intelligentReply
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
        text: `I’m having a little trouble answering that right now.

Please type “human” to speak with our team, or type “menu” to see the available options.`
    });
}
}