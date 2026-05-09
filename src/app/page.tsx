"use client";

import { FlowerTools } from "@/components/tools/flower-tools";
import {
  ToolConfirmationProvider,
  useHasActiveToolConfirmation,
} from "@/components/tools/tool-confirmation";
import { FlowerCardProvider } from "@/context/flower-card-context";
import { FlowerPreview } from "@/flowers/flower-preview";
import {
  CopilotChat,
  RenderSuggestionsList,
  useChatContext,
  type MessagesProps,
  type RenderSuggestionsListProps,
} from "@copilotkit/react-ui";
import { Flower2 } from "lucide-react";
import { useEffect, useRef } from "react";

export default function CopilotKitPage() {
  return (
    <FlowerCardProvider>
      <ToolConfirmationProvider>
        <FlowerCardExperience />
      </ToolConfirmationProvider>
    </FlowerCardProvider>
  );
}

function FlowerCardExperience() {
  return (
    <main className="flex h-screen overflow-hidden bg-neutral-100">
      <div className="flex flex-1 items-center justify-center overflow-auto p-6">
        <FlowerTools />
        <FlowerPreview />
      </div>

      <div className="w-xl border-l shadow-xl h-screen bg-white">
        <div className="h-[3rem] px-5 flex items-center font-instrument text-xl font-bold">
          Flower Copilot
        </div>
        <CopilotChat
          className="h-[calc(100vh-3rem)]"
          disableSystemMessage={true}
          Messages={FlowerChatMessages}
          RenderSuggestionsList={FlowerChatSuggestions}
          suggestions={[
            {
              title: "Preset Choices",
              message: "Show me complete preset choices for the flower card.",
            },
            {
              title: "Flower Picker",
              message: "Let me choose the flower types in the bouquet.",
            },
            {
              title: "Preset Cards",
              message: "Show me preset card messages.",
            },
            {
              title: "Type Variations",
              message: "Show me flower type variation presets.",
            },
          ]}
        />
      </div>
    </main>
  );
}

function FlowerChatSuggestions(props: RenderSuggestionsListProps) {
  const hasActiveToolConfirmation = useHasActiveToolConfirmation();

  if (hasActiveToolConfirmation) {
    return null;
  }

  return <RenderSuggestionsList {...props} />;
}

function FlowerChatMessages({
  messages,
  children,
  inProgress,
  AssistantMessage,
  UserMessage,
  ErrorMessage,
  RenderMessage,
  ImageRenderer,
  onRegenerate,
  onCopy,
  onThumbsUp,
  onThumbsDown,
  messageFeedback,
  markdownTagRenderers,
  chatError,
}: MessagesProps) {
  const { icons } = useChatContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, inProgress]);

  const lastMessage = messages[messages.length - 1];
  const showActivity =
    inProgress &&
    (lastMessage?.role === "user" || lastMessage?.role === "tool");
  const hasVisibleConversation = messages.some(isVisibleConversationMessage);

  return (
    <div className="copilotKitMessages">
      <div className="copilotKitMessagesContainer">
        {!hasVisibleConversation ? (
          <FlowerChatWelcomeScreen />
        ) : (
          messages.map((message, index) => (
            <RenderMessage
              key={message.id ?? index}
              message={message}
              messages={messages}
              inProgress={inProgress}
              index={index}
              isCurrentMessage={index === messages.length - 1}
              AssistantMessage={AssistantMessage}
              UserMessage={UserMessage}
              ImageRenderer={ImageRenderer}
              onRegenerate={onRegenerate}
              onCopy={onCopy}
              onThumbsUp={onThumbsUp}
              onThumbsDown={onThumbsDown}
              messageFeedback={messageFeedback}
              markdownTagRenderers={markdownTagRenderers}
            />
          ))
        )}
        {showActivity && <span>{icons.activityIcon}</span>}
        {chatError && ErrorMessage && (
          <ErrorMessage error={chatError} isCurrentMessage />
        )}
        <div ref={messagesEndRef} />
      </div>
      <footer className="copilotKitMessagesFooter">{children}</footer>
    </div>
  );
}

function isVisibleConversationMessage(
  message: MessagesProps["messages"][number],
) {
  if (message.role === "user") {
    return hasMessageContent(message);
  }

  if (message.role === "assistant") {
    return hasMessageContent(message) || hasToolCalls(message);
  }

  if (message.role === "tool") {
    return hasMessageContent(message);
  }

  return false;
}

function hasMessageContent(message: MessagesProps["messages"][number]) {
  if (!("content" in message)) {
    return false;
  }

  if (typeof message.content === "string") {
    return message.content.trim().length > 0;
  }

  if (Array.isArray(message.content)) {
    return message.content.length > 0;
  }

  return Boolean(message.content);
}

function hasToolCalls(message: MessagesProps["messages"][number]) {
  return (
    "toolCalls" in message &&
    Array.isArray(message.toolCalls) &&
    message.toolCalls.length > 0
  );
}

function FlowerChatWelcomeScreen() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center mt-24 text-center">
      <div className="mb-5 flex size-14 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
        <Flower2 className="size-7" strokeWidth={1.8} aria-hidden="true" />
      </div>
      <h2 className="font-instrument text-2xl font-bold text-neutral-950">
        What would you like to do?
      </h2>
      <p className="mt-3 max-w-80 text-sm leading-6 text-neutral-600">
        Ask me to pick flower types, try bouquet type variations, write a card
        message, or explore presets for your flower card.
      </p>
    </div>
  );
}
