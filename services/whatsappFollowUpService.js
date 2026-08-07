import WhatsAppConversation from "../models/WhatsAppConversation.js";

let followUpTimer = null;
let schedulerRunning = false;

async function processDueFollowUps(io) {
    if (schedulerRunning) return;

    schedulerRunning = true;

    try {
        while (true) {
            const now = new Date();

            // Atomically claim one due reminder.
            const conversation =
                await WhatsAppConversation.findOneAndUpdate(
                    {
                        needsFollowUp: true,
                        followUpStatus: "pending",

                        followUpAt: {
                            $ne: null,
                            $lte: now
                        },

                        followUpNotifiedAt: null
                    },
                    {
                        $set: {
                            followUpNotifiedAt: now
                        }
                    },
                    {
                        new: true,
                        sort: {
                            followUpAt: 1
                        }
                    }
                );

            if (!conversation) {
                break;
            }

            const payload = {
                conversationId:
                    conversation._id.toString(),

                customerName:
                    conversation.customerName ||
                    "WhatsApp Customer",

                phone:
                    conversation.whatsappUserId,

                reason:
                    conversation.followUpReason ||
                    "Customer follow-up",

                followUpAt:
                    conversation.followUpAt
            };

            io?.to(
                `tenant:${conversation.tenantId.toString()}`
            ).emit(
                "whatsappFollowUpDue",
                payload
            );

            console.log(
                `[WHATSAPP FOLLOW UP DUE] ${payload.customerName} — ${payload.phone}`
            );
        }

    } catch (error) {
        console.error(
            "[WHATSAPP FOLLOW UP SCHEDULER ERROR]",
            error.message
        );

    } finally {
        schedulerRunning = false;
    }
}

export function startWhatsAppFollowUpScheduler(io) {
    if (followUpTimer) return;

    console.log(
        "[WHATSAPP FOLLOW UP] Reminder engine started"
    );

    processDueFollowUps(io);

    followUpTimer = setInterval(
        () => processDueFollowUps(io),
        30000
    );

    followUpTimer.unref?.();
}