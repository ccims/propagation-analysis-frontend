import { IssuePropagationConfig } from "../propagationConfig";
import { issueTemplate, callsRelationTemplate, logicalComponentTemplate, microserviceTemplate, BUG, OPEN, DEPENDS_ON } from "./templates";

export const onlineBoutiqueRules: IssuePropagationConfig = {
    schemas: {
        failingServiceCallBug: {
            template: true,
            type: BUG,
            state: OPEN,
            title: "Calling service failed",
            templatedFields: true,
            relationToSource: {
                type: DEPENDS_ON,
                direction: "outgoing"
            },
            characteristics: ["failing service call"]
        },
        uncatchedErrorResponseBug: {
            template: true,
            type: BUG,
            state: OPEN,
            title: "Uncatched error response",
            templatedFields: true,
            relationToSource: {
                type: DEPENDS_ON,
                direction: "outgoing"
            },
            characteristics: ["error response"]
        },
        requestTimeoutBug: {
            template: true,
            type: BUG,
            state: OPEN,
            title: "Request timeout",
            templatedFields: true,
            relationToSource: {
                type: DEPENDS_ON,
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
                type: [BUG],
                state: [OPEN],
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
                type: [BUG],
                state: [OPEN],
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
                type: [BUG],
                state: [OPEN],
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
                type: [BUG],
                state: [OPEN],
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
