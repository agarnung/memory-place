import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { DefaultLeafInteractor } from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import { findInteractableByName } from "Leaf.lspkg/Interactors/InteractableUtils";
import { findSceneObjectByName, nextFrame } from "Leaf.lspkg/Utils/common/Utils";
import { expect } from "Leaf.lspkg/Utils/common/Expect";

@component
export class RepeatScenario extends Scenario {
  async run(): Promise<void> {
    const interactor = new DefaultLeafInteractor();
    const anchor = findInteractableByName("Anchor_home");
    const repeat = findInteractableByName("Repeat");
    expect(anchor).toBeTruthy();
    expect(repeat).toBeTruthy();
    await interactor.trigger(anchor);
    await nextFrame();
    const prompt = findSceneObjectByName("Prompt").getComponent("Text");
    const before = prompt.text;
    await interactor.trigger(repeat);
    await nextFrame();
    expect(prompt.text).toBe(before);
  }
}
