export class Scheduler {
    static ALARM_NAME = 'weekly_newsletter_digest';

    static async createSchedule(dayOfWeek: number = 0, hour: number = 9): Promise<void> {
        // 0 = Sunday, 9 = 9 AM
        await chrome.alarms.clear(this.ALARM_NAME);

        const now = new Date();
        const nextRun = new Date();
        nextRun.setHours(hour, 0, 0, 0);

        // Calculate days until next run
        let daysUntil = dayOfWeek - now.getDay();
        if (daysUntil <= 0 || (daysUntil === 0 && now.getHours() >= hour)) {
            daysUntil += 7;
        }

        nextRun.setDate(now.getDate() + daysUntil);

        chrome.alarms.create(this.ALARM_NAME, {
            when: nextRun.getTime(),
            periodInMinutes: 10080 // 7 days
        });

        console.log(`Scheduled next run for: ${nextRun.toLocaleString()}`);
    }

    static async getNextRun(): Promise<number | null> {
        const alarm = await chrome.alarms.get(this.ALARM_NAME);
        return alarm ? alarm.scheduledTime : null;
    }
}
