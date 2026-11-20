import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { findInteractableByName } from "Leaf.lspkg/Interactors/InteractableUtils";
import { expect } from "Leaf.lspkg/Utils/common/Expect";

@component
export class RingScenario extends Scenario {
  async run(): Promise<void> {
    for (const id of ["home", "family", "music", "work", "garden", "travel"]) {
      const anchor = findInteractableByName(`Anchor_${id}`);
      expect(anchor).toBeTruthy();
    }
  }
}
