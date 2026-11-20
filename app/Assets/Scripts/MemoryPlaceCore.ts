export type AnchorShape = "house" | "heart" | "note" | "toolbox" | "leaf" | "suitcase";

export interface MemoryCard {
  id: string;
  title: string;
  titleEs: string;
  prompt: string;
  promptEn: string;
  sensoryCue: string;
  sensoryCueEn: string;
  followUp: string;
  followUpEn: string;
  stage: "early" | "mid";
  domain: string;
}

export interface MemoryAnchor {
  id: string;
  name: string;
  nameEs: string;
  concept: string;
  shape: AnchorShape;
  color: string;
  position: [number, number, number];
  cards: MemoryCard[];
}

export interface MemoryPlaceData {
  version: number;
  title: string;
  unit: string;
  audience: string;
  safety: string;
  anchors: MemoryAnchor[];
}

export type Phase = "idle" | "card" | "session-end";

export interface MemoryPlaceState {
  phase: Phase;
  activeAnchorId: string | null;
  activeCardIndex: number;
  visitedCards: string[];
  message: string;
  caregiverMode: boolean;
}

export interface MemoryPlaceProgress {
  anchorsVisited: number;
  totalAnchors: number;
  cardsSeen: number;
  totalCards: number;
}

export class MemoryPlaceCore {
  private readonly data: MemoryPlaceData;
  private state: MemoryPlaceState;

  constructor(data: MemoryPlaceData) {
    this.validate(data);
    this.data = data;
    this.state = this.freshState();
  }

  getTitle(): string {
    return this.data.title;
  }

  getAudience(): string {
    return this.data.audience;
  }

  getSafety(): string {
    return this.data.safety;
  }

  getAnchors(): MemoryAnchor[] {
    return this.data.anchors;
  }

  getAnchor(anchorId: string): MemoryAnchor | null {
    return this.data.anchors.find((anchor) => anchor.id === anchorId) ?? null;
  }

  getActiveAnchor(): MemoryAnchor | null {
    if (!this.state.activeAnchorId) return null;
    return this.getAnchor(this.state.activeAnchorId);
  }

  getActiveCard(): MemoryCard | null {
    const anchor = this.getActiveAnchor();
    if (!anchor) return null;
    return anchor.cards[this.state.activeCardIndex] ?? null;
  }

  getState(): MemoryPlaceState {
    return {
      ...this.state,
      visitedCards: [...this.state.visitedCards],
    };
  }

  getProgress(): MemoryPlaceProgress {
    const visitedAnchors = new Set<string>();
    for (const cardId of this.state.visitedCards) {
      const anchor = this.findAnchorByCard(cardId);
      if (anchor) visitedAnchors.add(anchor.id);
    }
    return {
      anchorsVisited: visitedAnchors.size,
      totalAnchors: this.data.anchors.length,
      cardsSeen: this.state.visitedCards.length,
      totalCards: this.data.anchors.reduce((sum, anchor) => sum + anchor.cards.length, 0),
    };
  }

  reset(): void {
    this.state = this.freshState();
  }

  openAnchor(anchorId: string): boolean {
    if (this.state.phase === "session-end") return false;
    const anchor = this.getAnchor(anchorId);
    if (!anchor) return false;
    this.state.activeAnchorId = anchorId;
    this.state.activeCardIndex = 0;
    this.state.phase = "card";
    this.state.message = "";
    this.markVisited(anchor.cards[0].id);
    return true;
  }

  nextCard(): boolean {
    if (this.state.phase !== "card") return false;
    const anchor = this.getActiveAnchor();
    if (!anchor) return false;

    if (this.state.activeCardIndex < anchor.cards.length - 1) {
      this.state.activeCardIndex += 1;
      this.markVisited(anchor.cards[this.state.activeCardIndex].id);
      return true;
    }

    this.state.phase = "idle";
    this.state.activeAnchorId = null;
    this.state.activeCardIndex = 0;
    this.state.message = `${anchor.name} complete. Choose another place, or end the session.`;
    return true;
  }

  repeatCard(): MemoryCard | null {
    return this.getActiveCard();
  }

  endSession(): boolean {
    if (this.state.phase === "session-end") return false;
    this.state.phase = "session-end";
    this.state.activeAnchorId = null;
    this.state.activeCardIndex = 0;
    this.state.message = "Session complete. You can start again whenever you like.";
    return true;
  }

  toggleCaregiverMode(): boolean {
    this.state.caregiverMode = !this.state.caregiverMode;
    return this.state.caregiverMode;
  }

  private markVisited(cardId: string): void {
    if (!this.state.visitedCards.includes(cardId)) this.state.visitedCards.push(cardId);
  }

  private findAnchorByCard(cardId: string): MemoryAnchor | null {
    return this.data.anchors.find((anchor) => anchor.cards.some((card) => card.id === cardId)) ?? null;
  }

  private freshState(): MemoryPlaceState {
    return {
      phase: "idle",
      activeAnchorId: null,
      activeCardIndex: 0,
      visitedCards: [],
      message: "Choose a familiar place to begin.",
      caregiverMode: false,
    };
  }

  private validate(data: MemoryPlaceData): void {
    if (data.version !== 1) throw new Error("Unsupported Memory Place version");
    if (data.unit !== "meters") throw new Error("Memory Place must use meters");
    if (!Array.isArray(data.anchors) || data.anchors.length !== 6) {
      throw new Error("Memory Place must have six anchors");
    }

    const anchorIds = new Set<string>();
    const cardIds = new Set<string>();

    for (const anchor of data.anchors) {
      if (anchorIds.has(anchor.id)) throw new Error(`Duplicate anchor ${anchor.id}`);
      anchorIds.add(anchor.id);
      if (!Array.isArray(anchor.position) || anchor.position.length !== 3) {
        throw new Error(`Bad position for ${anchor.id}`);
      }
      if (!Array.isArray(anchor.cards) || anchor.cards.length !== 6) {
        throw new Error(`Anchor ${anchor.id} must have six cards`);
      }
      for (const card of anchor.cards) {
        if (cardIds.has(card.id)) throw new Error(`Duplicate card ${card.id}`);
        cardIds.add(card.id);
        if (!card.prompt || !card.promptEn || !card.sensoryCue || !card.followUp) {
          throw new Error(`Card ${card.id} is incomplete`);
        }
      }
    }
  }
}
