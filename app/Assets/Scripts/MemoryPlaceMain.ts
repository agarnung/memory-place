import { Interactable } from "InteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import { MemoryPlaceCore } from "./MemoryPlaceCore";
import type { AnchorShape } from "./MemoryPlaceCore";
import { MEMORY_PLACE_DATA } from "./MemoryPlaceData";
import { MemoryPlaceUI } from "./MemoryPlaceUI";

const DEG = Math.PI / 180;

// One primitive of a place placeholder: centre and size in cm, rotation in degrees (local to the place).
type PlacePart = {
  mesh: "box" | "sphere" | "cylinder" | "cone" | "pyramid";
  center: [number, number, number];
  size: [number, number, number];
  rotation?: [number, number, number];
  color?: string; // overrides the place colour for this part (e.g. a tree trunk)
};

// About 22 cm tall, centred on the place, front facing +Z (towards the user).
const PLACE_PARTS: Record<AnchorShape, PlacePart[]> = {
  house: [
    { mesh: "box", center: [0, -4.5, 0], size: [17, 13, 15] },
    { mesh: "pyramid", center: [0, 6.5, 0], size: [21, 9, 17] },
    { mesh: "box", center: [5.5, 7.5, 0], size: [2.5, 6, 2.5] },
  ],
  heart: [
    // Classic heart: a square turned 45 degrees with a circle on each upper edge.
    { mesh: "box", center: [0, -2, 0], size: [13, 13, 7], rotation: [0, 0, 45] },
    { mesh: "sphere", center: [-4.6, 2.6, 0], size: [13, 13, 7] },
    { mesh: "sphere", center: [4.6, 2.6, 0], size: [13, 13, 7] },
  ],
  note: [
    { mesh: "sphere", center: [-3.5, -7, 0], size: [10, 7.5, 6], rotation: [0, 0, 25] },
    { mesh: "cylinder", center: [1, 2, 0], size: [1.8, 19, 1.8] },
    { mesh: "box", center: [4.5, 8.5, 0], size: [7, 2.4, 1.8], rotation: [0, 0, -35] },
  ],
  toolbox: [
    { mesh: "box", center: [0, -4, 0], size: [22, 13, 12] },
    { mesh: "box", center: [-6, 5, 0], size: [2, 5, 3] },
    { mesh: "box", center: [6, 5, 0], size: [2, 5, 3] },
    { mesh: "box", center: [0, 8.5, 0], size: [14, 2, 3] },
  ],
  leaf: [
    // Garden: a small tree with a brown trunk and a full, rounded canopy.
    { mesh: "cylinder", center: [0, -7.5, 0], size: [3.6, 8, 3.6], color: "#9C6B43" },
    { mesh: "sphere", center: [-6.5, -0.5, 0], size: [10.5, 10, 10], color: "#2BB58C" },
    { mesh: "sphere", center: [6.5, 0, 0], size: [10.5, 10, 10], color: "#2BB58C" },
    { mesh: "sphere", center: [0, 4, 0], size: [16, 15, 13] },
  ],
  suitcase: [
    { mesh: "box", center: [0, -1, 0], size: [17, 17, 8] },
    { mesh: "box", center: [-3.5, 9, 0], size: [1.5, 3, 2] },
    { mesh: "box", center: [3.5, 9, 0], size: [1.5, 3, 2] },
    { mesh: "box", center: [0, 10.8, 0], size: [8.5, 1.5, 2] },
    { mesh: "sphere", center: [-6, -10.5, 0], size: [2.5, 2.5, 2.5] },
    { mesh: "sphere", center: [6, -10.5, 0], size: [2.5, 2.5, 2.5] },
  ],
};

@component
export class MemoryPlaceMain extends BaseScriptComponent {
  @input
  ui!: MemoryPlaceUI;

  @input
  anchorRoot!: SceneObject;

  @input
  debugColliders: boolean = false;

  @input
  @allowUndefined
  boxMesh: RenderMesh;

