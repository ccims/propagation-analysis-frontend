import { PropagationContext } from "./issueModel";
import { propagateIssues } from "./propagation";
import { IssuePropagationConfig } from "./propagationConfig";

export interface ValidationIssue<T> {
    description: string;
    type: string;
    state: string;
    initialCharacteristics: string[];
    initialComponent: T;
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
    console.log(JSON.stringify(context, null, 2));
    const testResults: TestResult[] = [];
    let i = 0;
    for (const issue of validationSet) {
        if (i++ != 7) {
            //continue;
        }
        console.log(issue.description);
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
                        componentsAndInterfaces: [issue.initialComponent],
                        characteristics: issue.initialCharacteristics,
                        templatedFields: {}
                    }
                ]
            },
            config
        );
        const expectedComponents = issue.propagation.map((component) => component);
        const expectedComponentsSet = new Set(expectedComponents);
        const actualComponentsSet = new Set(propagationResult.issues.flatMap((issue) => issue.componentsAndInterfaces));
        console.log(actualComponentsSet);
        const allComponents = new Set(context.components.map((component) => component.id));
        allComponents.delete(issue.initialComponent);
        actualComponentsSet.delete(issue.initialComponent);
        expectedComponentsSet.delete(issue.initialComponent);
        const truePositive = new Set([...expectedComponentsSet].filter((x) => actualComponentsSet.has(x))).size;
        const falsePositive = new Set([...actualComponentsSet].filter((x) => !expectedComponentsSet.has(x as T))).size;
        const falseNegative = new Set([...expectedComponentsSet].filter((x) => !actualComponentsSet.has(x))).size;
        console.log([...expectedComponentsSet].filter((x) => !actualComponentsSet.has(x)));
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
    }
    console.log(testResults);
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
    // print averaged f1 score
    console.log(
        "avg f1",
        testResults.map((result) => result.f1).reduce((acc, curr) => acc + curr) / testResults.length
    );
    // print averaged precision
    console.log(
        "avg precision",
        testResults.map((result) => result.precision).reduce((acc, curr) => acc + curr) / testResults.length
    );
    // print averaged recall
    console.log(
        "avg recall",
        testResults.map((result) => result.recall).reduce((acc, curr) => acc + curr) / testResults.length
    );
    console.log(aggregated);
}
