/**
 * Health check controller
 * @returns {Object} Server health status
 */
export const healthCheckController = () => {
  return {
    status: 'OK',
    message: 'Backend server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
};