  @input
  @allowUndefined
  sphereMesh: RenderMesh;

  @input
  @allowUndefined
  cylinderMesh: RenderMesh;

  @input
  @allowUndefined
  coneMesh: RenderMesh;

  @input
  @allowUndefined
  pyramidMesh: RenderMesh;

  @input
  @allowUndefined
  placeMaterial: Material;

  private core = new MemoryPlaceCore(MEMORY_PLACE_DATA);
  private anchors: Map<string, SceneObject> = new Map<string, SceneObject>();

  onAwake() {
    if (!this.ui || !this.anchorRoot) {
      print("MemoryPlaceMain: required @input not wired (ui / anchorRoot). Check Phase B.");
      return;
    }
    this.buildAnchors();
    this.createEvent("OnStartEvent").bind(() => {
      this.ui.onNext.add(() => this.onNext());
      this.ui.onRepeat.add(() => this.onRepeat());
      this.ui.onHome.add(() => this.onHome());
      this.ui.onCaregiver.add(() => this.onCaregiver());
      this.ui.onEnd.add(() => this.onEnd());
      this.ui.showWelcome(this.core.getState().caregiverMode);
      if (this.debugColliders) this.setColliderDebugAll(this.getSceneObject(), true);
    });
  }

  private buildAnchors(): void {
    for (const anchor of this.core.getAnchors()) {
      const object = global.scene.createSceneObject(`Anchor_${anchor.id}`);
      object.setParent(this.anchorRoot);
      const position = new vec3(anchor.position[0] * 100, anchor.position[1] * 100, anchor.position[2] * 100);
      object.getTransform().setLocalPosition(position);
      // Turn the place (and its label) to face the centre of the ring, where the user starts.
      object.getTransform().setLocalRotation(quat.angleAxis(Math.atan2(-position.x, -position.z), vec3.up()));
      const shapeRoot = this.buildPlaceholder(object, anchor.shape, anchor.color);

      const collider = object.createComponent("Physics.ColliderComponent") as ColliderComponent;
      const shape = Shape.createBoxShape();
      shape.size = new vec3(24, 24, 24);
      collider.shape = shape;

      const interactable = object.createComponent(Interactable.getTypeName()) as Interactable;
      this.createEvent("OnStartEvent").bind(() => {
        interactable.onTriggerStart.add(() => this.onAnchorPinched(anchor.id));
        // Highlight when aimed at: the place grows slightly while it is targeted.
        interactable.onHoverEnter.add(() => shapeRoot?.getTransform().setLocalScale(vec3.one().uniformScale(1.15)));
        interactable.onHoverExit.add(() => shapeRoot?.getTransform().setLocalScale(vec3.one()));
      });

      this.ui.attachAnchorLabel(object, anchor);
      this.anchors.set(anchor.id, object);
    }
  }

  private buildPlaceholder(anchorObject: SceneObject, shape: AnchorShape, color: string): SceneObject | undefined {
    if (!this.placeMaterial) return undefined;
    const materials = new Map<string, Material>();
    const materialFor = (hex: string): Material => {
      let material = materials.get(hex);
      if (!material) {
        material = this.placeMaterial.clone();
        material.mainPass.baseColor = hexToVec4(hex);
        materials.set(hex, material);
      }
      return material;
    };
    const root = global.scene.createSceneObject(`Shape_${shape}`);
    root.setParent(anchorObject);
    for (const part of PLACE_PARTS[shape]) {
      const mesh = this.meshFor(part.mesh);
      if (!mesh) continue;
      const object = global.scene.createSceneObject(part.mesh);
      object.setParent(root);
      const transform = object.getTransform();
      transform.setLocalPosition(new vec3(part.center[0], part.center[1], part.center[2]));
      const rotation = part.rotation ?? [0, 0, 0];
      transform.setLocalRotation(quat.fromEulerAngles(rotation[0] * DEG, rotation[1] * DEG, rotation[2] * DEG));
      const extent = mesh.aabbMax.sub(mesh.aabbMin);
      transform.setLocalScale(new vec3(part.size[0] / extent.x, part.size[1] / extent.y, part.size[2] / extent.z));
      const visual = object.createComponent("Component.RenderMeshVisual") as RenderMeshVisual;
      visual.mesh = mesh;
      visual.mainMaterial = materialFor(part.color ?? color);
    }
    return root;
  }

