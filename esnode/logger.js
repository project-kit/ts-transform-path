"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Logger configuration.
 *
 * @author Oleksandr Dakal <oleksandr-dakal@project-kit.org>
 */
const logConfig = {
    debugEnabled: false
};
/**
 * Console logger.
 *
 * @author Oleksandr Dakal <oleksandr-dakal@project-kit.org>
 */
exports.logger = {
    /**
     * Set debugEnabled state.
     *
     * @param enabled Enabled.
     */
    set debugEnabled(enabled) {
        logConfig.debugEnabled = enabled;
    },
    /**
     * Log debug message.
     *
     * @param message Message to log.
     */
    debug(message) {
        if (logConfig.debugEnabled) {
            console.log(message);
        }
    },
    /**
     * Log warning message.
     *
     * @param message Message to log.
     */
    warning(message) {
        console.warn(message);
    }
};
