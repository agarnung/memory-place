import { Interactable } from "InteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import Event from "InteractionKit.lspkg/Utils/Event";
import { BackPlate } from "UIKit.lspkg/Scripts/BackPlate";
import { Button } from "UIKit.lspkg/Scripts/Components/Button/Button";
import { TextAlignment } from "UIKit.lspkg/Scripts/Components/Content/ElementContent";
import { addContentToElement } from "UIKit.lspkg/Scripts/Components/Content/ElementContentFactory";
import { RoundedRectangleVisual } from "UIKit.lspkg/Scripts/Visuals/RoundedRectangle/RoundedRectangleVisual";
import type { MemoryAnchor, MemoryCard } from "./MemoryPlaceCore";

// Spectacles system icons (Icons.lspkg).
const ICON_REPEAT = requireAsset("Icons.lspkg/Iconography/Arrows/refresh.png") as Texture;
const ICON_NEXT = requireAsset("Icons.lspkg/Iconography/Arrows/arrow-right.png") as Texture;
const ICON_HOME = requireAsset("Icons.lspkg/Iconography/System/home.png") as Texture;
const ICON_CAREGIVER = requireAsset("Icons.lspkg/Iconography/Communication-people/users-group.png") as Texture;
const ICON_FINISH = requireAsset("Icons.lspkg/Iconography/Alerts-notifications/checkmark.png") as Texture;

// World-space Text: em height in cm = size / 43.886 (Lens Text docs).
const TEXT_SIZE_PER_CM = 43.886;

// Type scale, as em height in cm. The card sits 1.5 m away: the prompt's x-height is ~0.8° there
// and ~0.5° from 2.5 m.
const EM_EYEBROW = 2.6;
const EM_PROMPT = 4.4;
const EM_CUE = 3.0;
const EM_CAREGIVER_LABEL = 2.1;
const EM_NOTE = 2.8;
const EM_BUTTON = 2.8;
const EM_PLACE_LABEL = 6.0;

// Palette: light text for an additive display.
const COLOR_PROMPT = "#FFFFFF";
const COLOR_CUE = "#FFD8A8";
const COLOR_CAREGIVER = "#96F2D7";
const COLOR_NOTE = "#E9ECEF";
const COLOR_WELCOME = "#FFD166";

// Layout, in cm, local to the panel root.
const CARD_LEFT = -27;
const CARD_RIGHT = 27;
const CARD_TOP = 45;
const CARD_BOTTOM_WITH_ACTIONS = -19;
const CARD_PADDING = 3.5;
const COLUMN_HALF_WIDTH = CARD_RIGHT - CARD_PADDING;
const ACTION_ROW_Y = -12.5;
const TOOLBAR_Y = -35;
const BUTTON_SIZE = new vec3(22, 9, 2);
const ICON_SIZE = 3.4;
const PLACE_LABEL_HEIGHT = 25;
// The card turns to sit beside the chosen place, this far towards the centre of the ring.
const CARD_OFFSET_FROM_PLACE = 14 * (Math.PI / 180);
const CARD_TURN_SPEED = 4;
// A card unfolds at a calm pace: question first, then the sensory cue, then the caregiver note.
const REVEAL_FADE = 1.0;
const REVEAL_CUE_DELAY = 3.0;
const REVEAL_NOTE_DELAY = 5.5;

type PanelPhase = "welcome" | "card" | "end";

@component
export class MemoryPlaceUI extends BaseScriptComponent {
  @input
  panelRoot!: SceneObject;

  @input
  debugColliders: boolean = false;

  @input
  @allowUndefined
  font: Font;

  public onNext: Event<void> = new Event<void>();
  public onRepeat: Event<void> = new Event<void>();
  public onHome: Event<void> = new Event<void>();
  public onCaregiver: Event<void> = new Event<void>();
  public onEnd: Event<void> = new Event<void>();

