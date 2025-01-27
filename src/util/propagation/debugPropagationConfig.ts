import { IssuePropagationConfig } from "./propagationConfig";

export const debugPropagationConfig: IssuePropagationConfig = {
    schemas: {
        default: {
            template: true,
            type: true,
            state: true,
            title: true,
            templatedFields: true,
            characteristics: []
        }
    },
    intraComponentRules: [],
    interComponentRules: [
        {
            propagationDirection: "both",
            filterIssue: {},
            filterRelation: {},
            filterRelationStart: {
                type: "component"
            },
            filterRelationEnd: {
                type: "component"
            },
            newIssueSchema: "default",
        }
    ]
}