  private meshFor(kind: PlacePart["mesh"]): RenderMesh | undefined {
    switch (kind) {
      case "box":
        return this.boxMesh;
      case "sphere":
        return this.sphereMesh;
      case "cylinder":
        return this.cylinderMesh;
      case "cone":
        return this.coneMesh;
      case "pyramid":
        return this.pyramidMesh;
    }
  }

  private onAnchorPinched(anchorId: string): void {
    if (this.core.getState().phase === "session-end") {
      this.core.reset();
      this.ui.showWelcome(this.core.getState().caregiverMode);
      return;
    }
    if (!this.core.openAnchor(anchorId)) return;
    const place = this.anchors.get(anchorId);
    if (place) this.ui.focusPlace(place.getTransform().getLocalPosition());
    this.showCurrentCard();
  }

  private onNext(): void {
    const anchorId = this.core.getActiveAnchor()?.id ?? null;
    if (!this.core.nextCard()) return;
    const state = this.core.getState();
    if (state.phase === "session-end") {
      this.ui.showSessionEnd(this.visitedPlaceNames());
      return;
    }
    if (state.phase === "idle") {
      if (anchorId) {
        const anchor = this.core.getAnchor(anchorId);
        if (anchor && anchor.cards.every((card) => state.visitedCards.includes(card.id))) {
          this.ui.markAnchorVisited(anchorId);
        }
      }
      this.ui.showWelcome(this.core.getState().caregiverMode);
      return;
    }
    this.showCurrentCard();
  }

  private onRepeat(): void {
    const card = this.core.repeatCard();
    const anchor = this.core.getActiveAnchor();
    if (!card || !anchor) return;
    this.ui.showCard(anchor, card, this.core.getState().caregiverMode);
    this.ui.replayCard();
  }

  private onHome(): void {
    this.core.reset();
    this.ui.focusFront();
    this.ui.showWelcome(this.core.getState().caregiverMode);
  }

  private onCaregiver(): void {
    const enabled = this.core.toggleCaregiverMode();
    this.ui.showCaregiver(enabled);
    const card = this.core.getActiveCard();
    const anchor = this.core.getActiveAnchor();
    if (card && anchor) this.ui.showCard(anchor, card, enabled);
  }

  private onEnd(): void {
    if (!this.core.endSession()) return;
    this.ui.showSessionEnd(this.visitedPlaceNames());
  }

  // A warm recap of where the person went today; never a score.
  private visitedPlaceNames(): string[] {
    const seen = new Set(this.core.getState().visitedCards);
    return this.core
      .getAnchors()
      .filter((anchor) => anchor.cards.some((card) => seen.has(card.id)))
      .map((anchor) => anchor.name);
  }

  private showCurrentCard(): void {
    const anchor = this.core.getActiveAnchor();
    const card = this.core.getActiveCard();
    if (!anchor || !card) {
      this.ui.showWelcome(this.core.getState().caregiverMode);
      return;
    }
    this.ui.showCard(anchor, card, this.core.getState().caregiverMode);
  }

  private setColliderDebugAll(object: SceneObject, enabled: boolean): void {
    const collider = object.getComponent("Physics.ColliderComponent") as ColliderComponent | null;
    if (collider) collider.debugDrawEnabled = enabled;
    const body = object.getComponent("Physics.BodyComponent") as ColliderComponent | null;
    if (body) body.debugDrawEnabled = enabled;
    for (let index = 0; index < object.getChildrenCount(); index += 1) {
      this.setColliderDebugAll(object.getChild(index), enabled);
    }
  }
}

function hexToVec4(hex: string): vec4 {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  return new vec4(r, g, b, 1);
}
