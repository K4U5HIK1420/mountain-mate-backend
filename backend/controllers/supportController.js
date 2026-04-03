const supportStore = require("../services/supportConversationsStore");

function serializeConversation(conversation) {
  const normalizedMessages = (conversation.messages || [])
    .filter((message) => message.sender === "user" || message.sender === "admin")
    .map((message) => ({
      sender: message.sender,
      text: message.text,
      createdAt: message.createdAt,
    }));

  return {
    id: String(conversation.id || conversation._id || ""),
    guestLabel: conversation.guestLabel,
    userEmail: conversation.userEmail,
    status: conversation.status,
    handoffReason: conversation.handoffReason,
    lastUserMessage: conversation.lastUserMessage,
    lastAdminMessage: conversation.lastAdminMessage,
    messages: normalizedMessages,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

function normalizeMessages(messages = []) {
  return (Array.isArray(messages) ? messages : []).map((message) => ({
    sender: message.sender,
    text: message.text,
    createdAt: message.createdAt || new Date().toISOString(),
  }));
}

exports.chat = async (req, res, next) => {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required." });
    }

    let conversation = null;
    conversation = req.body?.conversationId
      ? await supportStore.getConversationById(req.body.conversationId)
      : null;

    if (!conversation) {
      conversation = await supportStore.createConversation({
        userId: String(req.user?.id || ""),
        userEmail: String(req.user?.email || ""),
        guestLabel: req.user?.email || req.user?.user_metadata?.full_name || "Explorer",
        status: "queued",
        handoffReason: "Live admin support requested",
        lastUserMessage: message,
        messages: [],
      });
    }

    const nextMessages = normalizeMessages(conversation.messages);
    nextMessages.push({ sender: "user", text: message, createdAt: new Date().toISOString() });

    conversation.messages = nextMessages;
    conversation.lastUserMessage = message;
    conversation.handoffReason = conversation.handoffReason || "Live admin support requested";
    conversation.status = conversation.status === "resolved" ? "open" : conversation.status || "queued";
    conversation = await supportStore.saveConversation(conversation);

    const io = req.app.get("io");
    io?.to("support-admin").emit("support:queue-updated", serializeConversation(conversation));
    io?.to(`support:${conversation.id}`).emit("support:conversation-updated", serializeConversation(conversation));

    return res.json({
      success: true,
      answer: "",
      needsHuman: true,
      conversation: conversation ? serializeConversation(conversation) : null,
    });
  } catch (error) {
    next(error);
  }
};

exports.getConversation = async (req, res, next) => {
  try {
    const conversation = await supportStore.getConversationById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }
    return res.json({ success: true, data: serializeConversation(conversation) });
  } catch (error) {
    next(error);
  }
};

exports.listAdminConversations = async (_req, res, next) => {
  try {
    const conversations = await supportStore.listConversations();
    return res.json({ success: true, data: conversations.map(serializeConversation) });
  } catch (error) {
    next(error);
  }
};

exports.replyAsAdmin = async (req, res, next) => {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message) {
      return res.status(400).json({ success: false, message: "Reply message is required." });
    }

    let conversation = await supportStore.getConversationById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }

    const nextMessages = normalizeMessages(conversation.messages);
    nextMessages.push({ sender: "admin", text: message, createdAt: new Date().toISOString() });
    conversation.messages = nextMessages;
    conversation.lastAdminMessage = message;
    conversation.status = req.body?.status === "resolved" ? "resolved" : "open";
    conversation = await supportStore.saveConversation(conversation);

    const payload = serializeConversation(conversation);
    const io = req.app.get("io");
    io?.to("support-admin").emit("support:queue-updated", payload);
    io?.to(`support:${conversation.id}`).emit("support:conversation-updated", payload);

    return res.json({ success: true, data: payload });
  } catch (error) {
    next(error);
  }
};