  private root!: SceneObject;
  private cardPlate!: BackPlate;
  private cardPlateObject!: SceneObject;
  private titleText!: Text;
  private promptText!: Text;
  private cueText!: Text;
  private caregiverLabelText!: Text;
  private caregiverText!: Text;
  private nextObject!: SceneObject;
  private repeatObject!: SceneObject;
  private homeObject!: SceneObject;
  private caregiverObject!: SceneObject;
  private endButton!: Button;
  private caregiverButton!: Button;
  private phase: PanelPhase = "welcome";
  private anchorLabels: Map<string, Text> = new Map<string, Text>();
  private anchorNames: Map<string, string> = new Map<string, string>();
  private cardRadius = 150;
  private cardHeight = 0;
  private cardYaw = 0;
  private targetYaw = 0;
  private revealStart = -1;
  private lastCardId = "";

  onAwake() {
    this.root = this.panelRoot ?? this.sceneObject;
    if (!this.panelRoot) this.root.getTransform().setLocalPosition(new vec3(0, 0, -150));
    const start = this.root.getTransform().getLocalPosition();
    this.cardRadius = Math.max(1, Math.sqrt(start.x * start.x + start.z * start.z));
    this.cardHeight = start.y;
    this.cardYaw = Math.atan2(start.x, -start.z);
    this.targetYaw = this.cardYaw;
    this.createPanel();
    this.showWelcome();
    this.createEvent("UpdateEvent").bind(() => {
      this.turnTowardsTarget();
      this.updateReveal();
    });
    // Font metrics can settle a frame after creation; lay the card out again once they have.
    this.createEvent("OnStartEvent").bind(() => this.layoutCard());
  }

  /** Turns the card and toolbar to sit beside a place, so the person does not have to look away from it. */
  focusPlace(placePosition: vec3): void {
    const placeYaw = Math.atan2(placePosition.x, -placePosition.z);
    const towardsCentre = Math.min(Math.abs(placeYaw), CARD_OFFSET_FROM_PLACE) * Math.sign(placeYaw);
    this.targetYaw = placeYaw - towardsCentre;
  }

  /** Turns the card back to the front of the ring. */
  focusFront(): void {
    this.targetYaw = 0;
  }

  attachAnchorLabel(anchorObject: SceneObject, anchor: MemoryAnchor): void {
    const label = this.createText(`Label_${anchor.id}`, anchorObject, EM_PLACE_LABEL, anchor.color);
    label.getSceneObject().getTransform().setLocalPosition(new vec3(0, PLACE_LABEL_HEIGHT, 0));
    label.text = anchor.name;
    label.dropshadowSettings.enabled = true;
    label.dropshadowSettings.fill.color = new vec4(0, 0, 0, 0.6);
    label.dropshadowSettings.offset = new vec2(0.08, -0.08);
    this.anchorLabels.set(anchor.id, label);
    this.anchorNames.set(anchor.id, anchor.name);
  }

  markAnchorVisited(anchorId: string): void {
    const label = this.anchorLabels.get(anchorId);
    const name = this.anchorNames.get(anchorId);
    if (!label || !name) return;
    label.text = `${name}\nDone`;
  }

  showWelcome(caregiverMode: boolean = false): void {
    this.phase = "welcome";
    this.stopReveal();
    this.setTitle("Memory Place", COLOR_WELCOME);
    this.promptText.text = "Choose a familiar place.";
    this.cueText.text = "Walk to a place and pinch it to open a memory.";
    this.setButtons(false, false, true, true);
    this.endButton.inactive = false;
    this.showCaregiver(caregiverMode);
  }

  showCard(anchor: MemoryAnchor, card: MemoryCard, caregiverMode: boolean): void {
    this.phase = "card";
    this.setTitle(`${anchor.name} · ${card.title}`, anchor.color);
    this.promptText.text = card.promptEn;
    this.cueText.text = card.sensoryCueEn;
    this.setButtons(true, true, true, true);
    this.endButton.inactive = false;
    this.setCaregiverNote(caregiverMode, caregiverMode ? `Ask next: ${card.followUpEn}` : "");
    if (card.id !== this.lastCardId) {
      this.lastCardId = card.id;
      this.replayCard();
    }
  }

  /** Unfolds the current card again from the start: the question, then the cue, then the caregiver note. */
  replayCard(): void {
    this.revealStart = getTime();
    this.updateReveal();
  }

