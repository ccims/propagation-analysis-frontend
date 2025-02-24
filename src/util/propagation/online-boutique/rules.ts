import { IssuePropagationConfig } from "../propagationConfig";

// Relation Templates
const callsRelationTemplate: string = "db7a5554-21f1-4ccc-8f35-6a01f8f984b4";
// Component Templates
const microserviceTemplate: string = "d7e5dc94-686a-44a4-9c97-bcb0a1c38295";
const frontendTemplate: string = "f13a177d-a783-42c0-8810-0d20c613e41f";
const logicalComponentTemplate: string[] = [microserviceTemplate, frontendTemplate];
const issueTemplate: string = "1f1493e0-1557-4bee-8477-2c16c2bff8b4";

export const onlineBoutiqueRules: IssuePropagationConfig = {
    schemas: {
        failingServiceCallBug: {
            template: true,
            type: "Bug",
            state: "Open",
            title: "Calling service failed",
            templatedFields: true,
            relationToSource: {
                type: "Depends on",
                direction: "outgoing"
            },
            characteristics: ["failing service call"]
        },
        uncatchedErrorResponseBug: {
            template: true,
            type: "Bug",
            state: "Open",
            title: "Uncatched error response",
            templatedFields: true,
            relationToSource: {
                type: "Depends on",
                direction: "outgoing"
            },
            characteristics: ["error response"]
        },
        requestTimeoutBug: {
            template: true,
            type: "Bug",
            state: "Open",
            title: "Request timeout",
            templatedFields: true,
            relationToSource: {
                type: "Depends on",
                direction: "outgoing"
            },
            characteristics: ["request timeout"]
        }
    },
    intraComponentRules: [],
    interComponentRules: [
        {
            /* Service is unreachable */
            filterIssue: {
                type: ["Bug"],
                state: ["Open"],
                template: [issueTemplate],
                characteristics: ["service unreachable"]
            },
            filterRelation: {
                template: [callsRelationTemplate]
            },
            filterRelationStart: {
                or: [{ type: "component", template: logicalComponentTemplate }]
            },
            filterRelationEnd: {
                or: [{ type: "component", template: [microserviceTemplate] }]
            },
            propagationDirection: "backward",
            newIssueSchema: "failingServiceCallBug"
        },
        {
            /* Service call fails */
            filterIssue: {
                type: ["Bug"],
                state: ["Open"],
                template: [issueTemplate],
                characteristics: ["failing service call"]
            },
            filterRelation: {
                template: [callsRelationTemplate]
            },
            filterRelationStart: {
                or: [{ type: "component", template: logicalComponentTemplate }]
            },
            filterRelationEnd: {
                or: [{ type: "component", template: [microserviceTemplate] }]
            },
            propagationDirection: "backward",
            newIssueSchema: "uncatchedErrorResponseBug"
        },
        {
            /* Uncatched error response */
            filterIssue: {
                type: ["Bug"],
                state: ["Open"],
                template: [issueTemplate],
                characteristics: ["error response"]
            },
            filterRelation: {
                template: [callsRelationTemplate]
            },
            filterRelationStart: {
                or: [{ type: "component", template: logicalComponentTemplate }]
            },
            filterRelationEnd: {
                or: [{ type: "component", template: [microserviceTemplate] }]
            },
            propagationDirection: "backward",
            newIssueSchema: "uncatchedErrorResponseBug"
        },
        {
            /* Request timeout due to high latency */
            filterIssue: {
                type: ["Bug"],
                state: ["Open"],
                template: [issueTemplate],
                characteristics: ["request timeout", "high latency"]
            },
            filterRelation: {
                template: [callsRelationTemplate]
            },
            filterRelationStart: {
                or: [{ type: "component", template: logicalComponentTemplate }]
            },
            filterRelationEnd: {
                or: [{ type: "component", template: [microserviceTemplate] }]
            },
            propagationDirection: "backward",
            newIssueSchema: "requestTimeoutBug"
        }
    ]
};
