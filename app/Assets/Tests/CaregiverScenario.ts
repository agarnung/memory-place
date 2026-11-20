import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { DefaultLeafInteractor } from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import { findInteractableByName } from "Leaf.lspkg/Interactors/InteractableUtils";
import { findSceneObjectByName, nextFrame } from "Leaf.lspkg/Utils/common/Utils";
import { expect } from "Leaf.lspkg/Utils/common/Expect";

@component
export class CaregiverScenario extends Scenario {
  async run(): Promise<void> {
    const interactor = new DefaultLeafInteractor();
    const anchor = findInteractableByName("Anchor_home");
    const caregiver = findInteractableByName("Caregiver");
    expect(anchor).toBeTruthy();
    expect(caregiver).toBeTruthy();
    await interactor.trigger(anchor);
    await nextFrame();
    await interactor.trigger(caregiver);
    await nextFrame();
    const note = findSceneObjectByName("CaregiverNote").getComponent("Text");
    expect(note.text.indexOf("Ask next:") === 0).toBeTruthy();
  }
}
