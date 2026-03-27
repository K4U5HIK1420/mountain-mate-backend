const { GoogleGenerativeAI } = require("@google/generative-ai");
const Hotel = require("../models/Hotel");
const Transport = require("../models/Transport");
const SupportConversation = require("../models/SupportConversation");

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

function serializeConversation(conversation) {
  return {
    id: String(conversation._id),
    guestLabel: conversation.guestLabel,
    userEmail: conversation.userEmail,
    status: conversation.status,
    handoffReason: conversation.handoffReason,
    lastUserMessage: conversation.lastUserMessage,
    lastAdminMessage: conversation.lastAdminMessage,
    messages: (conversation.messages || []).map((message) => ({
      sender: message.sender,
      text: message.text,
      createdAt: message.createdAt,
    })),
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

function summarizeHotels(rows) {
  return rows.map((hotel) => ({
    name: hotel.hotelName,
    location: hotel.location,
    pricePerNight: hotel.pricePerNight,
    description: hotel.description,
  }));
}

function summarizeRides(rows) {
  return rows.map((ride) => ({
    vehicleType: ride.vehicleType,
    vehicleModel: ride.vehicleModel,
    routeFrom: ride.routeFrom,
    routeTo: ride.routeTo,
    pricePerSeat: ride.pricePerSeat,
    seatsAvailable: ride.seatsAvailable,
  }));
}

async function generateAssistantReply(message, context) {
  if (/\b(admin|human|agent|support person|representative)\b/i.test(message)) {
    return {
      answer: "I am connecting you to an admin now. Your request has been added to the live support queue.",
      needsHuman: true,
      reason: "User requested admin handoff",
    };
  }

  if (!genAI) {
    return {
      answer: "I need to connect you with an admin because the AI assistant is not configured yet.",
      needsHuman: true,
      reason: "AI provider unavailable",
    };
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction:
      "You are Mountain Mate support. Answer only from the provided database context. If the context is missing, unclear, or insufficient, set needsHuman true. Return strict JSON with keys answer, needsHuman, reason.",
  });

  const prompt = `
DATABASE_CONTEXT:
${JSON.stringify(context)}

USER_QUESTION:
${message}

Return strict JSON only:
{"answer":"...","needsHuman":false,"reason":""}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      answer: parsed.answer || "I could not frame a clear answer from the current records.",
      needsHuman: Boolean(parsed.needsHuman),
      reason: parsed.reason || "",
    };
  } catch (_error) {
    return {
      answer: "I could not complete an AI lookup right now, so I have routed your question to an admin for live help.",
      needsHuman: true,
      reason: "AI provider unavailable or quota exceeded",
    };
  }
}

exports.chat = async (req, res, next) => {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required." });
    }

    const [hotels, rides] = await Promise.all([
      Hotel.find({ isVerified: true }).select("hotelName location pricePerNight description").limit(60).lean(),
      Transport.find({ isVerified: true, status: "approved" }).select("vehicleType vehicleModel routeFrom routeTo pricePerSeat seatsAvailable").limit(60).lean(),
    ]);

    const context = {
      hotels: summarizeHotels(hotels),
      rides: summarizeRides(rides),
    };

    const aiReply = await generateAssistantReply(message, context);

    let conversation = null;
    const needsHuman = aiReply.needsHuman;
    if (needsHuman || req.body?.conversationId) {
      conversation = req.body?.conversationId
        ? await SupportConversation.findById(req.body.conversationId)
        : null;

      if (!conversation) {
        conversation = await SupportConversation.create({
          userId: req.user?.id || "",
          userEmail: req.user?.email || "",
          guestLabel: req.user?.email || "Explorer",
          status: needsHuman ? "queued" : "ai_resolved",
          handoffReason: aiReply.reason || "",
          lastUserMessage: message,
          messages: [],
        });
      }

      conversation.messages.push({ sender: "user", text: message });
      conversation.messages.push({ sender: needsHuman ? "ai" : "ai", text: aiReply.answer });
      conversation.lastUserMessage = message;
      conversation.handoffReason = needsHuman ? aiReply.reason || "Needs admin review" : conversation.handoffReason;
      conversation.status = needsHuman ? (conversation.status === "resolved" ? "open" : "queued") : "ai_resolved";
      await conversation.save();

      const io = req.app.get("io");
      io?.to("support-admin").emit("support:queue-updated", serializeConversation(conversation));
      io?.to(`support:${conversation._id}`).emit("support:conversation-updated", serializeConversation(conversation));
    }

    return res.json({
      success: true,
      answer: aiReply.answer,
      needsHuman,
      conversation: conversation ? serializeConversation(conversation) : null,
    });
  } catch (error) {
    next(error);
  }
};

exports.getConversation = async (req, res, next) => {
  try {
    const conversation = await SupportConversation.findById(req.params.id).lean();
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
    const conversations = await SupportConversation.find().sort({ updatedAt: -1 }).lean();
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

    const conversation = await SupportConversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }

    conversation.messages.push({ sender: "admin", text: message });
    conversation.lastAdminMessage = message;
    conversation.status = req.body?.status === "resolved" ? "resolved" : "open";
    await conversation.save();

    const payload = serializeConversation(conversation);
    const io = req.app.get("io");
    io?.to("support-admin").emit("support:queue-updated", payload);
    io?.to(`support:${conversation._id}`).emit("support:conversation-updated", payload);

    return res.json({ success: true, data: payload });
  } catch (error) {
    next(error);
  }
};
