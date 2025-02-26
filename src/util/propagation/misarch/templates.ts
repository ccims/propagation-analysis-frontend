// Relation Templates
export const callsRelationTemplate: string = "db7a5554-21f1-4ccc-8f35-6a01f8f984b4";
export const hostedOnRelationTemplate: string = "22370a50-f24c-4d3b-b3c0-8c460d196264";
export const includesRelationTemplate: string = "c85ab2d9-66a5-46c2-bdb9-b1a6e8d593c6";
export const eventRelationTemplate: string = "bd59d49a-daa5-43c5-b840-176617fe6936";
// Component Templates
export const microserviceTemplate: string = "d7e5dc94-686a-44a4-9c97-bcb0a1c38295";
export const frontendTemplate: string = "f13a177d-a783-42c0-8810-0d20c613e41f";
export const logicalComponentTemplate: string[] = [microserviceTemplate, frontendTemplate];
export const libraryTemplate: string = "TODO";
export const infrastructureTemplate: string = "TODO";

export const issueTemplate: string = "1f1493e0-1557-4bee-8477-2c16c2bff8b4";

// interface templates
export const graphQLProvidedInterfaceTemplate: string = "TODO";
export const graphQLRequiredInterfaceTemplate: string = "TODO";
export const messagingPublishInterfaceTemplate: string = "TODO";
export const messagingSubscribeInterfaceTemplate: string = "TODO";
export const oauthProvidedInterfaceTemplate: string = "TODO";
export const oauthRequiredInterfaceTemplate: string = "TODO";

// issue types
export const BUG = "029c9ca1-8566-4138-bf78-44d958b16ad2";
export const FEATURE = "d232728c-d5ae-4aa5-8416-93f4fa7a2128";

// issue states
export const OPEN = "5648e623-87b6-4479-af45-ad7e9df5ba1e";

// issue relation types
export const DEPENDS_ON = "54846b24-ee80-4c1a-abf8-062aa293a9be";

// ICDS types
export const ICDS_GG = "TODO";
export const ICDS_EE = "TODO";
export const ICDS_EG_SD = "TODO";
export const ICDS_GE = "TODO";

export enum Characteristics {
    ApiBreakingBug = "API breaking bug",
    ApiBreakingByzantineBug = "API breaking byzantine bug",
    LibraryVersionUpdate = "Library version update",
    LibraryBreakingChange = "Library breaking change",
    DtoBug = "DTO bug",
    DtoFeature = "DTO feature",
    FeatureRequestUpToDown = "Feature request - upstream to downstream",
    FeatureRequestDownToUp = "Feature request - downstream to upstream",
    MissingEventCall = "Missing event call",
    InfrastructureFailure = "Infrastructure failure",
    ServiceUnavailable = "Service unavailable",
    APIUsageBug = "API usage bug",

    // for propagation
    FrontendUnavailable = "Frontend unavailable",
    FailingServiceCall = "Failing service call",
}