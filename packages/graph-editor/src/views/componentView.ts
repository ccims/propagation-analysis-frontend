import { injectable } from "inversify";
import { VNode } from "snabbdom";
import { IView, RenderingContext, svg } from "sprotty";
import { SComponent } from "../smodel/sComponent";
import { SLabel } from "../smodel/sLabel";
import { LineEngine } from "../line/engine/lineEngine";
import { wrapForeignElement } from "./util";
import { IssueAffectedView } from "./issueAffectedView";

@injectable()
export class ComponentView extends IssueAffectedView implements IView {
    render(model: Readonly<SComponent>, context: RenderingContext, args?: {} | undefined): VNode | undefined {
        let nameLabel: SLabel | undefined;
        const interfaces: (VNode | undefined)[] = [];
        for (const child of model.children) {
            if (child instanceof SLabel) {
                nameLabel = child;
            } else {
                interfaces.push(context.renderElement(child));
            }
        }
        const shape = model.shape;
        const component = svg(
            "g",
            null,
            svg("path", {
                attrs: {
                    d: LineEngine.DEFAULT.toPathString(shape.outline, { x: 0, y: 0 }),
                    ...model.generateShapeAttrs()
                }
            }),
            wrapForeignElement(context.renderElement(nameLabel!), {
                x: model.x - nameLabel!.size.width / 2,
                y: model.y - nameLabel!.size.height / 2
            })
        );
        return svg("g", null, component, ...interfaces);
    }
}
