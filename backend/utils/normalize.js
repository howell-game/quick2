function normalizeStatus(status = "") {
    status = String(status).trim().toLowerCase();

    if (
        [
            "successful",
            "success",
            "completed",
            "complete",
            "paid"
        ].includes(status)
    )
        return "successful";

    if (
        [
            "processing",
            "pending",
            "queued",
            "new"
        ].includes(status)
    )
        return "processing";

    if (
        [
            "failed",
            "failure",
            "error",
            "declined"
        ].includes(status)
    )
        return "failed";

    if (
        [
            "cancelled",
            "canceled",
            "reversed"
        ].includes(status)
    )
        return "cancelled";

    return status;
}

function normalizeEvent(event = "") {
    return String(event).trim().toLowerCase();
}

function normalizeType(type = "") {
    type = String(type).trim().toLowerCase();

    if (
        [
            "collection",
            "card",
            "bank_transfer",
            "bank transfer",
            "mobilemoney",
            "mobile_money"
        ].includes(type)
    )
        return "deposit";

    if (
        [
            "transfer",
            "withdraw",
            "withdrawal",
            "payout"
        ].includes(type)
    )
        return "withdrawal";

    return type;
}

module.exports = {
    normalizeStatus,
    normalizeEvent,
    normalizeType,
};