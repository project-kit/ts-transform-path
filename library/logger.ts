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
export const logger = {
  /**
   * Set debugEnabled state.
   *
   * @param enabled Enabled.
   */
  set debugEnabled(enabled: boolean) {
    logConfig.debugEnabled = enabled;
  },

  /**
   * Log debug message.
   *
   * @param message Message to log.
   */
  debug(message: string): void {
    if (logConfig.debugEnabled) {
      console.log(message);
    }
  },

  /**
   * Log warning message.
   *
   * @param message Message to log.
   */
  warning(message: string): void {
    console.warn(message);
  }
};
