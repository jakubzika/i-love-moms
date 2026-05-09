"use client";

import { FlowerTools } from "@/components/tools/flower-tools";
import {
  ToolConfirmationProvider,
  useHasActiveToolConfirmation,
} from "@/components/tools/tool-confirmation";
import {
  FlowerCardProvider,
  useFlowerCard,
} from "@/context/flower-card-context";
import { BACKGROUND_PRESETS } from "@/flowers/backgrounds";
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
  const { displayCard } = useFlowerCard();
  const bg = BACKGROUND_PRESETS[displayCard.background];

  return (
    <main className="relative flex h-screen overflow-hidden">
      {/* ambient background layers tinted by current card */}
      <div
        className="absolute inset-0 -z-10 transition-all duration-700"
        style={{ background: bg.css, opacity: 0.35, filter: "blur(80px)" }}
      />
      <div className="absolute inset-0 -z-10 bg-neutral-100/70" />

      <div className="flex flex-1 items-center justify-center overflow-auto p-10">
        <FlowerTools />
        <FlowerPreview />
      </div>

      <div className="w-xl h-screen bg-white/80 backdrop-blur-xl border-l border-black/5 shadow-2xl flex flex-col">
        <div className="h-12 px-5 flex items-center gap-2 border-b border-black/5">
          <Flower2 className="size-5 text-neutral-700" strokeWidth={1.8} />
          <span className="font-instrument text-xl font-bold tracking-tight">
            Flower Copilot
          </span>
        </div>
        <CopilotChat
          className="flex-1 min-h-0"
          disableSystemMessage={true}
          Messages={FlowerChatMessages}
          RenderSuggestionsList={FlowerChatSuggestions}
          suggestions={[
            {
              title: "Card options",
              message: "Show me three complete card design options I can choose from.",
            },
            {
              title: "Change background",
              message: "Change the card background to sage.",
            },
            {
              title: "Rewrite message",
              message: "Rewrite the card message in a heartfelt, classic style.",
            },
            {
              title: "Different bouquet",
              message: "Suggest a few different bouquet variations I can pick from.",
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
