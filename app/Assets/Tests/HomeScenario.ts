import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { DefaultLeafInteractor } from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import { findInteractableByName } from "Leaf.lspkg/Interactors/InteractableUtils";
import { findSceneObjectByName, nextFrame } from "Leaf.lspkg/Utils/common/Utils";
import { expect } from "Leaf.lspkg/Utils/common/Expect";

@component
export class HomeScenario extends Scenario {
  async run(): Promise<void> {
    const interactor = new DefaultLeafInteractor();
    const anchor = findInteractableByName("Anchor_home");
    const home = findInteractableByName("Home");
    expect(anchor).toBeTruthy();
    expect(home).toBeTruthy();
    await interactor.trigger(anchor);
    await nextFrame();
    await interactor.trigger(home);
    await nextFrame();
    const prompt = findSceneObjectByName("Prompt").getComponent("Text");
    expect(prompt.text).toBe("Choose a familiar place.");
  }
}
