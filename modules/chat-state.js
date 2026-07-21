(function installModelTabChatState(global) {
  "use strict";

  function normalizeMessage(message, options) {
    if (!message || typeof message !== "object") return null;
    return {
      id: options.safeId(message.id),
      role: message.role === "user" ? "user" : "assistant",
      content: String(message.content || ""),
      attachments: Array.isArray(message.attachments) ? message.attachments.filter(options.isSafeAttachment) : [],
      provider: message.provider ? String(message.provider) : undefined,
      model: message.model ? String(message.model) : undefined,
      error: Boolean(message.error),
      createdAt: String(message.createdAt || new Date().toISOString()),
    };
  }

  function stripAttachmentPayloads(state) {
    const slim = structuredClone(state);
    for (const chat of slim.conversations || []) {
      for (const message of chat.messages || []) {
        message.attachments = (message.attachments || []).map((attachment) => ({
          id: attachment.id,
          name: attachment.name,
          type: attachment.type,
          size: attachment.size,
          omitted: true,
        }));
      }
    }
    return slim;
  }

  function requestMessageCopy(message, isLatest, settings, compactWhitespace) {
    const keepAttachments = settings.historyImages || isLatest;
    return {
      ...message,
      content: compactWhitespace(message.content || ""),
      attachments: keepAttachments ? (message.attachments || []) : [],
    };
  }

  function trimMessagesForRequest(messages, chat, settings, compactWhitespace, estimateRequestTokens) {
    let requestMessages = [...messages];
    if (settings.autoTrim) {
      const maxMessages = Math.max(1, settings.recentTurns * 2);
      requestMessages = requestMessages.slice(-maxMessages);
    }
    requestMessages = requestMessages
      .map((message, index) => requestMessageCopy(message, index === requestMessages.length - 1, settings, compactWhitespace))
      .filter((message) => message.content || message.attachments?.length || message.role === "assistant");
    if (!settings.autoTrim) return requestMessages;
    while (requestMessages.length > 1 && estimateRequestTokens(requestMessages, chat) > settings.maxInputTokens) {
      requestMessages.shift();
    }
    return requestMessages;
  }

  function chatForRequest(chat, pendingAssistantId, settings, compactWhitespace, estimateRequestTokens) {
    const eligible = chat.messages.filter((message) => {
      if (message.id === pendingAssistantId || message.error) return false;
      if (message.role === "assistant") return Boolean(message.content?.trim());
      return message.role === "user";
    });
    return {
      ...chat,
      messages: trimMessagesForRequest(eligible, chat, settings, compactWhitespace, estimateRequestTokens),
    };
  }

  global.ModelTabChatState = Object.freeze({
    chatForRequest,
    normalizeMessage,
    requestMessageCopy,
    stripAttachmentPayloads,
    trimMessagesForRequest,
  });
})(globalThis);
