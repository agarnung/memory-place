import { scenariosIndex } from "Leaf.lspkg/Scenarios/decorator/ScenarioIndexDecorator";
import { ScenarioMetadata } from "Leaf.lspkg/Scenarios/scenario/ScenarioMetadata";
import { OpenMemoryScenario } from "./OpenMemoryScenario";
import { RepeatScenario } from "./RepeatScenario";
import { NextScenario } from "./NextScenario";
import { CaregiverScenario } from "./CaregiverScenario";
import { HomeScenario } from "./HomeScenario";
import { EndScenario } from "./EndScenario";
import { FinishPlaceScenario } from "./FinishPlaceScenario";
import { RingScenario } from "./RingScenario";

@component
export class LeafIndex extends BaseScriptComponent {
  @scenariosIndex
  static scenariosIndex: ScenarioMetadata[] = [
    { id: "open_memory", typename: OpenMemoryScenario.getTypeName() },
    { id: "repeat", typename: RepeatScenario.getTypeName() },
    { id: "next", typename: NextScenario.getTypeName() },
    { id: "caregiver", typename: CaregiverScenario.getTypeName() },
    { id: "home", typename: HomeScenario.getTypeName() },
    { id: "end", typename: EndScenario.getTypeName() },
    { id: "finish_place", typename: FinishPlaceScenario.getTypeName() },
    { id: "ring", typename: RingScenario.getTypeName() },
  ];
}
