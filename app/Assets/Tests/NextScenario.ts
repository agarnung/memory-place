import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { DefaultLeafInteractor } from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import { findInteractableByName } from "Leaf.lspkg/Interactors/InteractableUtils";
import { findSceneObjectByName, nextFrame } from "Leaf.lspkg/Utils/common/Utils";
import { expect } from "Leaf.lspkg/Utils/common/Expect";

@component
export class NextScenario extends Scenario {
  async run(): Promise<void> {
    const interactor = new DefaultLeafInteractor();
    const anchor = findInteractableByName("Anchor_home");
    const next = findInteractableByName("Next");
    expect(anchor).toBeTruthy();
    expect(next).toBeTruthy();
    await interactor.trigger(anchor);
    await nextFrame();
    await interactor.trigger(next);
    await nextFrame();
    const prompt = findSceneObjectByName("Prompt").getComponent("Text");
    expect(prompt.text).toBe("What was usually on your kitchen table?");
  }
}
