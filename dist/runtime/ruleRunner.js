function matchesRuleWhen(rule, payload) {
    if (!rule.when) {
        return true;
    }
    return Object.entries(rule.when).every(([key, value]) => {
        return payload[key] === value;
    });
}
function createConditionChecker({ features, state, ruleCooldowns, }) {
    return function passesConditions(conditions = []) {
        const now = Date.now();
        const passedCooldowns = [];
        for (const condition of conditions) {
            switch (condition.type) {
                case "feature_enabled":
                    if (!features[condition.feature]) {
                        return false;
                    }
                    break;
                case "not_hidden":
                    if (state.isHidden) {
                        return false;
                    }
                    break;
                case "mode_is":
                    if (state.mode !== condition.state) {
                        return false;
                    }
                    break;
                case "cooldown":
                    if (now - (ruleCooldowns.get(condition.key) ?? 0) < condition.duration) {
                        return false;
                    }
                    passedCooldowns.push({ key: condition.key, time: now });
                    break;
            }
        }
        passedCooldowns.forEach(({ key, time }) => ruleCooldowns.set(key, time));
        return true;
    };
}
export function bindRuntimeRuleEvents(options) {
    const { eventBus, rules, runActions, setLastEventLabel } = options;
    const passesConditions = createConditionChecker(options);
    const ruleEventNames = Array.from(new Set(rules.map((rule) => rule.event)));
    function runRules(eventName, payload) {
        setLastEventLabel(eventName);
        rules
            .filter((rule) => rule.event === eventName)
            .filter((rule) => matchesRuleWhen(rule, payload))
            .filter((rule) => passesConditions(rule.conditions))
            .forEach((rule) => {
            void runActions(rule.actions);
        });
    }
    ruleEventNames.forEach((eventName) => {
        eventBus.on(eventName, (payload) => runRules(eventName, payload));
    });
}
//# sourceMappingURL=ruleRunner.js.map