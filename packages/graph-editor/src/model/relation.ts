import { Point } from "sprotty-protocol";
import { RelationStyle } from "../gropiusModel";
import { Element } from "./element";
import { Selectable } from "./selectable";

export interface Relation extends Selectable {
    type: typeof Relation.TYPE;
    start?: string | Point;
    end?: string | Point;
    style: RelationStyle;
    propagationModeActive: boolean | null;
}

export namespace Relation {
    export const TYPE = "relation";

    export function is(element: Element): element is Relation {
        return element.type === TYPE;
    }
}