  showSessionEnd(visitedPlaces: string[] = []): void {
    this.phase = "end";
    this.stopReveal();
    this.setTitle("Session complete", COLOR_CAREGIVER);
    this.promptText.text = "Thank you for sharing these memories.";
    this.cueText.text =
      visitedPlaces.length > 0
        ? `Today you visited ${this.listPlaces(visitedPlaces)}.
Pinch any place to begin again.`
        : "Pinch any place to begin again.";
    this.setButtons(false, false, true, true);
    // Stays in place, greyed out: the bar keeps its shape and shows the session is finished.
    this.endButton.inactive = true;
    this.setCaregiverNote(false, "");
  }

  showCaregiver(enabled: boolean): void {
    // On a card, MemoryPlaceMain redraws it with the follow-up right after this call.
    const guidance =
      "Caregiver mode: choose a place together, read the question aloud, and let the person answer at their own pace.";
    this.setCaregiverNote(enabled, enabled && this.phase !== "end" ? guidance : "");
  }

  private createPanel(): void {
    // Card: one frosted plate with a left-aligned text column and the two main actions.
    this.cardPlateObject = this.createChild("CardPlate", this.root);
    this.cardPlate = this.cardPlateObject.createComponent(BackPlate.getTypeName()) as BackPlate;
    this.cardPlate.style = "dark" as any;

    this.titleText = this.createColumnText("Title", EM_EYEBROW, COLOR_WELCOME);
    this.titleText.letterSpacing = 0.1;
    this.promptText = this.createColumnText("Prompt", EM_PROMPT, COLOR_PROMPT);
    this.promptText.lineSpacing = 1.05;
    this.cueText = this.createColumnText("SensoryCue", EM_CUE, COLOR_CUE);
    this.caregiverLabelText = this.createColumnText("CaregiverLabel", EM_CAREGIVER_LABEL, COLOR_CAREGIVER);
    this.caregiverLabelText.text = "For the caregiver";
    this.caregiverLabelText.capitalizationOverride = CapitalizationOverride.AllUpper;
    this.caregiverLabelText.letterSpacing = 0.1;
    this.caregiverText = this.createColumnText("CaregiverNote", EM_NOTE, COLOR_NOTE);

    this.repeatObject = this.createButton("Repeat", "Repeat", ICON_REPEAT, "Secondary", new vec3(-11.5, ACTION_ROW_Y, 1), () =>
      this.onRepeat.invoke(),
    ).getSceneObject();
    this.nextObject = this.createButton("Next", "Next", ICON_NEXT, "Prism", new vec3(11.5, ACTION_ROW_Y, 1), () =>
      this.onNext.invoke(),
    ).getSceneObject();

    // Toolbar: session controls on their own plate, always in the same place.
    const toolbarObject = this.createChild("ToolbarPlate", this.root);
    toolbarObject.getTransform().setLocalPosition(new vec3(0, TOOLBAR_Y, 0));
    const toolbar = toolbarObject.createComponent(BackPlate.getTypeName()) as BackPlate;
    toolbar.style = "dark" as any;
    toolbar.size = new vec2(3 * BUTTON_SIZE.x + 2 * 1.5 + 2 * 2.5, BUTTON_SIZE.y + 4);

    const toolbarStep = BUTTON_SIZE.x + 1.5;
    this.homeObject = this.createButton("Home", "Home", ICON_HOME, "Secondary", new vec3(-toolbarStep, TOOLBAR_Y, 1), () =>
      this.onHome.invoke(),
    ).getSceneObject();
    this.caregiverButton = this.createButton(
      "Caregiver",
      "Caregiver",
      ICON_CAREGIVER,
      "Secondary",
      new vec3(0, TOOLBAR_Y, 1),
      () => this.onCaregiver.invoke(),
      true,
    );
    this.caregiverObject = this.caregiverButton.getSceneObject();
    this.highlightWhenOn(this.caregiverButton);
    this.endButton = this.createButton("End", "Finish", ICON_FINISH, "Secondary", new vec3(toolbarStep, TOOLBAR_Y, 1), () =>
      this.onEnd.invoke(),
    );
  }

