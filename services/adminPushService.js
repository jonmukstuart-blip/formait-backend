import webpush from "web-push";
import AdminPushSubscription from
    "../models/AdminPushSubscription.js";

let webPushConfigured = false;

function configureWebPush() {
    if (webPushConfigured) {
        return true;
    }

    const publicKey =
        process.env.VAPID_PUBLIC_KEY;

    const privateKey =
        process.env.VAPID_PRIVATE_KEY;

    const subject =
        process.env.VAPID_SUBJECT ||
        "mailto:info@formaitgroup.com";

    if (!publicKey || !privateKey) {
        console.error(
            "[WEB PUSH] VAPID keys are missing"
        );

        return false;
    }

    webpush.setVapidDetails(
        subject,
        publicKey,
        privateKey
    );

    webPushConfigured = true;

    return true;
}

export async function sendTenantPushNotification({
    tenantId,
    title,
    body,
    url = "/admin.html",
    tag = "formait-admin-alert",
    urgent = false,
    data = {}
}) {
    if (!configureWebPush()) {
        return;
    }

    const subscriptions =
        await AdminPushSubscription.find({
            tenantId,
            active: true
        }).lean();

    if (!subscriptions.length) {
        return;
    }

    const payload = JSON.stringify({
        title,
        body,
        url,
        tag,
        urgent,
        data
    });

    await Promise.allSettled(
        subscriptions.map(async subscription => {
            try {
                await webpush.sendNotification(
                    {
                        endpoint:
                            subscription.endpoint,

                        keys:
                            subscription.keys
                    },
                    payload,
                    {
                        TTL: urgent ? 300 : 60,
                        urgency:
                            urgent ? "high" : "normal"
                    }
                );

                await AdminPushSubscription.updateOne(
                    {
                        _id: subscription._id
                    },
                    {
                        $set: {
                            lastUsedAt: new Date()
                        }
                    }
                );

            } catch (error) {
                console.error(
                    "[WEB PUSH SEND ERROR]",
                    error.statusCode ||
                    error.message
                );

                if (
                    error.statusCode === 404 ||
                    error.statusCode === 410
                ) {
                    await AdminPushSubscription.deleteOne({
                        _id: subscription._id
                    });
                }
            }
        })
    );
}