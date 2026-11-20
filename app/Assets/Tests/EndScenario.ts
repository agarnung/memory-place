import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { DefaultLeafInteractor } from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import { findInteractableByName } from "Leaf.lspkg/Interactors/InteractableUtils";
import { findSceneObjectByName, nextFrame } from "Leaf.lspkg/Utils/common/Utils";
import { expect } from "Leaf.lspkg/Utils/common/Expect";

@component
export class EndScenario extends Scenario {
  async run(): Promise<void> {
    const interactor = new DefaultLeafInteractor();
    const anchor = findInteractableByName("Anchor_home");
    const end = findInteractableByName("End");
    expect(anchor).toBeTruthy();
    expect(end).toBeTruthy();
    await interactor.trigger(anchor);
    await nextFrame();
    await interactor.trigger(end);
    await nextFrame();
    const title = findSceneObjectByName("Title").getComponent("Text");
    const prompt = findSceneObjectByName("Prompt").getComponent("Text");
    expect(title.text).toBe("Session complete");
    expect(prompt.text).toBe("Thank you for sharing these memories.");
  }
}
