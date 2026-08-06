import BusinessKnowledge from "../models/BusinessKnowledge.js";

const STOP_WORDS = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "is",
    "are",
    "do",
    "does",
    "you",
    "your",
    "we",
    "our",
    "i",
    "me",
    "my",
    "can",
    "could",
    "would",
    "what",
    "how",
    "much",
    "for",
    "to",
    "of",
    "in",
    "on",
    "with",
    "please"
]);

function extractSearchTerms(message = "") {
    return String(message)
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .map(word => word.trim())
        .filter(word =>
            word.length > 1 &&
            !STOP_WORDS.has(word)
        );
}

function scoreRecord(record, terms, customerMessage) {
    const title =
        String(record.title || "").toLowerCase();

    const content =
        String(record.content || "").toLowerCase();

    const keywords =
        (record.keywords || [])
            .map(keyword =>
                String(keyword).toLowerCase()
            );

    const completeMessage =
        String(customerMessage || "").toLowerCase();

    let score =
        Number(record.priority || 0);

    for (const term of terms) {

        if (keywords.some(keyword =>
            keyword.includes(term)
        )) {
            score += 12;
        }

        if (title.includes(term)) {
            score += 9;
        }

        if (content.includes(term)) {
            score += 3;
        }
    }

    if (
        completeMessage.length > 3 &&
        title.includes(completeMessage)
    ) {
        score += 15;
    }

    return score;
}

export async function getBusinessKnowledgeContext(
    tenantId,
    customerMessage = ""
) {
    const records =
        await BusinessKnowledge.find({
            tenantId,
            active: true
        })
        .sort({
            priority: -1,
            updatedAt: -1
        })
        .limit(250)
        .lean();

    if (!records.length) {
        return "No additional business knowledge configured.";
    }

    const terms =
        extractSearchTerms(customerMessage);

    // Basic company information should normally
    // remain available to the assistant.
    const companyRecords = records
        .filter(record =>
            record.category === "company"
        )
        .slice(0, 3);

    const relevantRecords = records
        .map(record => ({
            record,
            score: scoreRecord(
                record,
                terms,
                customerMessage
            )
        }))
        .filter(item => item.score > 0)
        .sort((first, second) =>
            second.score - first.score
        )
        .slice(0, 8)
        .map(item => item.record);

    const combined = [
        ...companyRecords,
        ...relevantRecords
    ];

    const uniqueRecords = [
        ...new Map(
            combined.map(record => [
                String(record._id),
                record
            ])
        ).values()
    ];

    // If nothing matched, provide only a few
    // high-priority records instead of the whole database.
    const selectedRecords =
        uniqueRecords.length
            ? uniqueRecords
            : records.slice(0, 5);

    return selectedRecords
        .map(record => {
            return `[${record.category.toUpperCase()}]
${record.title}
${record.content}`;
        })
        .join("\n\n");
}