import type { RuntimePlugin } from "../core/types.js";
/**
 * Developer-facing Nanika configuration.
 * Character data and action rules are imported separately so the three public surfaces stay clear.
 */
export declare const nanikaConfig: {
    plugins: RuntimePlugin[];
    selectors: {
        stage: string;
        sprite: string;
        spriteImage: string;
        speechBalloon: string;
        speakerName: string;
        speechText: string;
        balloonActionMenu: string;
        panelActionMenu: string;
        menuButtons: string;
        restoreBadge: string;
        observeAreas: string;
    };
    devtools: {
        diagnostics: {
            selectors: {
                eventLog: string;
                statusMode: string;
                statusExpression: string;
                statusVisibility: string;
                statusLastEvent: string;
                statusIdleCountdown: string;
                statusRandomPrompt: string;
                statusActionTimers: string;
            };
        };
        hitboxEditor: {
            selectors: {
                editor: string;
                addButton: string;
                closeButton: string;
                body: string;
                copyButton: string;
            };
        };
    };
    managementMenu: {
        defaultDisplay: "balloon";
        displays: {
            "system-tools": "panel";
        };
    };
    features: {
        commandHoverDescription: true;
        debugHitAreas: true;
    };
    typing: {
        enabled: true;
        interval: number;
    };
    spriteSize: {
        desktopWidth: string;
        desktopHeight: string;
        mobileWidth: string;
        mobileHeight: string;
    };
};
//# sourceMappingURL=nanika.config.d.ts.map