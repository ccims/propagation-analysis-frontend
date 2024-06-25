import { IssuePropagationConfig } from "./propagationConfig";

export const defaultPropagationConfig: IssuePropagationConfig = {
    schemas: {
        propagatedAPIBreakingBug: {
            template: true,
            type: 'Bug',
            state: 'Open',
            title: 'API breaks due to bug in API of upstream component',
            relationToSource: {
                type: 'Depends on',
                direction: 'outgoing'
            },
            characteristics: ['API breaking bug']
        },
        propagatedAPIBug: {
            template: true,
            type: 'Bug',
            state: 'Open',
            title: 'Bug in API endpoint logic breaking callees?',
            relationToSource: {
                type: 'Depends on',
                direction: 'outgoing'
            },
            characteristics: ['API bug']
        },
        frontendCallsAPIBug: {
            template: true,
            type: 'Bug',
            state: 'Open',
            title: 'Frontend calls broken API',
            relationToSource: {
                type: 'Depends on',
                direction: 'outgoing'
            },
            characteristics: ['API bug']
        },
        domainModelIssue: {
            template: true,
            type: 'Bug',
            state: 'Open',
            title: 'Bug in upstream component domain model, has to be also fixed in downstream components',
            relationToSource: {
                type: 'Depends on',
                direction: 'outgoing'
            },
            characteristics: ['Domain model bug']
        },
        libraryVersionUpdateIssue: {
            template: true,
            type: true,
            state: 'Open',
            title: 'Library version update required',
            relationToSource: {
                type: 'Depends on',
                direction: 'outgoing'
            },
            characteristics: ['Library version update']
        },
        dtoBug: {
            template: true,
            type: 'Bug',
            state: 'Open',
            title: "Bug in upstream component's DTO",
            relationToSource: {
                type: 'Depends on',
                direction: 'outgoing'
            },
            characteristics: ['DTO bug']
        },
        dtoFeature: {
            template: true,
            type: 'Feature',
            state: 'Open',
            title: "Change in upstream component's DTO. Update required.",
            relationToSource: {
                type: 'Depends on',
                direction: 'outgoing'
            },
            characteristics: ['DTO feature']
        },
        missingEventCall: {
            template: true,
            type: 'Bug',
            state: 'Open',
            title: 'Missing event call',
            relationToSource: {
                type: 'results in',
                direction: 'outgoing'
            },
            characteristics: ['Missing event call']
        },
        upstreamDomainModelChange: {
            template: true,
            type: true,
            state: 'Open',
            title: 'Downstream component has a domain model change. Update to comply',
            relationToSource: {
                type: 'Depends on',
                direction: 'outgoing'
            },
            characteristics: ['Domain model change - downstream to upstream']
        },
        downstreamDomainModelChange: {
            template: true,
            type: true,
            state: 'Open',
            title: 'Upstream component has a domain model change. Update to comply',
            relationToSource: {
                type: 'Depends on',
                direction: 'outgoing'
            },
            characteristics: ['Domain model change - upstream to downstream']
        },
        serviceUnavailableDueToInfrastructureFail: {
            template: true,
            type: 'Bug',
            state: 'Open',
            title: 'Service is unavailable due to infrastructure failure',
            relationToSource: {
                type: 'Depends on',
                direction: 'outgoing'
            },
            characteristics: ['Service unavailable']
        },
        serviceUnavailableGeneral: {
            template: true,
            type: 'Bug',
            state: 'Open',
            title: 'Call to upstream service fails due to unavailability of service',
            relationToSource: {
                type: 'Depends on',
                direction: 'outgoing'
            },
            characteristics: ['Call failed due to unavailability']
        },
        propagatedFeatureRequestDownToUp: {
            template: true,
            type: 'Feature',
            state: 'Open',
            title: 'Feature request propagated from upstream or downstream component',
            characteristics: ['Feature request - downstream to upstream'],
            relationToSource: {
                type: 'Depends on',
                direction: 'outgoing'
            }
        },
        propagatedFeatureRequestUpToDown: {
            template: true,
            type: 'Feature',
            state: 'Open',
            title: 'Feature request propagated from upstream or downstream component',
            characteristics: ['Feature request - upstream to downstream'],
            relationToSource: {
                type: 'Depends on',
                direction: 'outgoing'
            }
        },
        dbUnreachableBug: {
            template: true,
            type: 'Bug',
            state: 'Open',
            title: 'Database is unreachable',
            relationToSource: {
                type: 'Depends on',
                direction: 'outgoing'
            },
            characteristics: ['Database unreachable']
        },
        libBreakingChange: {
            template: true,
            type: true,
            state: 'Open',
            title: 'Library breaking change',
            relationToSource: {
                type: 'Depends on',
                direction: 'outgoing'
            },
            characteristics: ['Library breaking change']
        },
        dtoParsingBug: {
            template: true,
            type: 'Bug',
            state: 'Open',
            title: 'DTO parsing error',
            relationToSource: {
                type: 'Depends on',
                direction: 'outgoing'
            },
            characteristics: ['DTO parsing error']
        }
    },
    rules: [
        { /* Bug propagation rule for broken APIs which again break service APIs */
            filterIssue: {
                type: ['Bug'],
                state: ['Open'],
                template: ['IssueTemplate'],
                characteristics: ['API breaking bug']
            },
            filterRelation: {
                template: ["b329efdb-cba9-4d98-9a84-712a1aa87e37", "a90e2493-7bd0-4c4f-9529-2dcdde480ba7"],
            },
            filterStartComponent: {
                template: ["f038bccd-fdff-4b87-ae34-b409052182a9"]
            },
            filterEndComponent: {
                template: ["f588bd56-242b-43d5-ae89-236cbcad2c6a", "f038bccd-fdff-4b87-ae34-b409052182a9"]
            },
            propagationDirection: 'backward',
            newIssueSchema: 'propagatedAPIBreakingBug'
        },
        { /* Eventuell kann diese Regel gelöscht oder angepasst werden */
            filterIssue: {
                type: ['Bug'],
                state: ['Open'],
                template: ['IssueTemplate'],
                characteristics: ['API bug']
            },
            filterRelation: {
                template: ["a90e2493-7bd0-4c4f-9529-2dcdde480ba7"],
            },
            filterStartComponent: {
                template: ["f038bccd-fdff-4b87-ae34-b409052182a9"]
            },
            filterEndComponent: {
                template: ["f038bccd-fdff-4b87-ae34-b409052182a9"]
            },
            propagationDirection: 'backward',
            newIssueSchema: 'propagatedAPIBug'
        },
        { /* Bug propagation for broken APIs to frontend */
            filterIssue: {
                type: ['Bug'],
                state: ['Open'],
                template: ['IssueTemplate'],
                characteristics: ['API breaking bug']
            },
            filterRelation: {
                template: ["a90e2493-7bd0-4c4f-9529-2dcdde480ba7"],
            },
            filterStartComponent: {
                template: ["15146d59-ca2e-4874-9f69-556bb42d5b81"]
            },
            filterEndComponent: {
                template: ["f038bccd-fdff-4b87-ae34-b409052182a9"]
            },
            propagationDirection: 'backward',
            newIssueSchema: 'frontendCallsAPIBug'
        },
        { /* Bug propagation due to domain model bug */
            filterIssue: {
                type: ['Bug'],
                state: ['Open'],
                template: ['IssueTemplate'],
                characteristics: ['Domain model bug']
            },
            filterRelation: {
                template: ["a90e2493-7bd0-4c4f-9529-2dcdde480ba7"],
            },
            filterStartComponent: {
                template: ["f038bccd-fdff-4b87-ae34-b409052182a9", "15146d59-ca2e-4874-9f69-556bb42d5b81"]
            },
            filterEndComponent: {
                template: ["f038bccd-fdff-4b87-ae34-b409052182a9"]
            },
            propagationDirection: 'both',
            newIssueSchema: 'domainModelIssue'
        },
        { /* Library version update propagation */
            filterIssue: {
                type: ['Feature', 'Bug'],
                state: ['Open'],
                template: ['IssueTemplate'],
                characteristics: ['Library breaking change']
            },
            filterRelation: {
                template: ["b329efdb-cba9-4d98-9a84-712a1aa87e37"],
            },
            filterStartComponent: {
                template: ["f038bccd-fdff-4b87-ae34-b409052182a9", "15146d59-ca2e-4874-9f69-556bb42d5b81"]
            },
            filterEndComponent: {
                template: ["f588bd56-242b-43d5-ae89-236cbcad2c6a"]
            },
            propagationDirection: 'backward',
            newIssueSchema: 'libBreakingChange'
        },
        { /* Bug propagation due to DTO bug */ 
            filterIssue: {
                type: ['Bug', 'Feature'],
                state: ['Open'],
                template: ['IssueTemplate'],
                characteristics: ['Library breaking change']
            },
            filterRelation: {
                template: ["a90e2493-7bd0-4c4f-9529-2dcdde480ba7"],
            },
            filterStartComponent: {
                template: ["f038bccd-fdff-4b87-ae34-b409052182a9", "15146d59-ca2e-4874-9f69-556bb42d5b81"]
            },
            filterEndComponent: {
                template: ["f038bccd-fdff-4b87-ae34-b409052182a9"]
            },
            propagationDirection: 'backward',
            newIssueSchema: 'libBreakingChange'
        },
        { /* Library version update propagation */
            filterIssue: {
                type: ['Feature', 'Bug'],
                state: ['Open'],
                template: ['IssueTemplate'],
                characteristics: ['Library version update']
            },
            filterRelation: {
                template: ["b329efdb-cba9-4d98-9a84-712a1aa87e37"],
            },
            filterStartComponent: {
                template: ["f038bccd-fdff-4b87-ae34-b409052182a9", "15146d59-ca2e-4874-9f69-556bb42d5b81"]
            },
            filterEndComponent: {
                template: ["f588bd56-242b-43d5-ae89-236cbcad2c6a"]
            },
            propagationDirection: 'backward',
            newIssueSchema: 'libraryVersionUpdateIssue'
        },
        { /* Bug propagation due to DTO bug */ 
            filterIssue: {
                type: ['Bug'],
                state: ['Open'],
                template: ['IssueTemplate'],
                characteristics: ['DTO bug']
            },
            filterRelation: {
                template: ["a90e2493-7bd0-4c4f-9529-2dcdde480ba7"],
            },
            filterStartComponent: {
                template: ["f038bccd-fdff-4b87-ae34-b409052182a9", "15146d59-ca2e-4874-9f69-556bb42d5b81"]
            },
            filterEndComponent: {
                template: ["f038bccd-fdff-4b87-ae34-b409052182a9"]
            },
            propagationDirection: 'both',
            newIssueSchema: 'dtoBug'
        },
        { /* DTO feature change propagation */
            filterIssue: {
                type: ['Feature'],
                state: ['Open'],
                template: ['IssueTemplate'],
                characteristics: ['DTO feature']
            },
            filterRelation: {
                template: ["a90e2493-7bd0-4c4f-9529-2dcdde480ba7"],
            },
            filterStartComponent: {
                template: ["f038bccd-fdff-4b87-ae34-b409052182a9", "15146d59-ca2e-4874-9f69-556bb42d5b81"]
            },
            filterEndComponent: {
                template: ["f038bccd-fdff-4b87-ae34-b409052182a9"]
            },
            propagationDirection: 'both',
            newIssueSchema: 'dtoFeature'
        },
        { /* Bug propagation due to missing events */
            filterIssue: {
                type: ['Bug'],
                state: ['Open'],
                template: ['IssueTemplate'],
                characteristics: ['Missing event call']
            },
            filterRelation: {
                template: ["a90e2493-7bd0-4c4f-9529-2dcdde480ba7"],
            },
            filterStartComponent: {
                template: ["f038bccd-fdff-4b87-ae34-b409052182a9"]
            },
            filterEndComponent: {
                template: ["f038bccd-fdff-4b87-ae34-b409052182a9"]
            },
            propagationDirection: 'both',
            newIssueSchema: 'missingEventCall'
        },
        { /* Domain change request propagation from downstream to upstream */
            filterIssue: {
                type: ['Feature', 'Bug'],
                state: ['Open'],
                template: ['IssueTemplate'],
                characteristics: ['Domain model change - downstream to upstream', 'Domain model change']
            },
            filterRelation: {
                template: ["a90e2493-7bd0-4c4f-9529-2dcdde480ba7"],
            },
            filterStartComponent: {
                template: ["f038bccd-fdff-4b87-ae34-b409052182a9", "15146d59-ca2e-4874-9f69-556bb42d5b81"]
            },
            filterEndComponent: {
                template: ["f038bccd-fdff-4b87-ae34-b409052182a9"]
            },
            propagationDirection: 'forward',
            newIssueSchema: 'upstreamDomainModelChange'
        },
        { /* Domain change request propagation from upstream to downstream */
            filterIssue: {
                type: ['Feature', 'Bug'],
                state: ['Open'],
                template: ['IssueTemplate'],
                characteristics: ['Domain model change - upstream to downstream', 'Domain model change']
            },
            filterRelation: {
                template: ["a90e2493-7bd0-4c4f-9529-2dcdde480ba7"],
            },
            filterStartComponent: {
                template: ["f038bccd-fdff-4b87-ae34-b409052182a9", "15146d59-ca2e-4874-9f69-556bb42d5b81"]
            },
            filterEndComponent: {
                template: ["f038bccd-fdff-4b87-ae34-b409052182a9"]
            },
            propagationDirection: 'backward',
            newIssueSchema: 'downstreamDomainModelChange'
        },
        { /* Infrastructure crash to hosted component */
            filterIssue: {
                type: ['Bug'],
                state: ['Open'],
                template: ['IssueTemplate'],
                characteristics: ['Infrastructure failure']
            },
            filterRelation: {
                template: ["d3ac8499-cb22-42b5-a546-71e85ad24d03"],
            },
            filterStartComponent: {
                template: ["f038bccd-fdff-4b87-ae34-b409052182a9", "15146d59-ca2e-4874-9f69-556bb42d5b81", "b6d6d545-2a04-4b3e-a574-43d8a228fb43"]
            },
            filterEndComponent: {
                template: ["6b2f34f7-1624-4173-b4fc-bf7ce80d6b3e"]
            },
            propagationDirection: 'backward',
            newIssueSchema: 'serviceUnavailableDueToInfrastructureFail'
        },
        { /* service unavailable */
            filterIssue: {
                type: ['Bug'],
                state: ['Open'],
                template: ['IssueTemplate'],
                characteristics: ['Call failed due to unavailability', 'Service unavailable']
            },
            filterRelation: {
                template: ["a90e2493-7bd0-4c4f-9529-2dcdde480ba7"],
            },
            filterStartComponent: {
                template: ["f038bccd-fdff-4b87-ae34-b409052182a9", "15146d59-ca2e-4874-9f69-556bb42d5b81"]
            },
            filterEndComponent: {
                template: ["f038bccd-fdff-4b87-ae34-b409052182a9"]
            },
            propagationDirection: 'backward',
            newIssueSchema: 'serviceUnavailableGeneral'
        },
        { /* Feature request propagation from downstream to upstream. Perhaps combine with domain model rules */
            filterIssue: {
                type: ['Feature'],
                state: ['Open'],
                template: ['IssueTemplate'],
                characteristics: ['Feature request - downstream to upstream']
            },
            filterRelation: {
                template: ["a90e2493-7bd0-4c4f-9529-2dcdde480ba7"],
            },
            filterStartComponent: {
                template: ["f038bccd-fdff-4b87-ae34-b409052182a9", "15146d59-ca2e-4874-9f69-556bb42d5b81"]
            },
            filterEndComponent: {
                template: ["f038bccd-fdff-4b87-ae34-b409052182a9"]
            },
            propagationDirection: 'forward',
            newIssueSchema: 'propagatedFeatureRequestDownToUp'
        },
        { /* Separate issue for upstream to downstream FR propagation to have less affected components */
            filterIssue: {
                type: ['Feature'],
                state: ['Open'],
                template: ['IssueTemplate'],
                characteristics: ['Feature request - upstream to downstream']
            },
            filterRelation: {
                template: ["a90e2493-7bd0-4c4f-9529-2dcdde480ba7"],
            },
            filterStartComponent: {
                template: ["f038bccd-fdff-4b87-ae34-b409052182a9", "15146d59-ca2e-4874-9f69-556bb42d5b81"]
            },
            filterEndComponent: {
                template: ["f038bccd-fdff-4b87-ae34-b409052182a9"]
            },
            propagationDirection: 'backward',
            newIssueSchema: 'propagatedFeatureRequestUpToDown'
        },
        { /* Unreachable Database */
            filterIssue: {
                type: ['Bug'],
                state: ['Open'],
                template: ['IssueTemplate'],
                characteristics: ['Database unreachable']
            },
            filterRelation: {
                template: ["19d8222e-b5e2-4a58-b2a6-003527bcfee5"],
            },
            filterStartComponent: {
                template: ["f038bccd-fdff-4b87-ae34-b409052182a9"]
            },
            filterEndComponent: {
                template: ["8c056afc-9d6e-4de1-bf5b-090dd2fe726c"]
            },
            propagationDirection: 'backward',
            newIssueSchema: 'dbUnreachableBug'
        },
        { /* DTO Parsing bug propagation */
            filterIssue: {
                type: ['Bug'],
                state: ['Open'],
                template: ['IssueTemplate'],
                characteristics: ['DTO parsing error']
            },
            filterRelation: {
                template: ["a90e2493-7bd0-4c4f-9529-2dcdde480ba7"],
            },
            filterStartComponent: {
                template: ["f038bccd-fdff-4b87-ae34-b409052182a9", "15146d59-ca2e-4874-9f69-556bb42d5b81"]
            },
            filterEndComponent: {
                template: ["f038bccd-fdff-4b87-ae34-b409052182a9"]
            },
            propagationDirection: 'backward',
            newIssueSchema: 'dtoParsingBug'
        }
    ]};