  // Glides the panel around the person at a fixed distance, always facing the centre of the ring.
  private turnTowardsTarget(): void {
    const delta = this.targetYaw - this.cardYaw;
    if (Math.abs(delta) < 0.0005) return;
    this.cardYaw += delta * Math.min(1, getDeltaTime() * CARD_TURN_SPEED);
    const transform = this.root.getTransform();
    transform.setLocalPosition(
      new vec3(this.cardRadius * Math.sin(this.cardYaw), this.cardHeight, -this.cardRadius * Math.cos(this.cardYaw)),
    );
    transform.setLocalRotation(quat.angleAxis(-this.cardYaw, vec3.up()));
  }

  private listPlaces(places: string[]): string {
    if (places.length === 1) return places[0];
    return `${places.slice(0, -1).join(", ")} and ${places[places.length - 1]}`;
  }

  private stopReveal(): void {
    this.revealStart = -1;
    this.lastCardId = "";
    for (const text of [this.promptText, this.cueText, this.caregiverLabelText, this.caregiverText]) {
      this.setAlpha(text, 1);
    }
  }

  private updateReveal(): void {
    if (this.revealStart < 0) return;
    const elapsed = getTime() - this.revealStart;
    const fade = (delay: number) => Math.max(0, Math.min(1, (elapsed - delay) / REVEAL_FADE));
    this.setAlpha(this.promptText, fade(0));
    this.setAlpha(this.cueText, fade(REVEAL_CUE_DELAY));
    this.setAlpha(this.caregiverLabelText, fade(REVEAL_NOTE_DELAY));
    this.setAlpha(this.caregiverText, fade(REVEAL_NOTE_DELAY));
    if (elapsed > REVEAL_NOTE_DELAY + REVEAL_FADE) this.revealStart = -1;
  }

  private setAlpha(text: Text, alpha: number): void {
    const color = text.textFill.color;
    text.textFill.color = new vec4(color.x, color.y, color.z, alpha);
  }

  // A toggle must look switched on: fill the pill in the caregiver teal while the mode is active.
  private highlightWhenOn(button: Button): void {
    const visual = button.visual as RoundedRectangleVisual;
    if (!visual) return;
    const fill = {
      enabled: true,
      type: "Linear" as const,
      start: new vec2(-1, 0),
      end: new vec2(1, 0),
      stop0: { enabled: true, color: new vec4(0.16, 0.58, 0.49, 0.95), percent: 0 },
      stop1: { enabled: true, color: new vec4(0.09, 0.42, 0.36, 0.95), percent: 1 },
    };
    visual.toggledDefaultBaseType = "Gradient";
    visual.toggledHoveredBaseType = "Gradient";
    visual.toggledTriggeredBaseType = "Gradient";
    visual.toggledDefaultGradient = fill;
    visual.toggledHoveredGradient = fill;
    visual.toggledTriggeredGradient = fill;
    visual.borderToggledDefaultColor = this.hexToVec4(COLOR_CAREGIVER);
    visual.borderToggledHoveredColor = this.hexToVec4(COLOR_CAREGIVER);
    visual.borderToggledTriggeredColor = this.hexToVec4(COLOR_CAREGIVER);
  }

  private setTitle(title: string, color: string): void {
    this.titleText.text = title;
    this.titleText.textFill.color = this.hexToVec4(color);
  }

  private setCaregiverNote(enabled: boolean, note: string): void {
    this.caregiverText.text = note;
    this.caregiverLabelText.getSceneObject().enabled = note.length > 0;
    if (this.caregiverButton) this.caregiverButton.isOn = enabled;
    this.layoutCard();
  }

  // Stacks the text column from the top of the card and fits the plate around it.
  private layoutCard(): void {
    const left = CARD_LEFT + CARD_PADDING;
    let y = CARD_TOP - CARD_PADDING;
    y = this.place(this.titleText, left, y, 2.2);
    y = this.place(this.promptText, left, y, 2.0);
    y = this.place(this.cueText, left, y, 2.6);
    if (this.caregiverText.text.length > 0) {
      y = this.place(this.caregiverLabelText, left, y, 0.9);
      y = this.place(this.caregiverText, left, y, 0);
    }
    const hasActions = this.nextObject !== undefined && this.nextObject.enabled;
    const bottom = hasActions ? CARD_BOTTOM_WITH_ACTIONS : y - CARD_PADDING + 1;
    this.cardPlateObject.getTransform().setLocalPosition(new vec3(0, (CARD_TOP + bottom) / 2, 0));
    this.cardPlate.size = new vec2(CARD_RIGHT - CARD_LEFT, CARD_TOP - bottom);
  }

