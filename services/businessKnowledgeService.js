import BusinessKnowledge from "../models/BusinessKnowledge.js";

export async function getBusinessKnowledgeContext(
    tenantId
) {
    const records = await BusinessKnowledge.find({
        tenantId,
        active: true
    })
        .sort({
            priority: -1,
            updatedAt: -1
        })
        .limit(100)
        .lean();

    if (!records.length) {
        return "No additional business knowledge configured.";
    }

    return records
        .map(record => {
            return `[${record.category.toUpperCase()}]
${record.title}
${record.content}`;
        })
        .join("\n\n");
}