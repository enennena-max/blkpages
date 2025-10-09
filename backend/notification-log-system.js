/**
 * Notification Log System
 * Tracks delivery status of confirmations and reminders for businesses
 * Maintains privacy by only showing delivery status, not message contents
 */

class NotificationLogSystem {
    constructor() {
        this.logStorageKey = 'notification_logs';
    }

    /**
     * Log notification delivery status
     * @param {string} bookingId - The booking ID
     * @param {string} notificationType - 'confirmation' or 'reminder'
     * @param {boolean} sent - Whether the notification was sent successfully
     * @param {string} method - 'email' or 'sms'
     * @param {string} timestamp - When the notification was sent
     */
    async logNotificationStatus(bookingId, notificationType, sent, method, timestamp = null) {
        try {
            const logs = this.getNotificationLogs();
            const logKey = `${bookingId}_${notificationType}_${method}`;
            
            logs[logKey] = {
                bookingId,
                notificationType,
                method,
                sent,
                timestamp: timestamp || new Date().toISOString(),
                // Privacy protection - no message content or customer details stored
                privacyNotice: 'Message contents and customer contact details are not stored'
            };
            
            this.saveNotificationLogs(logs);
            console.log(`Notification log updated: ${bookingId} - ${notificationType} (${method}) - ${sent ? 'Sent' : 'Failed'}`);
            
            return logs[logKey];
        } catch (error) {
            console.error('Failed to log notification status:', error);
            throw error;
        }
    }

    /**
     * Get notification status for a specific booking
     * @param {string} bookingId - The booking ID
     * @returns {object} Notification status object
     */
    async getBookingNotificationStatus(bookingId) {
        try {
            const logs = this.getNotificationLogs();
            const bookingLogs = {};
            
            // Find all logs for this booking
            Object.keys(logs).forEach(key => {
                if (key.startsWith(`${bookingId}_`)) {
                    const log = logs[key];
                    const statusKey = `${log.notificationType}_${log.method}`;
                    bookingLogs[statusKey] = {
                        sent: log.sent,
                        timestamp: log.timestamp,
                        method: log.method
                    };
                }
            });
            
            return {
                bookingId,
                confirmation_email: bookingLogs.confirmation_email?.sent || false,
                confirmation_sms: bookingLogs.confirmation_sms?.sent || false,
                reminder_email: bookingLogs.reminder_email?.sent || false,
                reminder_sms: bookingLogs.reminder_sms?.sent || false,
                // Privacy protection notice
                privacyNotice: 'Only delivery status is shown. Message contents and customer details are protected.'
            };
        } catch (error) {
            console.error('Failed to get booking notification status:', error);
            return {
                bookingId,
                confirmation_email: false,
                confirmation_sms: false,
                reminder_email: false,
                reminder_sms: false,
                privacyNotice: 'Notification status unavailable'
            };
        }
    }

    /**
     * Get all notification logs for a business
     * @param {string} businessId - The business ID
     * @returns {array} Array of notification logs for the business
     */
    async getBusinessNotificationLogs(businessId) {
        try {
            const logs = this.getNotificationLogs();
            const businessLogs = [];
            
            // Get all bookings for this business
            const businessBookings = JSON.parse(localStorage.getItem(`businessBookings_${businessId}`) || '[]');
            
            for (const booking of businessBookings) {
                const notificationStatus = await this.getBookingNotificationStatus(booking.id);
                businessLogs.push(notificationStatus);
            }
            
            return businessLogs;
        } catch (error) {
            console.error('Failed to get business notification logs:', error);
            return [];
        }
    }

    /**
     * Update notification status for a booking
     * @param {string} bookingId - The booking ID
     * @param {string} notificationType - 'confirmation' or 'reminder'
     * @param {string} method - 'email' or 'sms'
     * @param {boolean} sent - Whether the notification was sent
     */
    async updateNotificationStatus(bookingId, notificationType, method, sent) {
        try {
            await this.logNotificationStatus(bookingId, notificationType, sent, method);
            
            // Trigger notification status update event
            this.triggerNotificationStatusUpdateEvent(bookingId, notificationType, method, sent);
            
        } catch (error) {
            console.error('Failed to update notification status:', error);
        }
    }

    /**
     * Trigger notification status update event
     */
    triggerNotificationStatusUpdateEvent(bookingId, notificationType, method, sent) {
        try {
            const eventData = {
                bookingId,
                notificationType,
                method,
                sent,
                timestamp: new Date().toISOString(),
                privacyNotice: 'Only delivery status is shared. Message contents are protected.'
            };
            
            // Dispatch notification status update event
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('notification.status.update', {
                    detail: eventData
                }));
            }
            
            console.log('Notification status update event triggered:', eventData);
        } catch (error) {
            console.error('Failed to trigger notification status update event:', error);
        }
    }

    /**
     * Get all notification logs from storage
     */
    getNotificationLogs() {
        try {
            return JSON.parse(localStorage.getItem(this.logStorageKey) || '{}');
        } catch (error) {
            console.error('Failed to get notification logs:', error);
            return {};
        }
    }

    /**
     * Save notification logs to storage
     */
    saveNotificationLogs(logs) {
        try {
            localStorage.setItem(this.logStorageKey, JSON.stringify(logs));
        } catch (error) {
            console.error('Failed to save notification logs:', error);
        }
    }

    /**
     * Clear old notification logs (cleanup)
     * @param {number} daysOld - Number of days old to clear
     */
    async clearOldLogs(daysOld = 90) {
        try {
            const logs = this.getNotificationLogs();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            
            const filteredLogs = {};
            Object.keys(logs).forEach(key => {
                const log = logs[key];
                const logDate = new Date(log.timestamp);
                if (logDate > cutoffDate) {
                    filteredLogs[key] = log;
                }
            });
            
            this.saveNotificationLogs(filteredLogs);
            console.log(`Cleared notification logs older than ${daysOld} days`);
        } catch (error) {
            console.error('Failed to clear old logs:', error);
        }
    }

    /**
     * Get notification statistics for a business
     * @param {string} businessId - The business ID
     * @returns {object} Notification statistics
     */
    async getBusinessNotificationStats(businessId) {
        try {
            const logs = await this.getBusinessNotificationLogs(businessId);
            
            const stats = {
                totalBookings: logs.length,
                confirmationsSent: 0,
                confirmationsFailed: 0,
                remindersSent: 0,
                remindersFailed: 0,
                emailConfirmations: 0,
                smsConfirmations: 0,
                emailReminders: 0,
                smsReminders: 0
            };
            
            logs.forEach(log => {
                if (log.confirmation_email) stats.emailConfirmations++;
                if (log.confirmation_sms) stats.smsConfirmations++;
                if (log.reminder_email) stats.emailReminders++;
                if (log.reminder_sms) stats.smsReminders++;
                
                if (log.confirmation_email || log.confirmation_sms) {
                    stats.confirmationsSent++;
                } else {
                    stats.confirmationsFailed++;
                }
                
                if (log.reminder_email || log.reminder_sms) {
                    stats.remindersSent++;
                } else {
                    stats.remindersFailed++;
                }
            });
            
            return stats;
        } catch (error) {
            console.error('Failed to get business notification stats:', error);
            return {
                totalBookings: 0,
                confirmationsSent: 0,
                confirmationsFailed: 0,
                remindersSent: 0,
                remindersFailed: 0,
                emailConfirmations: 0,
                smsConfirmations: 0,
                emailReminders: 0,
                smsReminders: 0
            };
        }
    }
}

module.exports = NotificationLogSystem;
