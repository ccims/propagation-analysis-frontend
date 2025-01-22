import { unref } from "vue";
import { Component, PropagatedIssue, PropagationContext, Relation } from "./issueModel";
import { ComponentFilter, IssuePropagationConfig, PropagationRule } from "./propagationConfig";
import { is } from "@babel/types";

interface Relations {
    incoming: Relation[];
    outgoing: Relation[];
}

export function propagateIssues(
    context: PropagationContext,
    config: IssuePropagationConfig
): { issues: PropagatedIssue[]; propagatingRelations: Set<string> } {
    let refCounter =
        Math.max(
            -1,
            ...context.issues.filter((issue) => typeof issue.ref === "number").map((issue) => issue.ref as number)
        ) + 1;

    const componentLookup = new Map<string, Component>();
    for (const component of context.components) {
        componentLookup.set(component.id, component);
    }

    const relationLookup = new Map<string, Relation>();
    for (const relation of context.relations) {
        relationLookup.set(relation.id, relation);
    }

    const componentRelationLookup = new Map<string, Relations>();
    for (const relation of context.relations) {
        if (componentRelationLookup.has(relation.from)) {
            componentRelationLookup.get(relation.from)!.outgoing.push(relation);
        } else {
            componentRelationLookup.set(relation.from, { incoming: [], outgoing: [relation] });
        }
        if (componentRelationLookup.has(relation.to)) {
            componentRelationLookup.get(relation.to)!.incoming.push(relation);
        } else {
            componentRelationLookup.set(relation.to, { incoming: [relation], outgoing: [] });
        }
    }

    const newPropagatedIssues = context.issues
        .filter((issue) => typeof issue.id === "string")
        .map((issue) => ({
            ...issue,
            propagations: [...issue.propagations],
            characteristics: [...issue.characteristics]
        }));
    const issuesToPropagate = newPropagatedIssues.flatMap((issue) =>
        issue.components.map((componentId) => ({ issue, componentId }))
    );

    const propagatedIssuesByComponent = new Map<string, PropagatedIssue[]>();
    for (const issue of newPropagatedIssues) {
        for (const componentId of issue.components) {
            if (propagatedIssuesByComponent.has(componentId)) {
                propagatedIssuesByComponent.get(componentId)!.push(issue);
            } else {
                propagatedIssuesByComponent.set(componentId, [issue]);
            }
        }
    }

    function propagateIssue(issue: PropagatedIssue, component: Component, rule: PropagationRule) {
        const newIssueSchema = rule.newIssueSchema;

        const schema = config.schemas[newIssueSchema];
        if (schema == undefined) {
            console.log(newIssueSchema);
        }
        const state = schema.state === true ? issue.state : schema.state!;
        const type = schema.type === true ? issue.type : schema.type!;
        const template = schema.template === true ? issue.template : schema.template!;

        const issuesOnComponent = propagatedIssuesByComponent.get(component.id) ?? [];
        if (issuesOnComponent.some((existingIssue) => existingIssue.propagations.includes(issue.ref))) {
            return;
        }
        const existingIssue = issuesOnComponent.find(
            (existingIssue) =>
                existingIssue.state === state && existingIssue.type === type && existingIssue.template === template
        );
        if (existingIssue) {
            existingIssue.propagations.push(issue.ref);
            for (const characteristic of schema.characteristics) {
                if (!existingIssue.characteristics.includes(characteristic)) {
                    existingIssue.characteristics.push(characteristic);
                }
            }
        } else {
            const newIssue: PropagatedIssue = {
                ref: refCounter++,
                propagations: [issue.ref],
                title: schema.title === true ? issue.title : schema.title,
                state,
                type,
                template,
                components: [component.id],
                characteristics: [...schema.characteristics]
            };

            if (propagatedIssuesByComponent.has(component.id)) {
                propagatedIssuesByComponent.get(component.id)!.push(newIssue);
            } else {
                propagatedIssuesByComponent.set(component.id, [newIssue]);
            }
            newPropagatedIssues.push(newIssue);
            issuesToPropagate.push({ issue: newIssue, componentId: component.id });
        }
    }
    const propagatingRelations = new Set<string>();
    while (issuesToPropagate.length > 0) {
        const { issue, componentId } = issuesToPropagate.pop()!;
        const component = componentLookup.get(componentId);
        const relations = componentRelationLookup.get(componentId);
        if (relations == undefined) {
            console.log(componentId);
        }
        config.rules.forEach((rule) => {
            for (const outgoingRelation of relations!.outgoing) {
                const relatedComponent = componentLookup.get(outgoingRelation.to);
                if (doesIssuePropagate(issue, rule, component!, relatedComponent!, outgoingRelation, true)) {
                    propagatingRelations.add(outgoingRelation.id);
                    propagateIssue(issue, relatedComponent!, rule);
                }
            }
            for (const incomingRelation of relations!.incoming) {
                const relatedComponent = componentLookup.get(incomingRelation.from);
                if (doesIssuePropagate(issue, rule, relatedComponent!, component!, incomingRelation, false)) {
                    propagatingRelations.add(incomingRelation.id);
                    propagateIssue(issue, relatedComponent!, rule);
                }
            }
        });
    }
    return { issues: newPropagatedIssues, propagatingRelations };
}

function doesIssuePropagate(
    issue: PropagatedIssue,
    rule: PropagationRule,
    component: Component,
    relatedComponent: Component,
    relation: Relation,
    isOutgoing: boolean
): boolean {
    let debug = false;
    if (debug) {
        console.log(unref(rule), rule.filterIssue.characteristics);
    }
    if (rule.propagationDirection != "both" && (rule.propagationDirection === "forward") != isOutgoing) {
        if (debug) {
            console.log("due to direction");
        }
        return false;
    }

    const issueFilter = rule.filterIssue;
    if (issueFilter.type != undefined && !issueFilter.type.includes(issue.type)) {
        if (debug) {
            console.log("due to type");
        }
        return false;
    }
    if (issueFilter.state != undefined && !issueFilter.state.includes(issue.state)) {
        if (debug) {
            console.log("due to state");
        }
        return false;
    }
    if (issueFilter.template != undefined && !issueFilter.template.includes(issue.template)) {
        if (debug) {
            console.log("due to template");
        }
        return false;
    }
    if (
        issueFilter.characteristics != undefined &&
        !issueFilter.characteristics.some((characteristic) => issue.characteristics.includes(characteristic))
    ) {
        if (debug) {
            console.log("due to characteristics");
        }
        return false;
    }

    if (!doesComponentMatchFilter(component, rule.filterStartComponent, debug)) {
        if (debug) {
            console.log("due to start component");
        }
        return false;
    }
    if (!doesComponentMatchFilter(relatedComponent, rule.filterEndComponent, debug)) {
        if (debug) {
            console.log("due to end component");
        }
        return false;
    }

    const relationFilter = rule.filterRelation;
    if (relationFilter.template != undefined && !relationFilter.template.includes(relation.template)) {
        if (debug) {
            console.log("due to relation");
        }
        return false;
    }

    return true;
}

function doesComponentMatchFilter(component: Component, filter: ComponentFilter, debug: boolean): boolean {
    if (filter.template != undefined && !filter.template.includes(component.template)) {
        if (debug) {
            console.log("due to template: ", filter.template, component.template);
        }
        return false;
    }
    if (filter.name == undefined) {
        return true;
    } else {
        if (debug) {
            console.log("REGEX error????");
        }
    }
    return component.name.match(filter.name) != null;
}
