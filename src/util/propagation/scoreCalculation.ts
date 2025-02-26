import { PropagationContext } from "./issueModel";
import { propagateIssues } from "./propagation";
import { IssuePropagationConfig } from "./propagationConfig";

export interface ValidationIssue<T> {
    description: string;
    type: string;
    state: string;
    initialCharacteristics: string[];
    initialComponent: T | T[];
    propagation: T[];
}

interface TestResult {
    ref: string;
    truePositive: number;
    falsePositive: number;
    falseNegative: number;
    trueNegative: number;
    precision: number;
    recall: number;
    f1: number;
}

export function testPropagation<T extends string>(
    config: IssuePropagationConfig,
    context: Omit<PropagationContext, "issues">,
    validationSet: ValidationIssue<T>[]
): void {
    const allRelationPartners = new Map<string, { id: string; name: string }>(
        context.components.flatMap((component) => {
            const name = component.name;
            return [
                [
                    component.id,
                    {
                        name,
                        id: component.id
                    }
                ] as const,
                ...component.interfaces.map(
                    (inter) =>
                        [
                            inter.id,
                            {
                                name: `${name}.${inter.name}`,
                                id: component.id
                            }
                        ] as const
                )
            ];
        })
    );
    const testResults: TestResult[] = [];
    for (const issue of validationSet) {
        const firstInitialComponent = Array.isArray(issue.initialComponent) ? issue.initialComponent[0] : issue.initialComponent;
        const initialComponents = Array.isArray(issue.initialComponent) ? issue.initialComponent : [issue.initialComponent];
        console.log(allRelationPartners.get(firstInitialComponent)!.name, issue.description);
        const propagationResult = propagateIssues(
            {
                ...context,
                issues: [
                    {
                        id: "test",
                        ref: "test",
                        propagations: [],
                        state: issue.state,
                        type: issue.type,
                        template: "IssueTemplate",
                        title: issue.description,
                        componentsAndInterfaces: initialComponents,
                        characteristics: issue.initialCharacteristics,
                        templatedFields: {}
                    }
                ]
            },
            config
        );
        console.log("expected", issue.propagation.map((component) => allRelationPartners.get(component)!.name));
        console.log("actual", propagationResult.issues.flatMap((issue) => issue.componentsAndInterfaces.map((id) => allRelationPartners.get(id)!.name)));
        const expectedComponents = issue.propagation.map((component) => allRelationPartners.get(component)!.id);
        const expectedComponentsSet = new Set(expectedComponents);
        const actualComponentsSet = new Set(
            propagationResult.issues.flatMap((issue) =>
                issue.componentsAndInterfaces.map((id) => allRelationPartners.get(id)!.id)
            )
        );
        const allComponents = new Set(context.components.map((component) => component.id));
        const actualInitialComponents = new Set(initialComponents.map((component) => allRelationPartners.get(component)!.id));
        if (actualInitialComponents.size > 1) {
            throw new Error("only one initial component allowed (multiple interfaces of the same component are allowed)");
        }
        const initialComponent = allRelationPartners.get(initialComponents[0])!.id;
        allComponents.delete(initialComponent);
        actualComponentsSet.delete(initialComponent);
        expectedComponentsSet.delete(initialComponent);
        const truePositive = new Set([...expectedComponentsSet].filter((x) => actualComponentsSet.has(x))).size;
        const falsePositive = new Set([...actualComponentsSet].filter((x) => !expectedComponentsSet.has(x as T))).size;
        const falseNegative = new Set([...expectedComponentsSet].filter((x) => !actualComponentsSet.has(x))).size;
        const trueNegative = new Set(
            [...allComponents].filter((x) => !actualComponentsSet.has(x) && !expectedComponentsSet.has(x as T))
        ).size;
        const precision = truePositive / (truePositive + falsePositive);
        const recall = truePositive / (truePositive + falseNegative);
        const f1 = (2 * truePositive) / (2 * truePositive + falsePositive + falseNegative);
        testResults.push({
            ref: issue.description,
            truePositive,
            falsePositive,
            falseNegative,
            trueNegative,
            precision,
            recall,
            f1
        });
        console.log("false positive", [...actualComponentsSet].filter((x) => !expectedComponentsSet.has(x as T)).map((x) => allRelationPartners.get(x)!.name));
        console.log("false negative", [...expectedComponentsSet].filter((x) => !actualComponentsSet.has(x)).map((x) => allRelationPartners.get(x)!.name));
        console.log("result", testResults.at(-1));
    }
    console.log("results", testResults);
    const aggregated: Record<string, number> = testResults.reduce(
        (acc, curr) => ({
            truePositive: acc.truePositive + curr.truePositive,
            falsePositive: acc.falsePositive + curr.falsePositive,
            falseNegative: acc.falseNegative + curr.falseNegative,
            trueNegative: acc.trueNegative + curr.trueNegative
        }),
        { truePositive: 0, falsePositive: 0, falseNegative: 0, trueNegative: 0 }
    );
    aggregated.precision = aggregated.truePositive / (aggregated.truePositive + aggregated.falsePositive);
    aggregated.recall = aggregated.truePositive / (aggregated.truePositive + aggregated.falseNegative);
    aggregated.f1 =
        (2 * aggregated.truePositive) /
        (2 * aggregated.truePositive + aggregated.falsePositive + aggregated.falseNegative);
    console.log(
        "avg f1",
        testResults.map((result) => result.f1).reduce((acc, curr) => acc + curr) / testResults.length
    );
    console.log(
        "avg precision",
        testResults.filter(result => !Number.isNaN(result.precision)).map((result) => result.precision).reduce((acc, curr) => acc + curr) / testResults.length
    );
    console.log(
        "avg recall",
        testResults.map((result) => result.recall).reduce((acc, curr) => acc + curr) / testResults.length
    );
    console.log(aggregated);
}
