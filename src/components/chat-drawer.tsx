"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  RiChatAiLine,
  RiCloseLine,
  RiSendPlane2Line,
  RiSparklingLine,
} from "@remixicon/react";

import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageHeader,
} from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { chatSuggestions, createChatMessage } from "@/lib/chat";
import type {
  ChatFilterPatch,
  ChatFilters,
  ChatMessage,
  ChatResponse,
} from "@/types/chat";

export function OpenChatDrawer({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      onClick={onClick}
      size="icon-lg"
      className={
        className ??
        "fixed right-6 bottom-6 z-50 size-12 rounded-full shadow-lg"
      }
      aria-label="Ouvrir l'assistant Pokémon"
    >
      <RiChatAiLine className="size-5" />
    </Button>
  );
}

function TypingBubble() {
  return (
    <div
      className="flex items-center gap-1 text-muted-foreground"
      aria-label="L'assistant est en train d'écrire"
    >
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="size-1.5 animate-bounce rounded-full bg-current"
          style={{ animationDelay: `${index * 150}ms` }}
        />
      ))}
    </div>
  );
}

function ChatMessageRow({
  message,
  isLast,
}: {
  message: ChatMessage;
  isLast: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <MessageScrollerItem messageId={message.id} scrollAnchor={isLast}>
      <Message align={isUser ? "end" : "start"}>
        {!isUser && (
          <MessageAvatar className="bg-primary/10 text-primary">
            <RiChatAiLine className="size-4" />
          </MessageAvatar>
        )}
        <MessageContent>
          <MessageHeader>{isUser ? "Vous" : "Assistant"}</MessageHeader>
          <Bubble variant={isUser ? "default" : "muted"}>
            <BubbleContent className="whitespace-pre-wrap">
              {message.content}
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  );
}

function ChatEmptyState({
  onSuggestion,
}: {
  onSuggestion: (text: string) => void;
}) {
  return (
    <Empty className="border-0 p-0">
      <EmptyHeader className="max-w-none items-start text-left">
        <EmptyMedia variant="icon">
          <RiSparklingLine />
        </EmptyMedia>
        <EmptyTitle>Assistant Pokémon</EmptyTitle>
        <EmptyDescription>
          Une question sur vos checklists, une localisation ou une évolution ?
          Choisissez une suggestion ou écrivez la vôtre.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="max-w-none items-stretch">
        {chatSuggestions.map((suggestion) => (
          <Button
            key={suggestion}
            variant="outline"
            size="sm"
            className="h-auto justify-start px-3 py-2 text-left whitespace-normal"
            onClick={() => onSuggestion(suggestion)}
          >
            {suggestion}
          </Button>
        ))}
      </EmptyContent>
    </Empty>
  );
}

export function ChatDrawer({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ChatFilters;
  onFiltersChange: (patch: ChatFilterPatch) => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const requestRef = useRef<AbortController | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());

  useEffect(() => {
    return () => requestRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    inputRef.current?.focus();

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  async function sendMessage(text: string) {
    const content = text.trim();

    if (!content || isSending) {
      return;
    }

    const history = [...messages, createChatMessage("user", content)];

    setMessages(history);
    setDraft("");
    setIsSending(true);

    const controller = new AbortController();
    requestRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-chat-session": sessionId,
        },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
          filters,
        }),
        signal: controller.signal,
      });

      const data = (await response.json().catch(() => null)) as
        (ChatResponse & { error?: string }) | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "L'assistant n'a pas pu répondre.");
      }

      if (!data) {
        throw new Error("Réponse invalide de l'assistant.");
      }

      setMessages((current) => [
        ...current,
        createChatMessage("assistant", data.reply),
      ]);

      if (data.filters && Object.keys(data.filters).length > 0) {
        onFiltersChange(data.filters);
      }
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      const message =
        error instanceof Error ? error.message : "Erreur inconnue.";

      setMessages((current) => [
        ...current,
        createChatMessage("assistant", `Désolé : ${message}`),
      ]);
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
      }

      if (!controller.signal.aborted) {
        setIsSending(false);
      }
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(draft);
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      sendMessage(draft);
    }
  }

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-hidden={!open}
      inert={!open}
      data-state={open ? "open" : "closed"}
      className="fixed inset-x-3 bottom-3 z-50 flex h-[min(75svh,36rem)] flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-2xl ring-1 ring-foreground/5 transition-[opacity,transform] duration-200 data-[state=closed]:pointer-events-none data-[state=closed]:translate-y-3 data-[state=closed]:opacity-0 data-[state=open]:translate-y-0 data-[state=open]:opacity-100 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96"
    >
      <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <RiChatAiLine className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-sm font-medium">
              Assistant Pokémon
            </h2>
            <p id={descriptionId} className="text-xs text-muted-foreground">
              Connecté aux filtres du tableau
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onOpenChange(false)}
          aria-label="Fermer l'assistant Pokémon"
        >
          <RiCloseLine />
        </Button>
      </header>

      <MessageScrollerProvider autoScroll defaultScrollPosition="end">
        <MessageScroller className="flex-1">
          <MessageScrollerViewport
            role="log"
            aria-label="Conversation avec l'assistant"
            aria-live="polite"
          >
            <MessageScrollerContent className="gap-4 p-4">
              {messages.length === 0 ? (
                <ChatEmptyState onSuggestion={sendMessage} />
              ) : (
                messages.map((message, index) => (
                  <ChatMessageRow
                    key={message.id}
                    message={message}
                    isLast={!isSending && index === messages.length - 1}
                  />
                ))
              )}

              {isSending && (
                <MessageScrollerItem messageId="typing" scrollAnchor>
                  <Message align="start">
                    <MessageAvatar className="bg-primary/10 text-primary">
                      <RiChatAiLine className="size-4" />
                    </MessageAvatar>
                    <MessageContent>
                      <MessageHeader>Assistant</MessageHeader>
                      <Bubble variant="muted">
                        <BubbleContent>
                          <TypingBubble />
                        </BubbleContent>
                      </Bubble>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>

      <form onSubmit={handleSubmit} className="border-t p-3">
        <InputGroup className="h-auto">
          <InputGroupTextarea
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Posez votre question…"
            aria-label="Votre message"
            rows={1}
            className="max-h-32 min-h-10 py-2.5"
          />
          <InputGroupAddon align="inline-end" className="pb-1.5">
            <InputGroupButton
              type="submit"
              variant="default"
              size="icon-sm"
              disabled={!draft.trim() || isSending}
              aria-label="Envoyer le message"
            >
              <RiSendPlane2Line />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        <p className="mt-2 px-1 text-[11px] text-muted-foreground">
          L&apos;assistant peut modifier les filtres du tableau.
        </p>
      </form>
    </section>
  );
}

export function ChatAssistant({
  filters,
  onFiltersChange,
}: {
  filters: ChatFilters;
  onFiltersChange: (patch: ChatFilterPatch) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {!open && <OpenChatDrawer onClick={() => setOpen(true)} />}
      <ChatDrawer
        open={open}
        onOpenChange={setOpen}
        filters={filters}
        onFiltersChange={onFiltersChange}
      />
    </>
  );
}
