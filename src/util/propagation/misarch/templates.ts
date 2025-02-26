// Relation Templates
export const callsRelationTemplate: string = "db7a5554-21f1-4ccc-8f35-6a01f8f984b4";
export const hostedOnRelationTemplate: string = "22370a50-f24c-4d3b-b3c0-8c460d196264";
export const includesRelationTemplate: string = "c85ab2d9-66a5-46c2-bdb9-b1a6e8d593c6";
export const eventRelationTemplate: string = "bd59d49a-daa5-43c5-b840-176617fe6936";
// Component Templates
export const microserviceTemplate: string = "d7e5dc94-686a-44a4-9c97-bcb0a1c38295";
export const frontendTemplate: string = "f13a177d-a783-42c0-8810-0d20c613e41f";
export const logicalComponentTemplate: string[] = [microserviceTemplate, frontendTemplate];
export const libraryTemplate: string = "2f87d79d-aeab-4083-9fb0-327037e3d4d7";
export const infrastructureTemplate: string = "0d3d7d08-6a8c-429b-b7b1-b165ebe776bd";

export const issueTemplate: string = "1f1493e0-1557-4bee-8477-2c16c2bff8b4";

// interface templates
export const graphQLProvidedInterfaceTemplate: string = "a5247c11-470d-45f4-bd74-2516eae0d1cf";
export const graphQLRequiredInterfaceTemplate: string = "90892863-895e-4099-abd1-553d7a03d9aa";
export const messagingPublishInterfaceTemplate: string = "2dcc1e1b-3b1f-4c9a-8e12-432b15acf33d";
export const messagingSubscribeInterfaceTemplate: string = "1494903a-273b-4b24-a0b1-e36e0cb43d6c";
export const oauthProvidedInterfaceTemplate: string = "6c51aff7-e819-4ed6-a11c-33bf8873b5d3";
export const oauthRequiredInterfaceTemplate: string = "61eb6a13-5d0d-44da-82fb-0c7e615ac947";

// issue types
export const BUG = "029c9ca1-8566-4138-bf78-44d958b16ad2";
export const FEATURE = "d232728c-d5ae-4aa5-8416-93f4fa7a2128";

// issue states
export const OPEN = "5648e623-87b6-4479-af45-ad7e9df5ba1e";

// issue relation types
export const DEPENDS_ON = "54846b24-ee80-4c1a-abf8-062aa293a9be";

// ICDS types
export const ICDS_GG = "05d82ca1-b76b-4a42-b53d-176b7563eb42";
export const ICDS_EE = "0dab5dc8-af37-498a-afe1-532c3b266c77";
export const ICDS_EG_SD = "569e6379-4c04-4dda-89e9-da0bfcdc8e87";
export const ICDS_GE = "6519411a-11f8-4406-8134-78c4ba3c155d";

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