  private place(text: Text, left: number, top: number, gapAfter: number): number {
    text.getSceneObject().getTransform().setLocalPosition(new vec3(left + COLUMN_HALF_WIDTH, top, 0.5));
    return top - this.measureHeight(text) - gapAfter;
  }

  private measureHeight(text: Text): number {
    if (text.text.length === 0) return 0;
    const box = text.getBoundingBox();
    const height = box.top - box.bottom;
    if (height > 0) return height;
    // Fallback before the font has laid out: estimate wrapped lines from the character count.
    const em = text.size / TEXT_SIZE_PER_CM;
    const charsPerLine = Math.max(1, Math.floor((2 * COLUMN_HALF_WIDTH) / (0.5 * em)));
    return Math.ceil(text.text.length / charsPerLine) * em * 1.25;
  }

  private createChild(name: string, parent: SceneObject): SceneObject {
    const object = global.scene.createSceneObject(name);
    object.setParent(parent);
    return object;
  }

  private createText(name: string, parent: SceneObject, emCm: number, color: string): Text {
    const object = this.createChild(name, parent);
    const text = object.createComponent("Component.Text") as Text;
    if (this.font) text.font = this.font;
    text.text = "";
    text.size = Math.round(emCm * TEXT_SIZE_PER_CM);
    text.textFill.color = this.hexToVec4(color);
    return text;
  }

  // Left-aligned block that wraps inside the card column and grows downward from its top edge.
  private createColumnText(name: string, emCm: number, color: string): Text {
    const text = this.createText(name, this.root, emCm, color);
    text.layoutRect = Rect.create(-COLUMN_HALF_WIDTH, COLUMN_HALF_WIDTH, -1, 0);
    text.horizontalOverflow = HorizontalOverflow.Wrap;
    text.verticalOverflow = VerticalOverflow.Overflow;
    text.horizontalAlignment = HorizontalAlignment.Left;
    text.verticalAlignment = VerticalAlignment.Top;
    text.setRenderOrder(2);
    return text;
  }

  private createButton(
    name: string,
    label: string,
    icon: Texture,
    style: string,
    position: vec3,
    onPinch: () => void,
    toggleable: boolean = false,
  ): Button {
    const object = this.createChild(name, this.root);
    object.getTransform().setLocalPosition(position);
    const button = object.createComponent(Button.getTypeName()) as Button;
    button.setVariant({ shape: "Capsule", style });
    button.size = BUTTON_SIZE;
    button.renderOrder = 1;
    if (toggleable) button.setIsToggleable(true);
    const content = addContentToElement(object, {
      text: label,
      leadingIcon: icon,
      textAlignment: TextAlignment.Center,
      textSize: Math.round(EM_BUTTON * TEXT_SIZE_PER_CM),
      spacing: 1.2,
    });
    content.leadingIconSize = ICON_SIZE;
    if (this.font) (content as any)._font = this.font;
    // Initialise now so the Interactable exists even for buttons that start hidden.
    button.initialize();
    const interactable = object.getComponent(Interactable.getTypeName()) as Interactable;
    this.createEvent("OnStartEvent").bind(() => {
      interactable.onTriggerEnd.add(onPinch);
      const label = content.textComponent;
      if (this.font && label) label.font = this.font;
    });
    return button;
  }

  private setButtons(next: boolean, repeat: boolean, home: boolean, caregiver: boolean): void {
    this.nextObject.enabled = next;
    this.repeatObject.enabled = repeat;
    this.homeObject.enabled = home;
    this.caregiverObject.enabled = caregiver;
  }

  private hexToVec4(hex: string): vec4 {
    const value = hex.replace("#", "");
    const r = parseInt(value.slice(0, 2), 16) / 255;
    const g = parseInt(value.slice(2, 4), 16) / 255;
    const b = parseInt(value.slice(4, 6), 16) / 255;
    return new vec4(r, g, b, 1);
  }
}
